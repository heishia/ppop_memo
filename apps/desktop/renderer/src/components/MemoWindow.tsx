import React, { useState, useEffect, useRef } from 'react';
import MemoEditor from './MemoEditor';
import MemoManagement from './MemoManagement';
import Settings from './Settings';
import About from './About';
import Toast from './Toast';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';

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

const MoreIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1"/>
    <circle cx="12" cy="5" r="1"/>
    <circle cx="12" cy="19" r="1"/>
  </svg>
);

const MinimizeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
  </svg>
);

function MemoWindow({ memoId, initialMemo }: MemoWindowProps) {
  const [memo, setMemo] = useState(initialMemo);
  const [mode, setMode] = useState<'text' | 'canvas'>(initialMemo.mode || 'text');
  const [alwaysOnTop, setAlwaysOnTop] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showMemoManagement, setShowMemoManagement] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const editorRef = useRef<{ saveNow: () => Promise<void> } | null>(null);
  const canvasClearRef = useRef<(() => void) | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  useKeyboardShortcut('ctrl+s', async (e) => {
    e.preventDefault();
    if (editorRef.current) {
      setIsSaving(true);
      await editorRef.current.saveNow();
      setToast({ message: '저장되었습니다', type: 'success' });
      setTimeout(() => setIsSaving(false), 500);
    }
  });

  const handleModeToggle = async (newMode: 'text' | 'canvas') => {
    if (editorRef.current) {
      await editorRef.current.saveNow();
    }
    
    const hasContent = (memo?.content && memo.content.trim() !== '') || 
                       (memo?.canvas_data && memo.canvas_data !== null);
    
    if (!hasContent) {
      await window.electronAPI.memo.update(memoId, { mode: newMode });
      setMode(newMode);
      return;
    }
    
    let baseTitle = memo?.title || '제목 없음';
    baseTitle = baseTitle.replace(/\s*\((캔버스|텍스트)\)\s*\d{4}-\d{2}-\d{2}-오전|오후\s*\d{2}-\d{2}.*$/g, '').trim();
    
    const timestamp = new Date().toLocaleString('ko-KR', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    }).replace(/\. /g, '-').replace(/\./g, '').replace(':', '-');
    
    const newTitle = `${baseTitle} (${newMode === 'canvas' ? '캔버스' : '텍스트'}) ${timestamp}`;
    
    const newMemo = await window.electronAPI.memo.create({
      title: newTitle,
      content: newMode === 'text' ? (memo?.content || '') : '',
      canvas_data: newMode === 'canvas' ? (memo?.canvas_data || null) : null,
      mode: newMode,
      folder_id: memo?.folder_id || null,
    });
    
    await window.electronAPI.window.loadMemo(newMemo.id);
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
      setToast({ message: '저장되었습니다', type: 'success' });
      setTimeout(() => setIsSaving(false), 500);
    }
  };

  const handleMinimize = async () => {
    await window.electronAPI.window.minimize();
  };

  const handleClose = async () => {
    await window.electronAPI.window.close();
  };

  const handleMemoManagement = () => {
    setShowMenu(false);
    setShowMemoManagement(true);
  };

  const handleSettings = () => {
    setShowMenu(false);
    setShowSettings(true);
  };

  const handleLoadMemo = async (loadMemoId: number) => {
    await window.electronAPI.window.loadMemo(loadMemoId);
  };

  const handleCreateNewMemo = async () => {
    await window.electronAPI.window.createNew();
  };

  const handleCanvasClear = () => {
    if (canvasClearRef.current) {
      canvasClearRef.current();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-black">
      <div className="border-b flex items-center justify-between bg-black border-gray-800" style={{ WebkitAppRegion: 'drag' } as any}>
        <div className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-400">
          PPOP Memo
        </div>
        <div className="flex items-center gap-0.5 pr-1" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <button
            onClick={handleCreateNewMemo}
            className="p-1 rounded transition-colors hover:bg-gray-800 text-white"
            title="새 메모"
          >
            <PlusIcon />
          </button>
          <button
            onClick={handleManualSave}
            className={`p-1 rounded transition-colors ${isSaving ? 'bg-green-500 text-white' : 'hover:bg-gray-800 text-white'}`}
            title="저장"
          >
            <SaveIcon />
          </button>
          <button
            onClick={handleAlwaysOnTopToggle}
            className={`p-1 rounded transition-colors ${alwaysOnTop ? 'bg-blue-500 text-white' : 'hover:bg-gray-800 text-white'}`}
            title={alwaysOnTop ? '고정 해제' : '항상 위에 고정'}
          >
            <PinIcon filled={alwaysOnTop} />
          </button>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded transition-colors hover:bg-gray-800 text-white"
              title="메뉴"
            >
              <MoreIcon />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-1 w-48 rounded-md shadow-lg border py-1 z-50 bg-gray-900 border-gray-700">
                <button
                  onClick={handleMemoManagement}
                  className="w-full px-4 py-2 text-left text-sm transition-colors text-gray-300 hover:bg-gray-800"
                >
                  메모 관리
                </button>
                <button
                  onClick={handleSettings}
                  className="w-full px-4 py-2 text-left text-sm transition-colors text-gray-300 hover:bg-gray-800"
                >
                  설정
                </button>
                <div className="border-t my-1 border-gray-700"></div>
                <button
                  onClick={() => {
                    setShowAbout(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm transition-colors text-gray-300 hover:bg-gray-800"
                >
                  정보
                </button>
              </div>
            )}
          </div>
          <button
            onClick={handleMinimize}
            className="p-1 rounded transition-colors hover:bg-gray-800 text-white"
            title="최소화"
          >
            <MinimizeIcon />
          </button>
          <button
            onClick={handleClose}
            className="p-1 rounded transition-colors hover:bg-red-600 text-white"
            title="닫기"
          >
            <CloseIcon />
          </button>
        </div>
      </div>
      <div className="flex-1 relative bg-gray-900">
        <MemoEditor ref={editorRef} memoId={memoId} memo={memo} mode={mode} canvasClearRef={canvasClearRef} />
        <div className="absolute bottom-3 right-3 flex gap-2">
          {mode === 'canvas' && (
            <button
              onClick={handleCanvasClear}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded shadow transition-colors flex items-center gap-1"
              title="캔버스 초기화"
            >
              <RefreshIcon />
            </button>
          )}
          <button
            onClick={() => handleModeToggle(mode === 'text' ? 'canvas' : 'text')}
            className="px-3 py-1.5 bg-white hover:bg-gray-100 text-black text-sm rounded shadow transition-colors font-medium"
          >
            {mode === 'text' ? 'Canvas 모드' : 'Text 모드'}
          </button>
        </div>
      </div>
      {showMemoManagement && (
        <MemoManagement
          onClose={() => setShowMemoManagement(false)}
          onLoadMemo={handleLoadMemo}
        />
      )}
      {showSettings && (
        <Settings onClose={() => setShowSettings(false)} />
      )}
      {showAbout && (
        <About onClose={() => setShowAbout(false)} />
      )}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default MemoWindow;
