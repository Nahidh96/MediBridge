import type { MediBridgeApi } from '@shared/api';

declare global {
  interface Window {
    mediBridgeApi?: MediBridgeApi;
    api?: MediBridgeApi;
  }
}

export {};
