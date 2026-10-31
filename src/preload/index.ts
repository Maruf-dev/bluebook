import { contextBridge, ipcRenderer } from 'electron';
import type { IPCResponse } from '../shared/types';

// The preload runs sandboxed, so it must stay self-contained (only `electron` can be required).
// Keep this list in sync with the handlers in src/main/ipc/index.ts.
const ALLOWED_CHANNELS = new Set([
  'db:get_tests',
  'db:get_test',
  'db:import_test',
  'db:save_attempt',
  'db:get_attempt',
  'db:get_attempts',
  'db:save_response',
  'app:get_version',
]);

contextBridge.exposeInMainWorld('examDeskAPI', {
  invoke: <T = unknown>(channel: string, payload?: unknown): Promise<IPCResponse<T>> => {
    if (!ALLOWED_CHANNELS.has(channel)) {
      return Promise.reject(new Error(`IPC channel not allowed: ${channel}`));
    }
    return ipcRenderer.invoke(channel, payload);
  },
});
