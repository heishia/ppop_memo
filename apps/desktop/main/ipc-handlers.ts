import { ipcMain } from 'electron';
import { getDatabase } from './database';
import { WindowManager } from './window-manager';

export function setupIpcHandlers(windowManager: WindowManager): void {
  ipcMain.handle('memo:create', async (_, data?: { title?: string; content?: string; canvas_data?: string | null; mode?: string; folder_id?: number | null }) => {
    const db = getDatabase();
    
    if (data) {
      const columns: string[] = [];
      const placeholders: string[] = [];
      const values: any[] = [];
      
      if (data.title !== undefined) {
        columns.push('title');
        placeholders.push('?');
        values.push(data.title);
      }
      if (data.content !== undefined) {
        columns.push('content');
        placeholders.push('?');
        values.push(data.content);
      }
      if (data.canvas_data !== undefined) {
        columns.push('canvas_data');
        placeholders.push('?');
        values.push(data.canvas_data);
      }
      if (data.mode !== undefined) {
        columns.push('mode');
        placeholders.push('?');
        values.push(data.mode);
      }
      if (data.folder_id !== undefined) {
        columns.push('folder_id');
        placeholders.push('?');
        values.push(data.folder_id);
      }
      
      if (columns.length === 0) {
        columns.push('content');
        placeholders.push('?');
        values.push('');
      }
      
      const result = db.prepare(`INSERT INTO memos (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`).run(...values);
      const newMemo = db.prepare('SELECT * FROM memos WHERE id = ?').get(result.lastInsertRowid);
      return newMemo;
    }
    
    const result = db.prepare('INSERT INTO memos (content) VALUES (?)').run('');
    return { id: result.lastInsertRowid, content: '', mode: 'text' };
  });
  
  ipcMain.handle('memo:get', async (_, id: number) => {
    const db = getDatabase();
    const memo = db.prepare('SELECT * FROM memos WHERE id = ?').get(id);
    return memo;
  });
  
  ipcMain.handle('memo:update', async (_, id: number, data: { title?: string; content?: string; canvas_data?: string; mode?: string }) => {
    const db = getDatabase();
    const updates: string[] = [];
    const values: any[] = [];
    
    if (data.title !== undefined) {
      updates.push('title = ?');
      values.push(data.title);
    }
    if (data.content !== undefined) {
      updates.push('content = ?');
      values.push(data.content);
    }
    if (data.canvas_data !== undefined) {
      updates.push('canvas_data = ?');
      values.push(data.canvas_data);
    }
    if (data.mode !== undefined) {
      updates.push('mode = ?');
      values.push(data.mode);
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    db.prepare(`UPDATE memos SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    return { success: true };
  });
  
  ipcMain.handle('memo:delete', async (_, id: number) => {
    const db = getDatabase();
    db.prepare('DELETE FROM memos WHERE id = ?').run(id);
    return { success: true };
  });
  
  ipcMain.handle('memo:list', async () => {
    const db = getDatabase();
    const memos = db.prepare('SELECT * FROM memos ORDER BY updated_at DESC').all();
    return memos;
  });
  
  ipcMain.handle('memo:search', async (_, query: string) => {
    const db = getDatabase();
    const searchTerm = `%${query}%`;
    const memos = db.prepare('SELECT * FROM memos WHERE (title IS NOT NULL AND title LIKE ?) OR content LIKE ? ORDER BY updated_at DESC').all(searchTerm, searchTerm);
    return memos;
  });
  
  ipcMain.handle('folder:create', async (_, name: string, parentId?: number) => {
    const db = getDatabase();
    const result = db.prepare('INSERT INTO folders (name, parent_id) VALUES (?, ?)').run(name, parentId || null);
    return { id: result.lastInsertRowid, name, parent_id: parentId || null };
  });
  
  ipcMain.handle('folder:list', async () => {
    const db = getDatabase();
    const folders = db.prepare('SELECT * FROM folders ORDER BY name').all();
    return folders;
  });
  
  ipcMain.handle('folder:delete', async (_, id: number) => {
    const db = getDatabase();
    db.prepare('DELETE FROM folders WHERE id = ?').run(id);
    db.prepare('UPDATE memos SET folder_id = NULL WHERE folder_id = ?').run(id);
    return { success: true };
  });
  
  ipcMain.handle('memo:moveToFolder', async (_, memoId: number, folderId?: number) => {
    const db = getDatabase();
    db.prepare('UPDATE memos SET folder_id = ? WHERE id = ?').run(folderId || null, memoId);
    return { success: true };
  });
  
  ipcMain.handle('window:setAlwaysOnTop', async (_, windowId: number, alwaysOnTop: boolean) => {
    const win = windowManager.getWindow(windowId);
    if (win) {
      win.setAlwaysOnTop(alwaysOnTop);
      return { success: true };
    }
    return { success: false };
  });
  
  ipcMain.handle('window:saveState', async (_, windowId: number, state: { x: number; y: number; width: number; height: number; alwaysOnTop: boolean }) => {
    const db = getDatabase();
    db.prepare('UPDATE memos SET window_state = ? WHERE id = ?').run(JSON.stringify(state), windowId);
    return { success: true };
  });
  
  ipcMain.on('window:getId', (event) => {
    event.returnValue = event.sender.id;
  });

  ipcMain.handle('window:minimize', async (event) => {
    const win = windowManager.getWindow(event.sender.id);
    if (win) {
      win.minimize();
      return { success: true };
    }
    return { success: false };
  });

  ipcMain.handle('window:close', async (event) => {
    const win = windowManager.getWindow(event.sender.id);
    if (win) {
      win.close();
      return { success: true };
    }
    return { success: false };
  });

  ipcMain.handle('window:loadMemo', async (event, memoId: number) => {
    const currentWin = windowManager.getWindow(event.sender.id);
    if (currentWin) {
      currentWin.webContents.send('memo:load', memoId);
      return { success: true };
    }
    return { success: false };
  });
}
