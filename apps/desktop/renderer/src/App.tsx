import React, { useState, useEffect } from 'react';
import MemoWindow from './components/MemoWindow';

declare global {
  interface Window {
    electronAPI: {
      memo: {
        create: () => Promise<any>;
        get: (id: number) => Promise<any>;
        update: (id: number, data: any) => Promise<any>;
        delete: (id: number) => Promise<any>;
        list: () => Promise<any[]>;
        search: (query: string) => Promise<any[]>;
      };
      folder: {
        create: (name: string, parentId?: number) => Promise<any>;
        list: () => Promise<any[]>;
        delete: (id: number) => Promise<any>;
      };
      window: {
        setAlwaysOnTop: (windowId: number, alwaysOnTop: boolean) => Promise<any>;
        saveState: (windowId: number, state: any) => Promise<any>;
        getId: () => number;
        minimize: () => Promise<any>;
        close: () => Promise<any>;
        createNew: () => Promise<any>;
      };
      settings: {
        get: (key: string) => Promise<string | null>;
        set: (key: string, value: string) => Promise<any>;
        getAll: () => Promise<Record<string, string>>;
      };
      shell: {
        openPath: (path: string) => Promise<{ success: boolean; error?: string }>;
      };
      app: {
        getPath: (name: string) => Promise<string | null>;
        getVersion: () => Promise<string>;
        checkForUpdates: () => Promise<{ success: boolean; error?: string }>;
      };
      on: (channel: string, callback: (...args: any[]) => void) => void;
    };
  }
}

function App() {
  const [memoId, setMemoId] = useState<number | null>(null);
  const [memo, setMemo] = useState<any>(null);

  useEffect(() => {
    const createNewMemo = async () => {
      const newMemo = await window.electronAPI.memo.create();
      setMemoId(newMemo.id);
      setMemo(newMemo);
    };
    
    createNewMemo();
  }, []);

  if (!memo) {
    return <div>Loading...</div>;
  }

  return <MemoWindow memoId={memoId!} initialMemo={memo} />;
}

export default App;
