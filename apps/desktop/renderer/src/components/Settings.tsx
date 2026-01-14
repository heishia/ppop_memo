import React, { useState, useEffect } from 'react';

const FolderIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);

interface SettingsProps {
  onClose: () => void;
}

function Settings({ onClose }: SettingsProps) {
  const [savePath, setSavePath] = useState('');
  const [originalPath, setOriginalPath] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [defaultPath, setDefaultPath] = useState('');
  const [currentDbPath, setCurrentDbPath] = useState('');
  const [needsRestart, setNeedsRestart] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const config = await window.electronAPI.settings.getConfig();
      if (config && config.savePath) {
        setSavePath(config.savePath);
        setOriginalPath(config.savePath);
      }
      
      const userData = await window.electronAPI.app.getPath('userData');
      if (userData) {
        setDefaultPath(userData);
      }

      const dbPath = await window.electronAPI.settings.getDatabasePath();
      if (dbPath) {
        setCurrentDbPath(dbPath);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSavePath(e.target.value);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await window.electronAPI.settings.set('savePath', savePath);
      
      if (savePath !== originalPath) {
        setNeedsRestart(true);
      }
      
      setTimeout(() => {
        setIsSaving(false);
      }, 500);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setIsSaving(false);
    }
  };

  const handleOpenFolder = async () => {
    const pathToOpen = savePath && savePath.trim() ? savePath.trim() : defaultPath;
    
    if (!pathToOpen) {
      alert('저장 경로를 먼저 입력해주세요.\n\n예: C:\\Users\\Documents\\Memos');
      return;
    }

    try {
      console.log('Attempting to open path:', pathToOpen);
      const result = await window.electronAPI.shell.openPath(pathToOpen);
      console.log('Open folder result:', result);
      
      if (!result.success) {
        if (result.error) {
          alert('폴더를 열 수 없습니다.\n\n경로: ' + pathToOpen + '\n오류: ' + result.error + '\n\n경로가 존재하는지 확인해주세요.');
        } else {
          alert('폴더를 열 수 없습니다. 경로를 확인해주세요.');
        }
      }
    } catch (error) {
      console.error('Failed to open folder:', error);
      alert('폴더를 열 수 없습니다: ' + error);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
          <div className="text-center">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-800">설정</h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              저장 경로
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={savePath}
                  onChange={handleSavePathChange}
                  placeholder="비워두면 기본 경로 사용"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleOpenFolder}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors flex items-center gap-1"
                title="폴더 열기"
              >
                <FolderIcon />
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              메모가 저장될 경로를 설정합니다. 비워두면 기본 경로를 사용합니다.
            </p>
            {needsRestart && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm font-medium text-yellow-800">⚠️ 앱 재시작 필요</p>
                <p className="text-xs text-yellow-700 mt-1">
                  저장 경로가 변경되었습니다. 변경사항을 적용하려면 앱을 재시작해주세요.
                </p>
              </div>
            )}
            {currentDbPath && (
              <div className="mt-3 p-3 bg-gray-50 rounded-md">
                <p className="text-xs font-medium text-gray-700 mb-1">현재 데이터베이스 위치:</p>
                <p className="text-xs text-gray-600 break-all">{currentDbPath}</p>
                <button
                  onClick={async () => {
                    const dbDir = currentDbPath.substring(0, currentDbPath.lastIndexOf('\\')) || currentDbPath.substring(0, currentDbPath.lastIndexOf('/'));
                    const result = await window.electronAPI.shell.openPath(dbDir);
                    if (!result.success && result.error) {
                      alert('폴더를 열 수 없습니다: ' + result.error);
                    }
                  }}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-700 underline"
                >
                  데이터베이스 폴더 열기
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className={`px-4 py-2 text-sm text-white rounded-md transition-colors ${
              isSaving ? 'bg-green-500' : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isSaving ? '저장됨' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;
