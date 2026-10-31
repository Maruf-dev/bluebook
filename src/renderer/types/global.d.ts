import type { IPCResponse } from '@shared/types';

declare global {
  interface Window {
    /** Exposed by src/preload/index.ts. Undefined when the renderer runs outside Electron. */
    examDeskAPI?: {
      invoke: <T = unknown>(channel: string, payload?: unknown) => Promise<IPCResponse<T>>;
    };
  }
}

export {};
