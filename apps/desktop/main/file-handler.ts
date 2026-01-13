import { app, dialog, BrowserWindow } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { WindowManager } from './window-manager';
import { getDatabase } from './database';

export function setupFileHandler(windowManager: WindowManager): void {
  if (process.platform === 'win32') {
    app.setAsDefaultProtocolClient('ppop-memo');
  }
  
  app.on('open-file', async (event, filePath) => {
    event.preventDefault();
    
    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath).toLowerCase();
      if (ext === '.txt' || ext === '.md') {
        const content = fs.readFileSync(filePath, 'utf-8');
        const db = getDatabase();
        const result = db.prepare('INSERT INTO memos (content) VALUES (?)').run(content);
        
        const win = windowManager.createNewMemoWindow(result.lastInsertRowid as number);
        win.webContents.once('did-finish-load', () => {
          win.webContents.send('memo:load', result.lastInsertRowid);
        });
      }
    }
  });
  
  const args = process.argv.slice(1);
  if (args.length > 0) {
    const filePath = args[0];
    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath).toLowerCase();
      if (ext === '.txt' || ext === '.md') {
        const content = fs.readFileSync(filePath, 'utf-8');
        const db = getDatabase();
        const result = db.prepare('INSERT INTO memos (content) VALUES (?)').run(content);
      }
    }
  }
}
