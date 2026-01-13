"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WindowManager = void 0;
const electron_1 = require("electron");
const path = __importStar(require("path"));
class WindowManager {
    constructor() {
        this.windows = new Map();
    }
    createNewMemoWindow(memoId) {
        const { width, height } = electron_1.screen.getPrimaryDisplay().workAreaSize;
        const win = new electron_1.BrowserWindow({
            width: 400,
            height: 500,
            x: Math.floor((width - 400) / 2),
            y: Math.floor((height - 500) / 2),
            webPreferences: {
                preload: path.join(__dirname, '../preload/index.js'),
                nodeIntegration: false,
                contextIsolation: true,
            },
            frame: true,
            alwaysOnTop: false,
        });
        if (process.env.NODE_ENV === 'development') {
            const port = process.env.VITE_PORT || '3000';
            win.loadURL(`http://localhost:${port}`);
            win.webContents.openDevTools();
        }
        else {
            win.loadFile(path.join(__dirname, '../../dist/renderer/index.html'));
        }
        this.windows.set(win.id, win);
        win.on('moved', () => {
            this.saveWindowState(win);
        });
        win.on('resized', () => {
            this.saveWindowState(win);
        });
        win.on('closed', () => {
            this.windows.delete(win.id);
        });
        return win;
    }
    saveWindowState(win) {
        const bounds = win.getBounds();
        const alwaysOnTop = win.isAlwaysOnTop();
        win.webContents.send('window:state-changed', {
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
            alwaysOnTop,
        });
    }
    getWindow(windowId) {
        return this.windows.get(windowId);
    }
    getAllWindows() {
        return Array.from(this.windows.values());
    }
}
exports.WindowManager = WindowManager;
