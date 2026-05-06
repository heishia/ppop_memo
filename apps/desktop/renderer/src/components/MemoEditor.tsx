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

interface ContextMenuState {
  x: number;
  y: number;
  lineIndex: number;
}

interface TodoLine {
  checked: boolean;
  text: string;
}

interface ActiveSelection {
  lineIndex: number;
  start: number;
  end: number;
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
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const lineInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const activeSelectionRef = useRef<ActiveSelection | null>(null);
  
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

  const updateContent = (newContent: string) => {
    setContent(newContent);
    contentRef.current = newContent;
    contentHistory.set(newContent);
    saveMemo();
  };

  const getLines = () => {
    const lines = content.split('\n');
    return lines.length === 0 ? [''] : lines;
  };

  const parseTodoLine = (line: string): TodoLine | null => {
    const markdownTodo = line.match(/^- \[([ xX])\]\s?(.*)$/);
    if (markdownTodo) {
      return {
        checked: markdownTodo[1].toLowerCase() === 'x',
        text: markdownTodo[2],
      };
    }

    const legacyTodo = line.match(/^([☐☑])\s?(.*)$/);
    if (legacyTodo) {
      return {
        checked: legacyTodo[1] === '☑',
        text: legacyTodo[2],
      };
    }

    return null;
  };

  const formatTodoLine = (checked: boolean, text: string) => `- [${checked ? 'x' : ' '}] ${text}`;

  const updateLines = (lines: string[], focusLineIndex?: number, caretPosition?: number) => {
    updateContent(lines.join('\n'));

    if (focusLineIndex !== undefined) {
      requestAnimationFrame(() => {
        const input = lineInputRefs.current[focusLineIndex];
        if (!input) return;
        const nextCaret = caretPosition ?? input.value.length;
        input.focus();
        input.setSelectionRange(nextCaret, nextCaret);
      });
    }
  };

  const updateLineText = (lineIndex: number, text: string) => {
    const lines = getLines();
    const todo = parseTodoLine(lines[lineIndex] || '');
    lines[lineIndex] = todo ? formatTodoLine(todo.checked, text) : text;
    updateLines(lines);
  };

  const recordSelection = (lineIndex: number, input: HTMLInputElement) => {
    activeSelectionRef.current = {
      lineIndex,
      start: input.selectionStart ?? input.value.length,
      end: input.selectionEnd ?? input.value.length,
    };
  };

  const handleInsertTodo = () => {
    const lines = getLines();
    const targetLineIndex = contextMenu?.lineIndex ?? activeSelectionRef.current?.lineIndex ?? lines.length - 1;
    const targetLine = lines[targetLineIndex] ?? '';

    if (targetLine.trim() === '') {
      lines[targetLineIndex] = formatTodoLine(false, '');
      updateLines(lines, targetLineIndex, 0);
    } else {
      lines.splice(targetLineIndex + 1, 0, formatTodoLine(false, ''));
      updateLines(lines, targetLineIndex + 1, 0);
    }

    setContextMenu(null);
  };

  const handleDeleteLine = (lineIndex = contextMenu?.lineIndex ?? activeSelectionRef.current?.lineIndex ?? 0) => {
    const lines = getLines();

    if (lines.length === 1) {
      lines[0] = '';
      updateLines(lines, 0, 0);
    } else {
      lines.splice(lineIndex, 1);
      updateLines(lines, Math.min(lineIndex, lines.length - 1));
    }

    setContextMenu(null);
  };

  const handleInsertEmoji = (emoji: string) => {
    const lines = getLines();
    const selection = activeSelectionRef.current ?? {
      lineIndex: contextMenu?.lineIndex ?? lines.length - 1,
      start: (parseTodoLine(lines[contextMenu?.lineIndex ?? lines.length - 1] || '')?.text || lines[contextMenu?.lineIndex ?? lines.length - 1] || '').length,
      end: (parseTodoLine(lines[contextMenu?.lineIndex ?? lines.length - 1] || '')?.text || lines[contextMenu?.lineIndex ?? lines.length - 1] || '').length,
    };

    const line = lines[selection.lineIndex] || '';
    const todo = parseTodoLine(line);
    const currentText = todo ? todo.text : line;
    const nextText = `${currentText.slice(0, selection.start)}${emoji}${currentText.slice(selection.end)}`;
    lines[selection.lineIndex] = todo ? formatTodoLine(todo.checked, nextText) : nextText;

    updateLines(lines, selection.lineIndex, selection.start + emoji.length);
    setContextMenu(null);
  };

  const handleTodoToggle = (lineIndex: number) => {
    const lines = getLines();
    const todo = parseTodoLine(lines[lineIndex] || '');
    if (!todo) return;

    lines[lineIndex] = formatTodoLine(!todo.checked, todo.text);
    updateLines(lines);
  };

  const handleLineKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, lineIndex: number) => {
    const input = event.currentTarget;

    if (event.key === 'Enter') {
      event.preventDefault();
      const lines = getLines();
      const todo = parseTodoLine(lines[lineIndex] || '');
      const currentText = input.value;
      const cursor = input.selectionStart ?? currentText.length;
      const before = currentText.slice(0, cursor);
      const after = currentText.slice(input.selectionEnd ?? cursor);

      lines[lineIndex] = todo ? formatTodoLine(todo.checked, before) : before;
      lines.splice(lineIndex + 1, 0, todo ? formatTodoLine(false, after) : after);
      updateLines(lines, lineIndex + 1, 0);
    }

    if (event.key === 'Backspace' && input.selectionStart === 0 && input.selectionEnd === 0) {
      event.preventDefault();
      const lines = getLines();

      const todo = parseTodoLine(lines[lineIndex] || '');
      if (todo) {
        lines[lineIndex] = todo.text;
        updateLines(lines, lineIndex, 0);
        return;
      }

      if (input.value !== '' || lines.length === 1) return;
      lines.splice(lineIndex, 1);
      updateLines(lines, Math.max(0, lineIndex - 1));
    }
  };

  const handleLinePaste = (event: React.ClipboardEvent<HTMLInputElement>, lineIndex: number) => {
    const pastedText = event.clipboardData.getData('text');
    if (!pastedText.includes('\n')) return;

    event.preventDefault();

    const input = event.currentTarget;
    const lines = getLines();
    const todo = parseTodoLine(lines[lineIndex] || '');
    const currentText = input.value;
    const start = input.selectionStart ?? currentText.length;
    const end = input.selectionEnd ?? currentText.length;
    const pastedLines = pastedText.replace(/\r\n/g, '\n').split('\n');
    const firstLine = `${currentText.slice(0, start)}${pastedLines[0]}`;
    const lastLine = `${pastedLines[pastedLines.length - 1]}${currentText.slice(end)}`;
    const newLines = pastedLines.length === 1 ? [firstLine] : [firstLine, ...pastedLines.slice(1, -1), lastLine];

    lines.splice(
      lineIndex,
      1,
      ...newLines.map((line, index) => (todo && index === 0 ? formatTodoLine(todo.checked, line) : line))
    );
    updateLines(lines, lineIndex + newLines.length - 1, pastedLines[pastedLines.length - 1].length);
  };

  const handleEditorContextMenu = (event: React.MouseEvent<HTMLDivElement>, lineIndex?: number) => {
    event.preventDefault();

    setContextMenu({
      x: Math.min(event.clientX, window.innerWidth - 220),
      y: Math.min(event.clientY, window.innerHeight - 260),
      lineIndex: lineIndex ?? getLines().length - 1,
    });
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
        <div
          onContextMenu={(event) => handleEditorContextMenu(event)}
          className="flex-1 w-full px-3 py-2 overflow-auto pb-12 text-gray-200"
        >
          {getLines().map((line, index) => {
            const todo = parseTodoLine(line);
            const inputValue = todo ? todo.text : line;

            return (
              <div
                key={index}
                onContextMenu={(event) => {
                  event.stopPropagation();
                  handleEditorContextMenu(event, index);
                }}
                className="group flex min-h-[1.75rem] items-center gap-2"
              >
                {todo && (
                  <input
                    type="checkbox"
                    checked={todo.checked}
                    onChange={() => handleTodoToggle(index)}
                    className="h-4 w-4 shrink-0 cursor-pointer accent-blue-500"
                    title="완료 여부"
                  />
                )}
                <input
                  ref={(element) => {
                    lineInputRefs.current[index] = element;
                  }}
                  value={inputValue}
                  onChange={(event) => updateLineText(index, event.target.value)}
                  onFocus={(event) => recordSelection(index, event.currentTarget)}
                  onClick={(event) => recordSelection(index, event.currentTarget)}
                  onKeyUp={(event) => recordSelection(index, event.currentTarget)}
                  onSelect={(event) => recordSelection(index, event.currentTarget)}
                  onKeyDown={(event) => handleLineKeyDown(event, index)}
                  onPaste={(event) => handleLinePaste(event, index)}
                  placeholder={index === 0 && content === '' ? '메모를 입력하세요...' : ''}
                  className={`min-w-0 flex-1 border-0 bg-transparent px-0 py-0.5 text-gray-200 placeholder-gray-600 outline-none ${
                    todo?.checked ? 'text-gray-500 line-through' : ''
                  }`}
                />
                <button
                  onClick={() => handleDeleteLine(index)}
                  className="shrink-0 rounded px-1.5 text-sm text-gray-600 opacity-0 transition hover:bg-gray-800 hover:text-gray-300 group-hover:opacity-100 focus:opacity-100"
                  title="줄 삭제"
                >
                  ×
                </button>
              </div>
            );
          })}
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
            <button
              onClick={() => handleDeleteLine()}
              className="w-full px-3 py-2 text-left text-sm transition-colors text-red-300 hover:bg-gray-800"
            >
              줄 삭제
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
