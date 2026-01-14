import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  memo: {
    create: (data?: any) => ipcRenderer.invoke('memo:create', data),
    get: (id: number) => ipcRenderer.invoke('memo:get', id),
    update: (id: number, data: any) => ipcRenderer.invoke('memo:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('memo:delete', id),
    list: () => ipcRenderer.invoke('memo:list'),
    search: (query: string) => ipcRenderer.invoke('memo:search', query),
    moveToFolder: (memoId: number, folderId?: number) => ipcRenderer.invoke('memo:moveToFolder', memoId, folderId),
  },
  folder: {
    create: (name: string, parentId?: number) => ipcRenderer.invoke('folder:create', name, parentId),
    list: () => ipcRenderer.invoke('folder:list'),
    delete: (id: number) => ipcRenderer.invoke('folder:delete', id),
  },
  window: {
    setAlwaysOnTop: (windowId: number, alwaysOnTop: boolean) => ipcRenderer.invoke('window:setAlwaysOnTop', windowId, alwaysOnTop),
    saveState: (windowId: number, state: any) => ipcRenderer.invoke('window:saveState', windowId, state),
    getId: () => ipcRenderer.sendSync('window:getId'),
    minimize: () => ipcRenderer.invoke('window:minimize'),
    close: () => ipcRenderer.invoke('window:close'),
    loadMemo: (memoId: number) => ipcRenderer.invoke('window:loadMemo', memoId),
    createNew: () => ipcRenderer.invoke('window:createNew'),
  },
  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: string) => ipcRenderer.invoke('settings:set', key, value),
    getAll: () => ipcRenderer.invoke('settings:getAll'),
    getDatabasePath: () => ipcRenderer.invoke('settings:getDatabasePath'),
    getConfig: () => ipcRenderer.invoke('settings:getConfig'),
  },
  shell: {
    openPath: (path: string) => ipcRenderer.invoke('shell:openPath', path),
  },
  app: {
    getPath: (name: string) => ipcRenderer.invoke('app:getPath', name),
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    checkForUpdates: () => ipcRenderer.invoke('app:checkForUpdates'),
  },
  on: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.on(channel, (_, ...args) => callback(...args));
  },
});
