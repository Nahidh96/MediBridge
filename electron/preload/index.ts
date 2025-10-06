import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../ipc/channels';
import type { MediBridgeApi } from '@shared/api';
import type { SetupAnswers } from '@shared/setup';
import type {
  AppointmentPayload,
  BillingPayload,
  CollaborationPayload,
  InventoryPayload,
  MedicalCertificatePayload,
  PatientPayload,
  PrescriptionPayload
} from '@shared/payloads';

const api: MediBridgeApi = {
  setup: {
    isComplete: () => ipcRenderer.invoke(IPC_CHANNELS.SETUP_IS_COMPLETE),
    getProfile: () => ipcRenderer.invoke(IPC_CHANNELS.SETUP_GET_PROFILE),
    completeSetup: (payload: SetupAnswers) => ipcRenderer.invoke(IPC_CHANNELS.SETUP_COMPLETE, payload)
  },
  modules: {
    getModules: () => ipcRenderer.invoke(IPC_CHANNELS.MODULES_GET_ENABLED),
    updateModules: (modules: string[]) => ipcRenderer.invoke(IPC_CHANNELS.MODULES_UPDATE, { modules })
  },
  patients: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.PATIENT_LIST),
    add: (payload: PatientPayload) => ipcRenderer.invoke(IPC_CHANNELS.PATIENT_ADD, payload)
  },
  appointments: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.APPOINTMENT_LIST),
    add: (payload: AppointmentPayload) => ipcRenderer.invoke(IPC_CHANNELS.APPOINTMENT_ADD, payload)
  },
  prescriptions: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.PRESCRIPTION_LIST),
    add: (payload: PrescriptionPayload) => ipcRenderer.invoke(IPC_CHANNELS.PRESCRIPTION_ADD, payload)
  },
  billing: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.BILLING_LIST),
    recordPayment: (payload: BillingPayload) =>
      ipcRenderer.invoke(IPC_CHANNELS.BILLING_RECORD_PAYMENT, payload)
  },
  inventory: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.INVENTORY_LIST),
    upsert: (payload: InventoryPayload) => ipcRenderer.invoke(IPC_CHANNELS.INVENTORY_UPDATE, payload)
  },
  analytics: {
    overview: () => ipcRenderer.invoke(IPC_CHANNELS.ANALYTICS_OVERVIEW)
  },
  collaboration: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.COLLABORATION_LIST),
    add: (payload: CollaborationPayload) => ipcRenderer.invoke(IPC_CHANNELS.COLLABORATION_ADD, payload)
  },
  medicalCertificates: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.MEDICAL_CERT_LIST),
    add: (payload: MedicalCertificatePayload) => ipcRenderer.invoke(IPC_CHANNELS.MEDICAL_CERT_ADD, payload)
  }
};

const globalScope = globalThis as typeof globalThis & { __MEDIBRIDGE_BRIDGE_READY__?: boolean };

contextBridge.exposeInMainWorld('mediBridgeApi', api);

// Legacy alias for compatibility (can be removed once renderer fully migrates).
contextBridge.exposeInMainWorld('api', api);

globalScope.__MEDIBRIDGE_BRIDGE_READY__ = true;

try {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mediBridge:bridge-ready'));
  }
} catch (error) {
  console.error('[Preload] Failed to emit bridge-ready event', error);
}

type BridgeMessage = {
  source: 'mediBridge';
  type: 'bridge-call';
  requestId: string;
  path: string[];
  args?: unknown[];
};

type BridgeResponse = {
  source: 'mediBridge';
  type: 'bridge-response';
  requestId: string;
  success: boolean;
  result?: unknown;
  error?: string;
};

if (typeof window !== 'undefined') {
  console.log('[Preload] Registering postMessage handler for bridge fallback');
  
  window.addEventListener('message', async (event: MessageEvent) => {
    const data = event.data as BridgeMessage;

    if (!data || data.source !== 'mediBridge' || data.type !== 'bridge-call') {
      return;
    }

    console.log(`[Preload] Received bridge-call: ${data.path?.join('.') || '<unknown>'} (requestId: ${data.requestId})`);

    // Only honour calls originating from the same window context.
    if (event.source !== window) {
      console.warn('[Preload] Ignoring bridge-call from external source');
      return;
    }

    const safeOrigin = event.origin && event.origin !== 'null' ? event.origin : '*';
    const targetWindow = event.source as (Window & typeof globalThis) | null;

    if (!targetWindow) {
      console.error('[Preload] targetWindow is null');
      return;
    }

    const respond = (response: BridgeResponse) => {
      console.log(`[Preload] Responding to ${data.requestId}: ${response.success ? 'success' : `error - ${response.error}`}`);
      targetWindow.postMessage(response, safeOrigin);
    };

    try {
      const path = Array.isArray(data.path) ? data.path : [];
      let target: unknown = api;

      for (const segment of path) {
        if (target && typeof target === 'object' && segment in target) {
          target = (target as Record<string, unknown>)[segment];
        } else {
          throw new Error(`Unknown bridge path: ${path.join('.') || '<root>'}`);
        }
      }

      if (typeof target !== 'function') {
        throw new Error(`Bridge target at ${path.join('.')} is not callable.`);
      }

      const result = await (target as (...fnArgs: unknown[]) => unknown)(...(data.args ?? []));
      respond({
        source: 'mediBridge',
        type: 'bridge-response',
        requestId: data.requestId,
        success: true,
        result
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[Preload] Bridge call error: ${message}`);
      respond({
        source: 'mediBridge',
        type: 'bridge-response',
        requestId: data.requestId,
        success: false,
        error: message
      });
    }
  });
}
