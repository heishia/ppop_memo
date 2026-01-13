import React, { useState, useEffect } from 'react';

interface Memo {
  id: number;
  title: string | null;
  content: string;
  mode: string;
  folder_id: number | null;
  created_at: string;
  updated_at: string;
}

interface Folder {
  id: number;
  name: string;
  parent_id: number | null;
}

interface MemoManagementProps {
  onClose: () => void;
  onLoadMemo: (memoId: number) => void;
}

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);

const FolderIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);

const MemoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

function MemoManagement({ onClose, onLoadMemo }: MemoManagementProps) {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);

  useEffect(() => {
    loadMemos();
    loadFolders();
  }, []);

  const loadMemos = async () => {
    const allMemos = await window.electronAPI.memo.list();
    setMemos(allMemos);
  };

  const loadFolders = async () => {
    const allFolders = await window.electronAPI.folder.list();
    setFolders(allFolders);
  };

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      const results = await window.electronAPI.memo.search(searchQuery);
      setMemos(results);
    } else {
      loadMemos();
    }
  };

  const handleDeleteMemo = async (memoId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('이 메모를 삭제하시겠습니까?')) {
      await window.electronAPI.memo.delete(memoId);
      loadMemos();
    }
  };

  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      await window.electronAPI.folder.create(newFolderName);
      setNewFolderName('');
      setShowNewFolderInput(false);
      loadFolders();
    }
  };

  const handleDeleteFolder = async (folderId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('이 폴더를 삭제하시겠습니까? (폴더 내 메모는 유지됩니다)')) {
      await window.electronAPI.folder.delete(folderId);
      if (selectedFolder === folderId) {
        setSelectedFolder(null);
      }
      loadFolders();
      loadMemos();
    }
  };

  const handleMemoClick = (memoId: number) => {
    onLoadMemo(memoId);
    onClose();
  };

  const filteredMemos = selectedFolder
    ? memos.filter(memo => memo.folder_id === selectedFolder)
    : memos;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMemoPreview = (memo: Memo) => {
    if (memo.title) return memo.title;
    if (memo.content) {
      return memo.content.substring(0, 50) + (memo.content.length > 50 ? '...' : '');
    }
    return '빈 메모';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[800px] h-[600px] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">메모 관리</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-48 border-r border-gray-200 flex flex-col">
            <div className="p-3 border-b border-gray-200">
              <button
                onClick={() => setSelectedFolder(null)}
                className={`w-full px-3 py-2 rounded text-sm text-left transition-colors ${
                  selectedFolder === null ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                모든 메모
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase">폴더</span>
                <button
                  onClick={() => setShowNewFolderInput(true)}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  + 새 폴더
                </button>
              </div>

              {showNewFolderInput && (
                <div className="mb-2">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                    onBlur={handleCreateFolder}
                    placeholder="폴더 이름"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    autoFocus
                  />
                </div>
              )}

              {folders.map(folder => (
                <div
                  key={folder.id}
                  className={`flex items-center justify-between px-3 py-2 rounded mb-1 cursor-pointer transition-colors ${
                    selectedFolder === folder.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'
                  }`}
                  onClick={() => setSelectedFolder(folder.id)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FolderIcon />
                    <span className="text-sm truncate">{folder.name}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteFolder(folder.id, e)}
                    className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <div className="p-3 border-b border-gray-200">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="메모 검색..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <SearchIcon />
                  </div>
                </div>
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  검색
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {filteredMemos.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <MemoIcon />
                    <p className="mt-2 text-sm">메모가 없습니다</p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-2">
                  {filteredMemos.map(memo => (
                    <div
                      key={memo.id}
                      onClick={() => handleMemoClick(memo.id)}
                      className="p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md cursor-pointer transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <MemoIcon />
                            <span className="text-xs text-gray-500">
                              {memo.mode === 'canvas' ? '캔버스' : '텍스트'}
                            </span>
                          </div>
                          <h3 className="font-medium text-gray-800 truncate mb-1">
                            {getMemoPreview(memo)}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {formatDate(memo.updated_at)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => handleDeleteMemo(memo.id, e)}
                          className="p-1.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MemoManagement;
