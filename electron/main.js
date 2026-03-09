'use strict';

const { app, BrowserWindow, ipcMain, nativeTheme } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

// ─── Config ──────────────────────────────────────────────────────
const FLASK_PORT = 5000;
const FLASK_URL = `http://127.0.0.1:${FLASK_PORT}`;
const POLL_INTERVAL_MS = 500;
const FLASK_TIMEOUT_MS = 30_000;

let mainWindow = null;
let splashWindow = null;
let flaskProcess = null;

// ─── Spawn Flask ──────────────────────────────────────────────────
function startFlask() {
    const fs = require('fs');
    let pythonCmd = process.platform === 'win32' ? 'python' : 'python3';

    // In dev mode, try to use the local virtual environment
    const venvWin = path.join(__dirname, '..', 'venv', 'Scripts', 'python.exe');
    const venvMac = path.join(__dirname, '..', 'venv', 'bin', 'python');

    if (process.platform === 'win32' && fs.existsSync(venvWin)) {
        pythonCmd = venvWin;
    } else if (fs.existsSync(venvMac)) {
        pythonCmd = venvMac;
    }

    const scriptPath = path.join(__dirname, '..', 'run.py');

    flaskProcess = spawn(pythonCmd, [scriptPath], {
        cwd: path.join(__dirname, '..'),
        env: { ...process.env, FLASK_ENV: 'production', PYTHONUNBUFFERED: '1' },
        stdio: ['ignore', 'pipe', 'pipe'],
    });

    flaskProcess.stdout.on('data', (d) => console.log('[Flask]', d.toString().trim()));
    flaskProcess.stderr.on('data', (d) => console.error('[Flask ERR]', d.toString().trim()));

    flaskProcess.on('close', (code) => {
        console.log(`[Flask] exited with code ${code}`);
    });
}

// ─── Poll until Flask is Ready ───────────────────────────────────
function waitForFlask(resolve, reject, elapsed = 0) {
    http.get(FLASK_URL, (res) => {
        if (res.statusCode < 500) resolve();
        else retry(resolve, reject, elapsed);
    }).on('error', () => retry(resolve, reject, elapsed));
}

function retry(resolve, reject, elapsed) {
    if (elapsed >= FLASK_TIMEOUT_MS) {
        reject(new Error('Flask did not start in time.'));
        return;
    }
    setTimeout(() => waitForFlask(resolve, reject, elapsed + POLL_INTERVAL_MS), POLL_INTERVAL_MS);
}

// ─── Splash Window ───────────────────────────────────────────────
function createSplash() {
    splashWindow = new BrowserWindow({
        width: 480,
        height: 320,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        resizable: false,
        center: true,
        webPreferences: { contextIsolation: true },
    });
    splashWindow.loadFile(path.join(__dirname, 'splash.html'));
}

// ─── Main Window ─────────────────────────────────────────────────
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1440,
        height: 900,
        minWidth: 1024,
        minHeight: 700,
        frame: true,           // Enable native OS Title Bar
        autoHideMenuBar: true,
        show: false,
        title: 'TheMoneyShot',
        backgroundColor: '#020617',   // surface-950 — avoids white flash
        icon: path.join(__dirname, '..', 'app', 'static', 'img', 'icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    // Remove default menu bar
    mainWindow.setMenuBarVisibility(false);

    mainWindow.loadURL(FLASK_URL);

    mainWindow.once('ready-to-show', () => {
        if (splashWindow && !splashWindow.isDestroyed()) {
            splashWindow.close();
            splashWindow = null;
        }
        mainWindow.show();
        mainWindow.focus();
    });

    mainWindow.on('closed', () => { mainWindow = null; });
}

// ─── IPC Handlers (Custom Title Bar) ─────────────────────────────
ipcMain.on('window:minimize', () => mainWindow?.minimize());
ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) mainWindow.restore();
    else mainWindow?.maximize();
});
ipcMain.on('window:close', () => mainWindow?.close());

// ─── App Lifecycle ────────────────────────────────────────────────
app.whenReady().then(async () => {
    nativeTheme.themeSource = 'dark';

    createSplash();
    startFlask();

    try {
        await new Promise((resolve, reject) => waitForFlask(resolve, reject));
        createMainWindow();
    } catch (err) {
        console.error(err.message);
        app.quit();
    }
});

app.on('window-all-closed', () => {
    killFlask();
    if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', killFlask);

function killFlask() {
    if (flaskProcess) {
        console.log('[Electron] Killing Flask process…');
        try {
            // Windows needs taskkill to kill the entire process tree
            if (process.platform === 'win32') {
                spawn('taskkill', ['/pid', flaskProcess.pid, '/f', '/t']);
            } else {
                flaskProcess.kill('SIGTERM');
            }
        } catch (e) {
            console.error('Failed to kill Flask:', e);
        }
        flaskProcess = null;
    }
}
