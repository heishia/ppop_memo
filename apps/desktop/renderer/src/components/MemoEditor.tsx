import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import DrawingCanvas from './DrawingCanvas';
import { useUndoRedo } from '../hooks/useUndoRedo';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';

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
  }, [memo]);

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


  if (mode === 'canvas') {
    return (
      <>
        <div className="h-full flex flex-col">
          {showTitle && (
            <div className="shrink-0 px-3 py-2 font-medium text-gray-700 cursor-pointer hover:bg-yellow-100" onClick={handleAddTitle}>
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
          {!showTitle && (
            <div className="absolute bottom-4 left-3">
              <span
                onClick={handleAddTitle}
                className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
              >
                + 제목 추가
              </span>
            </div>
          )}
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
      </>
    );
  }

  return (
    <>
      <div className="h-full flex flex-col relative">
        {showTitle && (
          <div className="shrink-0 px-3 py-2 font-medium text-gray-700 cursor-pointer hover:bg-yellow-100" onClick={handleAddTitle}>
            {title || '제목'}
          </div>
        )}
        <textarea
          value={content}
          onChange={handleContentChange}
          placeholder="메모를 입력하세요..."
          className="flex-1 w-full px-3 py-2 border-0 resize-none focus:outline-none bg-transparent placeholder-gray-400 overflow-auto pb-12"
        />
        {!showTitle && (
          <div className="absolute bottom-4 left-3">
            <span
              onClick={handleAddTitle}
              className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
            >
              + 제목 추가
            </span>
          </div>
        )}
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
    </>
  );
});

export default MemoEditor;
