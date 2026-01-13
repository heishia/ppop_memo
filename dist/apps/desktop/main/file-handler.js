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
exports.setupFileHandler = setupFileHandler;
const electron_1 = require("electron");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const database_1 = require("./database");
function setupFileHandler(windowManager) {
    if (process.platform === 'win32') {
        electron_1.app.setAsDefaultProtocolClient('ppop-memo');
    }
    electron_1.app.on('open-file', async (event, filePath) => {
        event.preventDefault();
        if (fs.existsSync(filePath)) {
            const ext = path.extname(filePath).toLowerCase();
            if (ext === '.txt' || ext === '.md') {
                const content = fs.readFileSync(filePath, 'utf-8');
                const db = (0, database_1.getDatabase)();
                const result = db.prepare('INSERT INTO memos (title, content) VALUES (?, ?)').run(path.basename(filePath), content);
                const win = windowManager.createNewMemoWindow(result.lastInsertRowid);
                win.webContents.once('did-finish-load', () => {
                    win.webContents.send('memo:load', result.lastInsertRowid);
                });
            }
        }
    });
    const args = process.argv.slice(1);
    if (args.length > 0) {
        const filePath = args[0];
        if (fs.existsSync(filePath)) {
            const ext = path.extname(filePath).toLowerCase();
            if (ext === '.txt' || ext === '.md') {
                const content = fs.readFileSync(filePath, 'utf-8');
                const db = (0, database_1.getDatabase)();
                const result = db.prepare('INSERT INTO memos (title, content) VALUES (?, ?)').run(path.basename(filePath), content);
            }
        }
    }
}
