import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import DrawingCanvas from './DrawingCanvas';
import { useUndoRedo } from '../hooks/useUndoRedo';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';

interface MemoEditorProps {
  memoId: number;
  memo: any;
  mode: 'text' | 'canvas';
}

export interface MemoEditorRef {
  saveNow: () => Promise<void>;
}

const MemoEditor = forwardRef<MemoEditorRef, MemoEditorProps>(({ memoId, memo, mode }, ref) => {
  const [title, setTitle] = useState(memo?.title || '');
  const [showTitle, setShowTitle] = useState(!!memo?.title);
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

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    contentHistory.set(newContent);
    saveMemo();
  };

  const handleTextRecognized = async (text: string) => {
    const newContent = content + '\n' + text;
    setContent(newContent);
    contentHistory.set(newContent);
    await window.electronAPI.memo.update(memoId, {
      content: newContent,
    });
  };

  if (mode === 'canvas') {
    return (
      <div className="flex-1 flex flex-col">
        {!showTitle && (
          <button
            onClick={() => setShowTitle(true)}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 text-left"
          >
            + 제목 추가
          </button>
        )}
        {showTitle && (
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="제목"
            className="w-full px-3 py-2 border-0 border-b border-gray-200 focus:outline-none focus:border-gray-300"
          />
        )}
        <div className="flex-1 flex">
          <div className="flex-1">
            <DrawingCanvas
              canvasData={memo?.canvas_data}
              onCanvasChange={async (data) => {
                await window.electronAPI.memo.update(memoId, { canvas_data: data });
              }}
              onTextRecognized={handleTextRecognized}
            />
          </div>
          <div className="w-64 border-l border-gray-200 flex flex-col">
            <h3 className="px-3 py-2 font-bold text-sm border-b border-gray-200">인식된 텍스트</h3>
            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder="인식된 텍스트가 여기에 표시됩니다..."
              className="flex-1 w-full px-3 py-2 border-0 resize-none focus:outline-none"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {!showTitle && (
        <button
          onClick={() => setShowTitle(true)}
          className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 text-left"
        >
          + 제목 추가
        </button>
      )}
      {showTitle && (
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="제목"
          className="w-full px-3 py-2 border-0 border-b border-gray-200 focus:outline-none focus:border-gray-300 font-medium"
        />
      )}
      <textarea
        value={content}
        onChange={handleContentChange}
        placeholder="메모를 입력하세요..."
        className="flex-1 w-full px-3 py-2 border-0 resize-none focus:outline-none"
      />
    </div>
  );
});

export default MemoEditor;
