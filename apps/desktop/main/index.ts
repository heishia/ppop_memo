import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { initDatabase } from './database.js';
import { setupIpcHandlers } from './ipc-handlers.js';
import { WindowManager } from './window-manager.js';
import { setupFileHandler } from './file-handler.js';
import { setupAutoUpdater, checkForUpdates } from './updater.js';

let windowManager: WindowManager;

function createWindow() {
  windowManager = new WindowManager();
  
  app.whenReady().then(() => {
    initDatabase();
    setupIpcHandlers(windowManager);
    setupFileHandler(windowManager);
    
    const mainWindow = windowManager.createNewMemoWindow();
    
    setupAutoUpdater(mainWindow);
    
    setTimeout(() => {
      checkForUpdates();
    }, 3000);
    
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
