import React, { useState, useEffect } from 'react';
import ConfirmDialog from './ConfirmDialog';

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

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

function MemoManagement({ onClose, onLoadMemo }: MemoManagementProps) {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [mobileView, setMobileView] = useState<'folders' | 'memos'>('folders');
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

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
    setConfirmDialog({
      isOpen: true,
      title: '메모 삭제',
      message: '이 메모를 삭제하시겠습니까?',
      onConfirm: async () => {
        await window.electronAPI.memo.delete(memoId);
        loadMemos();
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
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
    setConfirmDialog({
      isOpen: true,
      title: '폴더 삭제',
      message: '이 폴더를 삭제하시겠습니까? (폴더 내 메모는 유지됩니다)',
      onConfirm: async () => {
        await window.electronAPI.folder.delete(folderId);
        if (selectedFolder === folderId) {
          setSelectedFolder(null);
        }
        loadFolders();
        loadMemos();
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
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

  const handleFolderClick = (folderId: number | null) => {
    setSelectedFolder(folderId);
    setMobileView('memos');
  };

  const handleBackToFolders = () => {
    setMobileView('folders');
  };

  const getSelectedFolderName = () => {
    if (selectedFolder === null) return '모든 메모';
    const folder = folders.find(f => f.id === selectedFolder);
    return folder ? folder.name : '모든 메모';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            {mobileView === 'memos' && (
              <button
                onClick={handleBackToFolders}
                className="p-1 rounded hover:bg-gray-100 text-gray-600 transition-colors lg:hidden"
              >
                <BackIcon />
              </button>
            )}
            <h2 className="text-lg font-semibold text-gray-800">
              {mobileView === 'memos' ? getSelectedFolderName() : '메모 관리'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden min-h-0">
          <div className={`w-full lg:w-48 lg:border-r border-gray-200 flex flex-col flex-shrink-0 ${mobileView === 'memos' ? 'hidden lg:flex lg:w-56 xl:w-64' : 'flex'}`}>
            <div className="p-2 md:p-3 border-b border-gray-200 flex-shrink-0">
              <button
                onClick={() => handleFolderClick(null)}
                className={`w-full px-2 md:px-3 py-2 rounded text-xs md:text-sm text-left transition-colors ${
                  selectedFolder === null ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                모든 메모
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 md:p-3 min-h-0">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase">폴더</span>
                <button
                  onClick={() => setShowNewFolderInput(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 whitespace-nowrap"
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
                    className="w-full px-2 py-1 text-xs md:text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    autoFocus
                  />
                </div>
              )}

              {folders.map(folder => (
                <div
                  key={folder.id}
                  className={`flex items-center justify-between px-2 md:px-3 py-2 rounded mb-1 cursor-pointer transition-colors ${
                    selectedFolder === folder.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'
                  }`}
                  onClick={() => handleFolderClick(folder.id)}
                >
                  <div className="flex items-center gap-1 md:gap-2 flex-1 min-w-0">
                    <FolderIcon />
                    <span className="text-xs md:text-sm truncate">{folder.name}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteFolder(folder.id, e)}
                    className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className={`flex-1 flex flex-col min-w-0 ${mobileView === 'folders' ? 'hidden lg:flex' : 'flex'}`}>
            <div className="p-2 md:p-3 border-b border-gray-200 flex-shrink-0">
              <div className="flex gap-2">
                <div className="flex-1 relative min-w-0">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="메모 검색..."
                    className="w-full pl-8 md:pl-9 pr-3 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  <div className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <SearchIcon />
                  </div>
                </div>
                <button
                  onClick={handleSearch}
                  className="px-3 md:px-4 py-2 bg-blue-600 text-white text-sm md:text-base rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                  검색
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 md:p-3 min-h-0">
              {filteredMemos.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <div className="flex justify-center mb-2">
                      <MemoIcon />
                    </div>
                    <p className="text-xs md:text-sm">메모가 없습니다</p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-2 auto-rows-max">
                  {filteredMemos.map(memo => (
                    <div
                      key={memo.id}
                      onClick={() => handleMemoClick(memo.id)}
                      className="p-2 md:p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md cursor-pointer transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 md:gap-2 mb-1">
                            <MemoIcon />
                            <span className="text-xs text-gray-500">
                              {memo.mode === 'canvas' ? '캔버스' : '텍스트'}
                            </span>
                          </div>
                          <h3 className="text-sm md:text-base font-medium text-gray-800 truncate mb-1">
                            {getMemoPreview(memo)}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {formatDate(memo.updated_at)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => handleDeleteMemo(memo.id, e)}
                          className="p-1 md:p-1.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
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

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
}

export default MemoManagement;
