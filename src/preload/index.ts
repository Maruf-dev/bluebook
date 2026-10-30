import { contextBridge, ipcRenderer } from 'electron';
import type { IPCResponse } from '@shared/types';

// Strictly typed allowlist of channels the renderer may invoke
const ALLOWED_SEND_CHANNELS = new Set([
  'db:init',
  'db:get_tests',
  'db:get_test',
  'db:save_attempt',
  'db:get_attempt',
  'db:get_attempts',
  'db:save_response',
  'db:import_test',
  'window:minimize',
  'window:maximize',
  'window:close',
  'app:get_version',
  'app:get_path',
]);

const ALLOWED_RECEIVE_CHANNELS = new Set([
  'db:init',
  'db:get_tests',
  'db:get_test',
  'db:save_attempt',
  'db:get_attempt',
  'db:get_attempts',
  'db:save_response',
  'db:import_test',
  'app:get_version',
  'app:get_path',
]);

contextBridge.exposeInMainWorld('examDeskAPI', {
  invoke: <T = unknown>(channel: string, payload?: unknown): Promise<IPCResponse<T>> => {
    if (!ALLOWED_SEND_CHANNELS.has(channel)) {
      throw new Error(`IPC channel not allowed: ${channel}`);
    }
    return ipcRenderer.invoke(channel, payload);
  },
  on: (channel: string, listener: (event: Electron.IpcRendererEvent, ...args: unknown[]) => void) => {
    if (!ALLOWED_RECEIVE_CHANNELS.has(channel)) {
      throw new Error(`IPC receive channel not allowed: ${channel}`);
    }
    const subscription = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => {
      listener(_event, ...args);
    };
    ipcRenderer.on(channel, subscription);
    return {
      remove: () => ipcRenderer.removeListener(channel, subscription),
    };
  },
  send: (channel: string, payload?: unknown) => {
    if (!ALLOWED_SEND_CHANNELS.has(channel)) {
      throw new Error(`IPC channel not allowed: ${channel}`);
    }
    ipcRenderer.send(channel, payload);
  },
  getVersion: () => ipcRenderer.invoke('app:get_version'),
  getPath: (name: string) => ipcRenderer.invoke('app:get_path', { name }),
});

declare global {
  interface Window {
    examDeskAPI: {
      invoke: <T = unknown>(channel: string, payload?: unknown) => Promise<IPCResponse<T>>;
      on: (
        channel: string,
        listener: (event: Electron.IpcRendererEvent, ...args: unknown[]) => void
      ) => { remove: () => void };
      send: (channel: string, payload?: unknown) => void;
      getVersion: () => Promise<{ success: boolean; data?: string; error?: string }>;
      getPath: (name: string) => Promise<{ success: boolean; data?: string; error?: string }>;
    };
  }
}
