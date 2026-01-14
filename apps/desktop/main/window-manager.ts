import { BrowserWindow, screen } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class WindowManager {
  private windows: Map<number, BrowserWindow> = new Map();
  
  createNewMemoWindow(memoId?: number): BrowserWindow {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    
    const win = new BrowserWindow({
      width: 400,
      height: 500,
      minWidth: 300,
      minHeight: 350,
      x: Math.floor((width - 400) / 2),
      y: Math.floor((height - 500) / 2),
      webPreferences: {
        spellcheck: false,
        preload: path.join(__dirname, '../preload/index.js'),
        nodeIntegration: false,
        contextIsolation: true,
      },
      frame: false,
      alwaysOnTop: false,
      titleBarStyle: 'hidden',
    });
    
    if (process.env.NODE_ENV === 'development') {
      const port = process.env.VITE_PORT || '3000';
      win.loadURL(`http://localhost:${port}`);
      win.webContents.openDevTools();
    } else {
      win.loadFile(path.join(__dirname, '../../../../dist/renderer/index.html'));
    }
    
    this.windows.set(win.id, win);
    
    win.on('moved', () => {
      this.saveWindowState(win);
    });
    
    win.on('resized', () => {
      this.saveWindowState(win);
    });
    
    win.on('closed', () => {
      this.windows.delete(win.id);
    });
    
    return win;
  }
  
  private saveWindowState(win: BrowserWindow): void {
    const bounds = win.getBounds();
    const alwaysOnTop = win.isAlwaysOnTop();
    
    win.webContents.send('window:state-changed', {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      alwaysOnTop,
    });
  }
  
  getWindow(windowId: number): BrowserWindow | undefined {
    return this.windows.get(windowId);
  }
  
  getAllWindows(): BrowserWindow[] {
    return Array.from(this.windows.values());
  }
}
