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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const path = await window.electronAPI.settings.get('savePath');
      if (path) {
        setSavePath(path);
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
      setTimeout(() => {
        setIsSaving(false);
      }, 500);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setIsSaving(false);
    }
  };

  const handleOpenFolder = async () => {
    if (savePath && savePath.trim()) {
      try {
        const result = await window.electronAPI.shell.openPath(savePath);
        if (!result.success && result.error) {
          alert('폴더를 열 수 없습니다: ' + result.error);
        }
      } catch (error) {
        console.error('Failed to open folder:', error);
        alert('폴더를 열 수 없습니다.');
      }
    } else {
      alert('저장 경로를 먼저 입력해주세요.');
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
                  placeholder="예: C:\Users\Documents\Memos"
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
              메모가 저장될 기본 경로를 설정합니다. 비워두면 기본 경로를 사용합니다.
            </p>
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
