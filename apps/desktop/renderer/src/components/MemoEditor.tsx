import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import DrawingCanvas from './DrawingCanvas';
import { useUndoRedo } from '../hooks/useUndoRedo';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';

const FolderIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);

interface Folder {
  id: number;
  name: string;
  parent_id: number | null;
}

interface MemoEditorProps {
  memoId: number;
  memo: any;
  mode: 'text' | 'canvas';
  canvasClearRef?: React.MutableRefObject<(() => void) | null>;
}

export interface MemoEditorRef {
  saveNow: () => Promise<void>;
}

const MemoEditor = forwardRef<MemoEditorRef, MemoEditorProps>(({ memoId, memo, mode, canvasClearRef }, ref) => {
  const [title, setTitle] = useState(memo?.title || '');
  const [showTitle, setShowTitle] = useState(!!memo?.title);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(memo?.folder_id || null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const titleRef = useRef(title);
  const contentRef = useRef(memo?.content || '');
  
  const contentHistory = useUndoRedo<string>(memo?.content || '');
  const [content, setContent] = useState(contentHistory.state);

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    setContent(contentHistory.state);
    contentRef.current = contentHistory.state;
  }, [contentHistory.state]);

  useEffect(() => {
    setTitle(memo?.title || '');
    const newContent = memo?.content || '';
    setContent(newContent);
    contentHistory.reset(newContent);
    setShowTitle(!!memo?.title);
    setSelectedFolderId(memo?.folder_id || null);
  }, [memo]);

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    const allFolders = await window.electronAPI.folder.list();
    setFolders(allFolders);
  };

  useKeyboardShortcut('ctrl+z', () => {
    if (mode === 'text' && contentHistory.canUndo) {
      contentHistory.undo();
    }
  });

  useKeyboardShortcut('ctrl+shift+z', () => {
    if (mode === 'text' && contentHistory.canRedo) {
      contentHistory.redo();
    }
  });

  useKeyboardShortcut('ctrl+y', () => {
    if (mode === 'text' && contentHistory.canRedo) {
      contentHistory.redo();
    }
  });

  const saveNow = async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    await window.electronAPI.memo.update(memoId, {
      title: titleRef.current,
      content: contentRef.current,
    });
  };

  useImperativeHandle(ref, () => ({
    saveNow,
  }));

  const saveMemo = async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(async () => {
      await window.electronAPI.memo.update(memoId, {
        title: titleRef.current,
        content: contentRef.current,
      });
    }, 500);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    saveMemo();
  };

  const handleAddTitle = () => {
    setTempTitle(title);
    setShowTitleModal(true);
  };

  const handleSaveTitle = () => {
    setTitle(tempTitle);
    setShowTitle(true);
    setShowTitleModal(false);
    titleRef.current = tempTitle;
    saveMemo();
  };

  const handleCancelTitle = () => {
    setTempTitle('');
    setShowTitleModal(false);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    contentHistory.set(newContent);
    saveMemo();
  };

  const handleFolderSelect = async (folderId: number | null) => {
    setSelectedFolderId(folderId);
    await window.electronAPI.memo.moveToFolder(memoId, folderId);
    setShowFolderModal(false);
  };

  const getSelectedFolderName = () => {
    if (selectedFolderId === null) return '폴더 없음';
    const folder = folders.find(f => f.id === selectedFolderId);
    return folder ? folder.name : '폴더 없음';
  };


  if (mode === 'canvas') {
    return (
      <>
        <div className="h-full flex flex-col">
          {showTitle && (
            <div className="shrink-0 px-3 py-2 font-medium cursor-pointer transition-colors text-gray-200 hover:bg-gray-800" onClick={handleAddTitle}>
              {title || '제목'}
            </div>
          )}
          <div className="flex-1 min-h-0 overflow-hidden mb-12 relative">
            <DrawingCanvas
              canvasData={memo?.canvas_data}
              onCanvasChange={async (data) => {
                await window.electronAPI.memo.update(memoId, { canvas_data: data });
              }}
              clearRef={canvasClearRef}
            />
          </div>
          <div className="absolute bottom-4 left-3 flex gap-4">
            {!showTitle && (
              <span
                onClick={handleAddTitle}
                className="text-sm cursor-pointer transition-colors text-gray-500 hover:text-gray-300"
              >
                + 제목 추가
              </span>
            )}
            <span
              onClick={() => setShowFolderModal(true)}
              className="text-sm cursor-pointer transition-colors text-gray-500 hover:text-gray-300 flex items-center gap-1"
            >
              <FolderIcon /> 폴더 지정
            </span>
          </div>
        </div>
        {showTitleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleCancelTitle}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-96" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-4">제목 입력</h2>
              <input
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                placeholder="제목을 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') handleCancelTitle();
                }}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleCancelTitle}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveTitle}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        )}
        {showFolderModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowFolderModal(false)}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-4">폴더 지정</h2>
              <div className="flex-1 overflow-y-auto mb-4">
                <div
                  onClick={() => handleFolderSelect(null)}
                  className={`px-4 py-3 rounded cursor-pointer transition-colors mb-2 ${
                    selectedFolderId === null ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                  }`}
                >
                  폴더 없음
                </div>
                {folders.map(folder => (
                  <div
                    key={folder.id}
                    onClick={() => handleFolderSelect(folder.id)}
                    className={`px-4 py-3 rounded cursor-pointer transition-colors mb-2 ${
                      selectedFolderId === folder.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    📁 {folder.name}
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowFolderModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="h-full flex flex-col relative">
        {showTitle && (
          <div className="shrink-0 px-3 py-2 font-medium cursor-pointer transition-colors text-gray-200 hover:bg-gray-800" onClick={handleAddTitle}>
            {title || '제목'}
          </div>
        )}
        <textarea
          value={content}
          onChange={handleContentChange}
          placeholder="메모를 입력하세요..."
          className="flex-1 w-full px-3 py-2 border-0 resize-none focus:outline-none bg-transparent overflow-auto pb-12 text-gray-200 placeholder-gray-600"
        />
        <div className="absolute bottom-4 left-3 flex gap-4">
          {!showTitle && (
            <span
              onClick={handleAddTitle}
              className="text-sm cursor-pointer transition-colors text-gray-500 hover:text-gray-300"
            >
              + 제목 추가
            </span>
          )}
          <span
            onClick={() => setShowFolderModal(true)}
            className="text-sm cursor-pointer transition-colors text-gray-500 hover:text-gray-300 flex items-center gap-1"
          >
            <FolderIcon /> 폴더 지정
          </span>
        </div>
      </div>
      {showTitleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleCancelTitle}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-96" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">제목 입력</h2>
            <input
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTitle();
                if (e.key === 'Escape') handleCancelTitle();
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancelTitle}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSaveTitle}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
      {showFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowFolderModal(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">폴더 지정</h2>
            <div className="flex-1 overflow-y-auto mb-4">
              <div
                onClick={() => handleFolderSelect(null)}
                className={`px-4 py-3 rounded cursor-pointer transition-colors mb-2 ${
                  selectedFolderId === null ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                }`}
              >
                폴더 없음
              </div>
              {folders.map(folder => (
                <div
                  key={folder.id}
                  onClick={() => handleFolderSelect(folder.id)}
                  className={`px-4 py-3 rounded cursor-pointer transition-colors mb-2 ${
                    selectedFolderId === folder.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                  }`}
                >
                  📁 {folder.name}
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowFolderModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default MemoEditor;
