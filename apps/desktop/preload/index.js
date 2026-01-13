"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    memo: {
        create: () => electron_1.ipcRenderer.invoke('memo:create'),
        get: (id) => electron_1.ipcRenderer.invoke('memo:get', id),
        update: (id, data) => electron_1.ipcRenderer.invoke('memo:update', id, data),
        delete: (id) => electron_1.ipcRenderer.invoke('memo:delete', id),
        list: () => electron_1.ipcRenderer.invoke('memo:list'),
        search: (query) => electron_1.ipcRenderer.invoke('memo:search', query),
        moveToFolder: (memoId, folderId) => electron_1.ipcRenderer.invoke('memo:moveToFolder', memoId, folderId),
    },
    folder: {
        create: (name, parentId) => electron_1.ipcRenderer.invoke('folder:create', name, parentId),
        list: () => electron_1.ipcRenderer.invoke('folder:list'),
        delete: (id) => electron_1.ipcRenderer.invoke('folder:delete', id),
    },
    window: {
        setAlwaysOnTop: (windowId, alwaysOnTop) => electron_1.ipcRenderer.invoke('window:setAlwaysOnTop', windowId, alwaysOnTop),
        saveState: (windowId, state) => electron_1.ipcRenderer.invoke('window:saveState', windowId, state),
        getId: () => electron_1.ipcRenderer.sendSync('window:getId'),
    },
    on: (channel, callback) => {
        electron_1.ipcRenderer.on(channel, (_, ...args) => callback(...args));
    },
});
