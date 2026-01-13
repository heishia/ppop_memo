import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { initDatabase } from './database';
import { setupIpcHandlers } from './ipc-handlers';
import { WindowManager } from './window-manager';
import { setupFileHandler } from './file-handler';

let windowManager: WindowManager;

function createWindow() {
  windowManager = new WindowManager();
  
  app.whenReady().then(() => {
    initDatabase();
    setupIpcHandlers(windowManager);
    setupFileHandler(windowManager);
    
    windowManager.createNewMemoWindow();
    
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        windowManager.createNewMemoWindow();
      }
    });
  });
  
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}

app.on('ready', createWindow);
