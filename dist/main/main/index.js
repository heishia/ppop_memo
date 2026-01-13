"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const database_1 = require("./database");
const ipc_handlers_1 = require("./ipc-handlers");
const window_manager_1 = require("./window-manager");
const file_handler_1 = require("./file-handler");
let windowManager;
function createWindow() {
    windowManager = new window_manager_1.WindowManager();
    electron_1.app.whenReady().then(() => {
        (0, database_1.initDatabase)();
        (0, ipc_handlers_1.setupIpcHandlers)(windowManager);
        (0, file_handler_1.setupFileHandler)(windowManager);
        windowManager.createNewMemoWindow();
        electron_1.app.on('activate', () => {
            if (electron_1.BrowserWindow.getAllWindows().length === 0) {
                windowManager.createNewMemoWindow();
            }
        });
    });
    electron_1.app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            electron_1.app.quit();
        }
    });
}
electron_1.app.on('ready', createWindow);
