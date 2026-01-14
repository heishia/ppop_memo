"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    memo: {
        create: (data) => electron_1.ipcRenderer.invoke('memo:create', data),
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
        minimize: () => electron_1.ipcRenderer.invoke('window:minimize'),
        close: () => electron_1.ipcRenderer.invoke('window:close'),
        loadMemo: (memoId) => electron_1.ipcRenderer.invoke('window:loadMemo', memoId),
        createNew: () => electron_1.ipcRenderer.invoke('window:createNew'),
    },
    settings: {
        get: (key) => electron_1.ipcRenderer.invoke('settings:get', key),
        set: (key, value) => electron_1.ipcRenderer.invoke('settings:set', key, value),
        getAll: () => electron_1.ipcRenderer.invoke('settings:getAll'),
    },
    shell: {
        openPath: (path) => electron_1.ipcRenderer.invoke('shell:openPath', path),
    },
    on: (channel, callback) => {
        electron_1.ipcRenderer.on(channel, (_, ...args) => callback(...args));
    },
});
