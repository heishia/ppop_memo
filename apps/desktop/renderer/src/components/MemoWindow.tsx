import React, { useState, useEffect, useRef } from 'react';
import MemoEditor from './MemoEditor';
import ModeToggleButton from './ModeToggleButton';

interface MemoWindowProps {
  memoId: number;
  initialMemo: any;
}

const SaveIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </svg>
);

const PinIcon = ({ filled }: { filled: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="17" x2="12" y2="22"/>
    <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/>
  </svg>
);

function MemoWindow({ memoId, initialMemo }: MemoWindowProps) {
  const [memo, setMemo] = useState(initialMemo);
  const [mode, setMode] = useState<'text' | 'canvas'>(initialMemo.mode || 'text');
  const [alwaysOnTop, setAlwaysOnTop] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef<{ saveNow: () => Promise<void> } | null>(null);

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

  const handleManualSave = async () => {
    if (editorRef.current) {
      setIsSaving(true);
      await editorRef.current.saveNow();
      setTimeout(() => setIsSaving(false), 500);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="p-2 flex justify-end items-center gap-1">
        <button
          onClick={handleManualSave}
          className={`p-1.5 rounded transition-colors ${isSaving ? 'bg-green-500 text-white' : 'hover:bg-gray-200 text-gray-600'}`}
          title="저장"
        >
          <SaveIcon />
        </button>
        <button
          onClick={handleAlwaysOnTopToggle}
          className={`p-1.5 rounded transition-colors ${alwaysOnTop ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 text-gray-600'}`}
          title={alwaysOnTop ? '고정 해제' : '항상 위에 고정'}
        >
          <PinIcon filled={alwaysOnTop} />
        </button>
      </div>
      <MemoEditor ref={editorRef} memoId={memoId} memo={memo} mode={mode} />
      <ModeToggleButton mode={mode} onToggle={handleModeToggle} />
    </div>
  );
}

export default MemoWindow;
