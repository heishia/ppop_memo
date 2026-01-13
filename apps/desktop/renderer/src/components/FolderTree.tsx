import React, { useState, useEffect } from 'react';

interface Folder {
  id: number;
  name: string;
  parent_id?: number;
}

function FolderTree({ onFolderSelect }: { onFolderSelect?: (folderId?: number) => void }) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<number | undefined>();

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    const result = await window.electronAPI.folder?.list();
    if (result) {
      setFolders(result);
    }
  };

  const handleFolderClick = (folderId: number) => {
    setSelectedFolder(folderId);
    onFolderSelect?.(folderId);
  };

  const handleRootClick = () => {
    setSelectedFolder(undefined);
    onFolderSelect?.(undefined);
  };

  return (
    <div className="w-64 border-r p-4">
      <h2 className="font-bold mb-4">폴더</h2>
      <div
        onClick={handleRootClick}
        className={`p-2 cursor-pointer rounded mb-1 ${selectedFolder === undefined ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
      >
        전체
      </div>
      {folders.map((folder) => (
        <div
          key={folder.id}
          onClick={() => handleFolderClick(folder.id)}
          className={`p-2 cursor-pointer rounded mb-1 ${selectedFolder === folder.id ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
        >
          {folder.name}
        </div>
      ))}
    </div>
  );
}

export default FolderTree;
