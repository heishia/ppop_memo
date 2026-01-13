import React, { useState, useEffect } from 'react';
import MemoEditor from './MemoEditor';
import ModeToggleButton from './ModeToggleButton';

interface MemoWindowProps {
  memoId: number;
  initialMemo: any;
}

function MemoWindow({ memoId, initialMemo }: MemoWindowProps) {
  const [memo, setMemo] = useState(initialMemo);
  const [mode, setMode] = useState<'text' | 'canvas'>(initialMemo.mode || 'text');
  const [alwaysOnTop, setAlwaysOnTop] = useState(false);

  useEffect(() => {
    const loadMemo = async () => {
      const loadedMemo = await window.electronAPI.memo.get(memoId);
      setMemo(loadedMemo);
      setMode(loadedMemo.mode || 'text');
      
      if (loadedMemo.window_state) {
        const state = JSON.parse(loadedMemo.window_state);
        setAlwaysOnTop(state.alwaysOnTop || false);
        const windowId = window.electronAPI.window.getId();
        await window.electronAPI.window.setAlwaysOnTop(windowId, state.alwaysOnTop || false);
      }
    };
    loadMemo();
    
    window.electronAPI.on('memo:load', async (id: number) => {
      const loadedMemo = await window.electronAPI.memo.get(id);
      setMemo(loadedMemo);
      setMode(loadedMemo.mode || 'text');
    });
    
    window.electronAPI.on('window:state-changed', async (state: any) => {
      const windowId = window.electronAPI.window.getId();
      await window.electronAPI.window.saveState(windowId, state);
    });
  }, [memoId]);

  const handleModeToggle = async (newMode: 'text' | 'canvas') => {
    setMode(newMode);
    await window.electronAPI.memo.update(memoId, { mode: newMode });
  };

  const handleAlwaysOnTopToggle = async () => {
    const newValue = !alwaysOnTop;
    setAlwaysOnTop(newValue);
    const windowId = window.electronAPI.window.getId();
    await window.electronAPI.window.setAlwaysOnTop(windowId, newValue);
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="p-2 border-b flex justify-between items-center">
        <button
          onClick={handleAlwaysOnTopToggle}
          className={`px-3 py-1 text-sm rounded ${alwaysOnTop ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          {alwaysOnTop ? '고정 해제' : '고정'}
        </button>
      </div>
      <MemoEditor memoId={memoId} memo={memo} mode={mode} />
      <ModeToggleButton mode={mode} onToggle={handleModeToggle} />
    </div>
  );
}

export default MemoWindow;
