"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMainWindow = createMainWindow;
exports.getMainWindow = getMainWindow;
exports.registerWindowIpcHandlers = registerWindowIpcHandlers;
const electron_1 = require("electron");
const node_path_1 = __importDefault(require("node:path"));
let mainWindow = null;
function createMainWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 1000,
        minHeight: 700,
        show: false,
        title: 'ExamDesk',
        titleBarStyle: 'hiddenInset',
        webPreferences: {
            preload: node_path_1.default.join(__dirname, '../preload/index.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
        },
    });
    const isDev = process.env['NODE_ENV'] === 'development';
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(node_path_1.default.join(__dirname, '../../dist/renderer/index.html'));
    }
    mainWindow.once('ready-to-show', () => mainWindow?.show());
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    return mainWindow;
}
function getMainWindow() {
    return mainWindow;
}
function registerWindowIpcHandlers(ipcMain) {
    ipcMain.handle('window:minimize', () => {
        mainWindow?.minimize();
    });
    ipcMain.handle('window:maximize', () => {
        if (mainWindow?.isMaximized())
            mainWindow?.unmaximize();
        else
            mainWindow?.maximize();
    });
    ipcMain.handle('window:close', () => {
        mainWindow?.close();
    });
}
