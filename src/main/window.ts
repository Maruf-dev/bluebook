import { BrowserWindow, shell } from 'electron';
import path from 'node:path';

// `npm run dev` starts Electron with --dev so it loads the Vite dev server.
export const isDev = process.argv.includes('--dev');
const DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'] ?? 'http://localhost:5173';

let mainWindow: BrowserWindow | null = null;

export function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    show: false,
    title: 'ExamDesk',
    autoHideMenuBar: true,
    webPreferences: {
      // compiled layout: dist/electron/main/window.js -> dist/electron/preload/index.js
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  mainWindow = win;

  // Never open new Electron windows; send external links to the system browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) void shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    const allowed = isDev ? url.startsWith(DEV_SERVER_URL) : url.startsWith('file://');
    if (!allowed) event.preventDefault();
  });

  if (isDev) {
    void win.loadURL(DEV_SERVER_URL);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    // dist/electron/main -> dist/renderer
    void win.loadFile(path.join(__dirname, '../../renderer/index.html'));
  }

  win.once('ready-to-show', () => win.show());
  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null;
  });

  return win;
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}
