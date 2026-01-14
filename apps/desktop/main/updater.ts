import pkg from 'electron-updater';
import { BrowserWindow, dialog } from 'electron';

const { autoUpdater } = pkg;

export function setupAutoUpdater(mainWindow: BrowserWindow | null): void {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for updates...');
  });

  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info);
    
    if (mainWindow) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: '업데이트 가능',
        message: `새로운 버전 ${info.version}이 있습니다.`,
        detail: '업데이트를 다운로드하시겠습니까?',
        buttons: ['다운로드', '나중에'],
        defaultId: 0,
        cancelId: 1
      }).then((result) => {
        if (result.response === 0) {
          autoUpdater.downloadUpdate();
          
          if (mainWindow) {
            mainWindow.webContents.send('update:downloading');
          }
        }
      });
    }
  });

  autoUpdater.on('update-not-available', () => {
    console.log('Update not available');
  });

  autoUpdater.on('error', (err) => {
    console.error('Update error:', err);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    const message = `다운로드 속도: ${progressObj.bytesPerSecond} - 다운로드 ${progressObj.percent}%`;
    console.log(message);
    
    if (mainWindow) {
      mainWindow.webContents.send('update:progress', progressObj);
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info);
    
    if (mainWindow) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: '업데이트 준비 완료',
        message: '업데이트가 다운로드되었습니다.',
        detail: '지금 재시작하여 업데이트를 설치하시겠습니까?',
        buttons: ['재시작', '나중에'],
        defaultId: 0,
        cancelId: 1
      }).then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall(false, true);
        }
      });
    }
  });
}

export function checkForUpdates(): void {
  autoUpdater.checkForUpdates();
}
