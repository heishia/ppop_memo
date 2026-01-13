import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  memo: {
    create: () => ipcRenderer.invoke('memo:create'),
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
  },
  on: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.on(channel, (_, ...args) => callback(...args));
  },
});
