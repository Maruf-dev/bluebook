"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
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
electron_1.contextBridge.exposeInMainWorld('examDeskAPI', {
    invoke: (channel, payload) => {
        if (!ALLOWED_SEND_CHANNELS.has(channel)) {
            throw new Error(`IPC channel not allowed: ${channel}`);
        }
        return electron_1.ipcRenderer.invoke(channel, payload);
    },
    on: (channel, listener) => {
        if (!ALLOWED_RECEIVE_CHANNELS.has(channel)) {
            throw new Error(`IPC receive channel not allowed: ${channel}`);
        }
        const subscription = (_event, ...args) => {
            listener(_event, ...args);
        };
        electron_1.ipcRenderer.on(channel, subscription);
        return {
            remove: () => electron_1.ipcRenderer.removeListener(channel, subscription),
        };
    },
    send: (channel, payload) => {
        if (!ALLOWED_SEND_CHANNELS.has(channel)) {
            throw new Error(`IPC channel not allowed: ${channel}`);
        }
        electron_1.ipcRenderer.send(channel, payload);
    },
    getVersion: () => electron_1.ipcRenderer.invoke('app:get_version'),
    getPath: (name) => electron_1.ipcRenderer.invoke('app:get_path', { name }),
});
