"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupIpcHandlers = setupIpcHandlers;
const electron_1 = require("electron");
const database_1 = require("./database");
function setupIpcHandlers(windowManager) {
    electron_1.ipcMain.handle('memo:create', async () => {
        const db = (0, database_1.getDatabase)();
        const result = db.prepare('INSERT INTO memos (content) VALUES (?)').run('');
        return { id: result.lastInsertRowid, content: '', mode: 'text' };
    });
    electron_1.ipcMain.handle('memo:get', async (_, id) => {
        const db = (0, database_1.getDatabase)();
        const memo = db.prepare('SELECT * FROM memos WHERE id = ?').get(id);
        return memo;
    });
    electron_1.ipcMain.handle('memo:update', async (_, id, data) => {
        const db = (0, database_1.getDatabase)();
        const updates = [];
        const values = [];
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
    electron_1.ipcMain.handle('memo:delete', async (_, id) => {
        const db = (0, database_1.getDatabase)();
        db.prepare('DELETE FROM memos WHERE id = ?').run(id);
        return { success: true };
    });
    electron_1.ipcMain.handle('memo:list', async () => {
        const db = (0, database_1.getDatabase)();
        const memos = db.prepare('SELECT * FROM memos ORDER BY updated_at DESC').all();
        return memos;
    });
    electron_1.ipcMain.handle('memo:search', async (_, query) => {
        const db = (0, database_1.getDatabase)();
        const searchTerm = `%${query}%`;
        const memos = db.prepare('SELECT * FROM memos WHERE (title IS NOT NULL AND title LIKE ?) OR content LIKE ? ORDER BY updated_at DESC').all(searchTerm, searchTerm);
        return memos;
    });
    electron_1.ipcMain.handle('folder:create', async (_, name, parentId) => {
        const db = (0, database_1.getDatabase)();
        const result = db.prepare('INSERT INTO folders (name, parent_id) VALUES (?, ?)').run(name, parentId || null);
        return { id: result.lastInsertRowid, name, parent_id: parentId || null };
    });
    electron_1.ipcMain.handle('folder:list', async () => {
        const db = (0, database_1.getDatabase)();
        const folders = db.prepare('SELECT * FROM folders ORDER BY name').all();
        return folders;
    });
    electron_1.ipcMain.handle('folder:delete', async (_, id) => {
        const db = (0, database_1.getDatabase)();
        db.prepare('DELETE FROM folders WHERE id = ?').run(id);
        db.prepare('UPDATE memos SET folder_id = NULL WHERE folder_id = ?').run(id);
        return { success: true };
    });
    electron_1.ipcMain.handle('memo:moveToFolder', async (_, memoId, folderId) => {
        const db = (0, database_1.getDatabase)();
        db.prepare('UPDATE memos SET folder_id = ? WHERE id = ?').run(folderId || null, memoId);
        return { success: true };
    });
    electron_1.ipcMain.handle('window:setAlwaysOnTop', async (_, windowId, alwaysOnTop) => {
        const win = windowManager.getWindow(windowId);
        if (win) {
            win.setAlwaysOnTop(alwaysOnTop);
            return { success: true };
        }
        return { success: false };
    });
    electron_1.ipcMain.handle('window:saveState', async (_, windowId, state) => {
        const db = (0, database_1.getDatabase)();
        db.prepare('UPDATE memos SET window_state = ? WHERE id = ?').run(JSON.stringify(state), windowId);
        return { success: true };
    });
    electron_1.ipcMain.on('window:getId', (event) => {
        event.returnValue = event.sender.id;
    });
}
