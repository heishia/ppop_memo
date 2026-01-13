import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import DrawingCanvas from './DrawingCanvas';

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
  const [content, setContent] = useState(memo?.content || '');
  const [showTitle, setShowTitle] = useState(!!memo?.title);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const titleRef = useRef(title);
  const contentRef = useRef(content);

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    setTitle(memo?.title || '');
    setContent(memo?.content || '');
    setShowTitle(!!memo?.title);
  }, [memo]);

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
    setContent(e.target.value);
    saveMemo();
  };

  const handleTextRecognized = async (text: string) => {
    setContent(prev => prev + '\n' + text);
    await window.electronAPI.memo.update(memoId, {
      content: content + '\n' + text,
    });
  };

  if (mode === 'canvas') {
    return (
      <div className="flex-1 flex flex-col p-4">
        {!showTitle && (
          <button
            onClick={() => setShowTitle(true)}
            className="mb-2 text-sm text-gray-500 hover:text-gray-700 text-left"
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
            className="w-full mb-4 p-2 border rounded"
          />
        )}
        <div className="flex-1 flex gap-4">
          <div className="flex-1">
            <DrawingCanvas
              canvasData={memo?.canvas_data}
              onCanvasChange={async (data) => {
                await window.electronAPI.memo.update(memoId, { canvas_data: data });
              }}
              onTextRecognized={handleTextRecognized}
            />
          </div>
          <div className="w-64 border rounded p-2">
            <h3 className="font-bold mb-2">인식된 텍스트</h3>
            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder="인식된 텍스트가 여기에 표시됩니다..."
              className="w-full h-full p-2 border rounded resize-none"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4">
      {!showTitle && (
        <button
          onClick={() => setShowTitle(true)}
          className="mb-2 text-sm text-gray-500 hover:text-gray-700 text-left"
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
          className="w-full mb-4 p-2 border rounded"
        />
      )}
      <textarea
        value={content}
        onChange={handleContentChange}
        placeholder="메모를 입력하세요..."
        className="flex-1 w-full p-2 border rounded resize-none"
      />
    </div>
  );
});

export default MemoEditor;
