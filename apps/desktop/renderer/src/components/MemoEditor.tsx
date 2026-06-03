import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import DrawingCanvas from './DrawingCanvas';

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

interface ContextMenuState {
  x: number;
  y: number;
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

const EMOJI_OPTIONS = ['😀', '😂', '😍', '👍', '🙏', '🔥', '⭐', '💡', '📌', '✅', '🎉', '❤️'];

// 오버레이와 textarea가 글자 위치(줄바꿈/캐럿/선택)를 완벽히 맞추려면 동일한 텍스트 메트릭을 공유해야 한다.
const EDITOR_TEXT_CLASS = 'px-3 pt-2 pb-12 text-sm leading-6 font-sans tracking-normal whitespace-pre-wrap break-words';

const TODO_MARKER_RE = /^- \[([ xX])\]/;

const MemoEditor = forwardRef<MemoEditorRef, MemoEditorProps>(({ memoId, memo, mode, canvasClearRef }, ref) => {
  const [title, setTitle] = useState(memo?.title || '');
  const [showTitle, setShowTitle] = useState(!!memo?.title);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(memo?.folder_id || null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const titleRef = useRef(title);
  const contentRef = useRef(memo?.content || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState<string>(memo?.content || '');

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    setTitle(memo?.title || '');
    const newContent = memo?.content || '';
    setContent(newContent);
    contentRef.current = newContent;
    setShowTitle(!!memo?.title);
    setSelectedFolderId(memo?.folder_id || null);
  }, [memo]);

  useEffect(() => {
    loadFolders();
  }, []);

  useEffect(() => {
    syncScroll();
  }, [content]);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setContextMenu(null);
      }
    };
    const handleResize = () => setContextMenu(null);

    if (contextMenu) {
      document.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('keydown', handleKeyDown);
      window.addEventListener('resize', handleResize, { once: true });
    }

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [contextMenu]);

  const loadFolders = async () => {
    const allFolders = await window.electronAPI.folder.list();
    setFolders(allFolders);
  };

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

  const updateContent = (newContent: string) => {
    setContent(newContent);
    contentRef.current = newContent;
    saveMemo();
  };

  const syncScroll = () => {
    if (overlayRef.current && textareaRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
      overlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateContent(e.target.value);
  };

  const toggleTodoAt = (lineStart: number, currentMark: string, caret: number) => {
    const checkIndex = lineStart + 3;
    const nextMark = currentMark.toLowerCase() === 'x' ? ' ' : 'x';
    const newContent = content.slice(0, checkIndex) + nextMark + content.slice(checkIndex + 1);
    updateContent(newContent);

    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(caret, caret);
    });
  };

  // 마커 영역을 클릭하면 체크 토글 (드래그 선택 중에는 무시)
  const handleTextAreaClick = (event: React.MouseEvent<HTMLTextAreaElement>) => {
    const textarea = event.currentTarget;
    if (textarea.selectionStart !== textarea.selectionEnd) return;

    const pos = textarea.selectionStart ?? 0;
    const lineStart = content.lastIndexOf('\n', pos - 1) + 1;
    const col = pos - lineStart;
    if (col > 5) return;

    const lineBreak = content.indexOf('\n', lineStart);
    const line = content.slice(lineStart, lineBreak === -1 ? undefined : lineBreak);
    const match = line.match(TODO_MARKER_RE);
    if (!match) return;

    toggleTodoAt(lineStart, match[1], pos);
  };

  const handleTextAreaKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      const textarea = event.currentTarget;
      const pos = textarea.selectionStart ?? 0;
      if (pos !== (textarea.selectionEnd ?? pos)) return;

      const lineStart = content.lastIndexOf('\n', pos - 1) + 1;
      const lineBreak = content.indexOf('\n', lineStart);
      const line = content.slice(lineStart, lineBreak === -1 ? undefined : lineBreak);
      const match = line.match(TODO_MARKER_RE);
      if (!match) return;

      // 빈 투두에서 Enter -> 마커 제거, 내용 있는 투두에서 Enter -> 다음 줄도 투두로
      const body = line.slice(match[0].length).replace(/^ /, '');
      event.preventDefault();

      if (body.trim() === '') {
        const newContent = content.slice(0, lineStart) + content.slice(lineStart + line.length);
        updateContent(newContent);
        requestAnimationFrame(() => {
          textarea.focus();
          textarea.setSelectionRange(lineStart, lineStart);
        });
        return;
      }

      const insertText = '\n- [ ] ';
      const newContent = content.slice(0, pos) + insertText + content.slice(textarea.selectionEnd ?? pos);
      updateContent(newContent);
      requestAnimationFrame(() => {
        textarea.focus();
        const caret = pos + insertText.length;
        textarea.setSelectionRange(caret, caret);
      });
    }
  };

  const handleInsertTodo = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const insertText = `${start > 0 && content[start - 1] !== '\n' ? '\n' : ''}- [ ] `;
    const newContent = `${content.slice(0, start)}${insertText}${content.slice(end)}`;

    updateContent(newContent);
    setContextMenu(null);

    requestAnimationFrame(() => {
      textarea.focus();
      const cursorPosition = start + insertText.length;
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    });
  };

  const handleInsertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = `${content.slice(0, start)}${emoji}${content.slice(end)}`;

    updateContent(newContent);
    setContextMenu(null);

    requestAnimationFrame(() => {
      textarea.focus();
      const cursorPosition = start + emoji.length;
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    });
  };

  const handleTextAreaContextMenu = (event: React.MouseEvent<HTMLTextAreaElement>) => {
    event.preventDefault();
    textareaRef.current?.focus();

    setContextMenu({
      x: Math.min(event.clientX, window.innerWidth - 220),
      y: Math.min(event.clientY, window.innerHeight - 260),
    });
  };

  const handleFolderSelect = async (folderId: number | null) => {
    setSelectedFolderId(folderId);
    await window.electronAPI.memo.moveToFolder(memoId, folderId);
    setShowFolderModal(false);
  };

  const renderOverlayLines = () => {
    const lines = content.length ? content.split('\n') : [''];
    return lines.map((line, index) => {
      const match = line.match(TODO_MARKER_RE);
      if (match) {
        const checked = match[1].toLowerCase() === 'x';
        const rest = line.slice(match[0].length);
        return (
          <div key={index}>
            <span className="relative">
              <span className="text-transparent">{match[0]}</span>
              <input
                type="checkbox"
                checked={checked}
                readOnly
                tabIndex={-1}
                aria-hidden
                className="pointer-events-none absolute left-1 top-1/2 h-4 w-4 -translate-y-1/2 accent-blue-500"
              />
            </span>
            <span className={checked ? 'text-gray-500 line-through' : ''}>{rest.length ? rest : '\u00a0'}</span>
          </div>
        );
      }
      return <div key={index}>{line.length ? line : '\u200b'}</div>;
    });
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
        <div className="relative flex-1 min-h-0">
          <div
            ref={overlayRef}
            aria-hidden
            className={`${EDITOR_TEXT_CLASS} pointer-events-none absolute inset-0 overflow-y-scroll overflow-x-hidden text-gray-200`}
          >
            {renderOverlayLines()}
          </div>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onClick={handleTextAreaClick}
            onScroll={syncScroll}
            onKeyDown={handleTextAreaKeyDown}
            onContextMenu={handleTextAreaContextMenu}
            spellCheck={false}
            placeholder="메모를 입력하세요..."
            className={`${EDITOR_TEXT_CLASS} absolute inset-0 h-full w-full resize-none overflow-y-scroll overflow-x-hidden border-0 bg-transparent text-transparent caret-gray-200 outline-none placeholder-gray-600 selection:bg-blue-500/40`}
          />
        </div>
        {contextMenu && (
          <div
            ref={contextMenuRef}
            className="fixed w-52 rounded-lg border border-gray-700 bg-gray-950 py-2 shadow-xl z-50 text-gray-200"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={handleInsertTodo}
              className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-gray-800"
            >
              투두 추가
            </button>
            <div className="my-1 border-t border-gray-800"></div>
            <div className="px-3 pb-2 text-xs font-medium text-gray-500">이모지</div>
            <div className="grid grid-cols-6 gap-1 px-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleInsertEmoji(emoji)}
                  className="rounded p-1.5 text-lg leading-none transition-colors hover:bg-gray-800"
                  title={`${emoji} 삽입`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
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
