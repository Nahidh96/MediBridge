import type { MediBridgeApi } from '@shared/api';

const BRIDGE_POLL_INTERVAL_MS = 50;
const BRIDGE_WAIT_TIMEOUT_MS = 10000;
const POST_MESSAGE_CALL_TIMEOUT_MS = 15000;
const BRIDGE_READY_EVENT = 'mediBridge:bridge-ready';

let cachedBridge: MediBridgeApi | undefined;

type PendingPostMessageRequest = {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  timeoutId: number;
};

const pendingPostMessageRequests = new Map<string, PendingPostMessageRequest>();

let postMessageBridge: MediBridgeApi | undefined;
let postMessageListenerRegistered = false;

const globalScope = globalThis as typeof globalThis & {
  mediBridgeApi?: MediBridgeApi;
  api?: MediBridgeApi;
  __MEDIBRIDGE_BRIDGE_READY__?: boolean;
};

export class BridgeUnavailableError extends Error {
  constructor(message = 'The Electron preload bridge is unavailable. Please relaunch the MediBridge app from its desktop shortcut.') {
    super(message);
    this.name = 'BridgeUnavailableError';
  }
}

function locateBridge(): MediBridgeApi | undefined {
  if (cachedBridge) {
    return cachedBridge;
  }

  const candidate = globalScope.mediBridgeApi ?? globalScope.api ?? (typeof window !== 'undefined'
    ? (window as typeof window & { mediBridgeApi?: MediBridgeApi; api?: MediBridgeApi }).mediBridgeApi ?? (window as typeof window & { api?: MediBridgeApi }).api
    : undefined);

  if (candidate) {
    cachedBridge = candidate;
  } else if (postMessageBridge) {
    cachedBridge = postMessageBridge;
  }

  return cachedBridge;
}

export function getElectronApi(): MediBridgeApi | undefined {
  return locateBridge();
}

export function requireElectronApi(): MediBridgeApi {
  const api = locateBridge();

  if (api) {
    return api;
  }

  try {
    const fallback = ensurePostMessageBridge();
    cachedBridge = fallback;
    return fallback;
  } catch (error) {
    throw error instanceof BridgeUnavailableError ? error : new BridgeUnavailableError();
  }
}

export async function waitForElectronApi(options?: {
  timeoutMs?: number;
  pollIntervalMs?: number;
}): Promise<MediBridgeApi> {
  const timeoutMs = options?.timeoutMs ?? BRIDGE_WAIT_TIMEOUT_MS;
  const pollIntervalMs = options?.pollIntervalMs ?? BRIDGE_POLL_INTERVAL_MS;

  const existing = locateBridge();
  if (existing) {
    console.log('[electronApi] Bridge already available');
    return existing;
  }

  console.log('[electronApi] Bridge not immediately available, waiting...');

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      console.error('[electronApi] Window is undefined');
      reject(new BridgeUnavailableError());
      return;
    }

    let settled = false;
    let timeoutId: number | undefined;
    let intervalId: number | undefined;

    const cleanup = () => {
      window.removeEventListener(BRIDGE_READY_EVENT, onBridgeReady);
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
      if (intervalId !== undefined) {
        clearInterval(intervalId);
      }
    };

    const tryResolve = () => {
      const api = locateBridge();
      if (api && !settled) {
        console.log('[electronApi] Direct bridge now available');
        settled = true;
        cleanup();
        resolve(api);
        return true;
      }
      return false;
    };

    const onBridgeReady = () => {
      console.log('[electronApi] Received bridge-ready event');
      void tryResolve();
    };

    window.addEventListener(BRIDGE_READY_EVENT, onBridgeReady, { once: true });

    intervalId = pollIntervalMs > 0 ? window.setInterval(() => {
      void tryResolve();
    }, pollIntervalMs) : undefined;

    timeoutId = window.setTimeout(() => {
      if (!settled) {
        console.warn('[electronApi] Direct bridge timeout, using postMessage fallback');
        try {
          const fallback = ensurePostMessageBridge();
          cachedBridge = fallback;
          settled = true;
          cleanup();
          console.log('[electronApi] postMessage fallback ready');
          resolve(fallback);
        } catch (error) {
          console.error('[electronApi] postMessage fallback failed', error);
          settled = true;
          cleanup();
          reject(error instanceof Error ? error : new BridgeUnavailableError());
        }
      }
    }, timeoutMs);

    // If preload flagged readiness before listeners attached, resolve immediately.
    if (globalScope.__MEDIBRIDGE_BRIDGE_READY__) {
      console.log('[electronApi] __MEDIBRIDGE_BRIDGE_READY__ flag detected');
      void tryResolve();
    } else {
      // Attempt at least once right away.
      void tryResolve();
    }
  });
}

function generateRequestId(): string {
  return `mediBridge-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function registerPostMessageListener(): void {
  if (postMessageListenerRegistered || typeof window === 'undefined') {
    return;
  }

  console.log('[electronApi] Registering postMessage listener');

  window.addEventListener('message', (event: MessageEvent) => {
    const data = event.data as {
      source?: string;
      type?: string;
      requestId?: string;
      success?: boolean;
      result?: unknown;
      error?: string;
    };

    if (!data || data.source !== 'mediBridge' || data.type !== 'bridge-response') {
      return;
    }

    if (event.source !== window) {
      return;
    }

    const requestId = data.requestId;
    if (!requestId) {
      return;
    }

    const pending = pendingPostMessageRequests.get(requestId);
    if (!pending) {
      return;
    }

    pendingPostMessageRequests.delete(requestId);
    clearTimeout(pending.timeoutId);

    if (data.success) {
      console.log(`[electronApi] postMessage response for ${requestId}: success`);
      pending.resolve(data.result);
    } else {
      const errorMessage = data.error ?? 'Bridge call failed.';
      console.error(`[electronApi] postMessage response for ${requestId}: error - ${errorMessage}`);
      pending.reject(new Error(errorMessage));
    }
  });

  postMessageListenerRegistered = true;
}

function invokeViaPostMessage(path: string[], args: unknown[]): Promise<unknown> {
  if (typeof window === 'undefined') {
    return Promise.reject(new BridgeUnavailableError());
  }

  registerPostMessageListener();

  return new Promise((resolve, reject) => {
    const requestId = generateRequestId();

    console.log(`[electronApi] Sending postMessage call ${requestId} for ${path.join('.')}`);

    const timeoutId = window.setTimeout(() => {
      if (pendingPostMessageRequests.has(requestId)) {
        pendingPostMessageRequests.delete(requestId);
        console.error(`[electronApi] Timeout for postMessage call ${requestId}`);
        reject(new BridgeUnavailableError('Timed out waiting for the Electron bridge response.'));
      }
    }, POST_MESSAGE_CALL_TIMEOUT_MS);

    pendingPostMessageRequests.set(requestId, { resolve, reject, timeoutId });

    window.postMessage(
      {
        source: 'mediBridge',
        type: 'bridge-call',
        requestId,
        path,
        args
      },
      '*'
    );
  });
}

function createPostMessageProxy(path: string[]): unknown {
  const target = () => undefined;

  return new Proxy(target, {
    get(_unused, property) {
      if (property === 'then' && path.length === 0) {
        // Allow await to work without treating the proxy as a Promise.
        return undefined;
      }

      return createPostMessageProxy([...path, property.toString()]);
    },
    apply(_unused, _thisArg, args: unknown[]) {
      if (path.length === 0) {
        throw new Error('Cannot invoke the bridge root proxy directly.');
      }

      return invokeViaPostMessage(path, args);
    }
  });
}

function ensurePostMessageBridge(): MediBridgeApi {
  if (postMessageBridge) {
    console.log('[electronApi] Reusing existing postMessage bridge');
    return postMessageBridge;
  }

  if (typeof window === 'undefined') {
    console.error('[electronApi] Cannot create postMessage bridge: window is undefined');
    throw new BridgeUnavailableError();
  }

  console.log('[electronApi] Creating postMessage bridge proxy');
  registerPostMessageListener();
  postMessageBridge = createPostMessageProxy([]) as MediBridgeApi;
  cachedBridge = postMessageBridge;

  return postMessageBridge;
}
