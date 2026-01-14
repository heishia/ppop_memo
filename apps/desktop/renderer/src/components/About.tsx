import React, { useState, useEffect } from 'react';

const InfoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

const ExternalLinkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
  </svg>
);

interface AboutProps {
  onClose: () => void;
}

const PPOP_INFO = {
  brandName: 'PPOP',
  fullName: 'Dev Agency PPOP',
  developer: '진푸른 (예명: 김뽑희)',
  description: '개발자 진푸른(예명 김뽑희)가 만든 개발 Agency 입니다.',
  tagline: '프로그램, 앱, 서비스 등등 각종 오픈소스들을 공유합니다',
  website: ''
};

function About({ onClose }: AboutProps) {
  const [version, setVersion] = useState('');
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  useEffect(() => {
    loadVersion();
  }, []);

  const loadVersion = async () => {
    try {
      const appVersion = await window.electronAPI.app.getVersion();
      setVersion(appVersion || '1.0.0');
    } catch (error) {
      console.error('Failed to load version:', error);
      setVersion('1.0.0');
    }
  };

  const handleCheckForUpdates = async () => {
    setIsCheckingUpdate(true);
    try {
      await window.electronAPI.app.checkForUpdates();
    } catch (error) {
      console.error('Failed to check for updates:', error);
    } finally {
      setTimeout(() => {
        setIsCheckingUpdate(false);
      }, 2000);
    }
  };
  const handleOpenWebsite = async () => {
    if (PPOP_INFO.website) {
      try {
        await window.electronAPI.shell.openPath(PPOP_INFO.website);
      } catch (error) {
        console.error('Failed to open website:', error);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="text-blue-600">
              <InfoIcon />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">정보</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 text-gray-600 transition-colors"
            title="닫기"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="text-center">
            <h3 className="text-3xl font-bold text-blue-600 mb-2">
              {PPOP_INFO.brandName}
            </h3>
            <p className="text-sm text-gray-600 mb-1">{PPOP_INFO.fullName}</p>
            <p className="text-xs text-gray-500">Version {version}</p>
          </div>

          <div className="border-t border-gray-200 pt-4 space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-1">개발자</h4>
              <p className="text-sm text-gray-600">{PPOP_INFO.developer}</p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-1">소개</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                {PPOP_INFO.description}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {PPOP_INFO.tagline}
              </p>
            </div>

            {PPOP_INFO.website && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">웹사이트</h4>
                <button
                  onClick={handleOpenWebsite}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                >
                  <span>{PPOP_INFO.website}</span>
                  <ExternalLinkIcon />
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 pt-4">
            <button
              onClick={handleCheckForUpdates}
              disabled={isCheckingUpdate}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${
                isCheckingUpdate
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              <RefreshIcon />
              <span>{isCheckingUpdate ? '업데이트 확인 중...' : '업데이트 확인'}</span>
            </button>
          </div>

          <div className="border-t border-gray-200 pt-4 mt-4">
            <p className="text-xs text-gray-500 text-center">
              © 2026 PPOP. All rights reserved.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex justify-end sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

export default About;
