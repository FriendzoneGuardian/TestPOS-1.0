// ============================================================
// The MoneyShot — Electron Main Process
// Alpha 2.0 — "Desk Slam & Lube Job"
// ============================================================
// This file manages:
//   1. Spawning the Django dev server as a child process
//   2. Polling for server readiness before loading the window
//   3. Cleaning up the Django process tree on exit (Windows-safe)
// ============================================================

const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const { spawn, execSync } = require('child_process');
const http = require('http');

// --- Configuration ---
const DJANGO_HOST = '127.0.0.1';
const DJANGO_PORT = 8000;
const DJANGO_URL = `http://${DJANGO_HOST}:${DJANGO_PORT}/login/`;
const POLL_INTERVAL_MS = 800;
const MAX_POLL_ATTEMPTS = 30; // 30 * 800ms = 24 seconds max wait

let mainWindow = null;
let djangoProcess = null;

// --- Dev Detection (replaces broken electron-is-dev ESM package) ---
function isDev() {
    return !app.isPackaged;
}

// --- Django Server Management ---
function getPythonPath() {
    if (isDev()) {
        const isWin = process.platform === "win32";
        const venvPath = isWin
            ? path.join(__dirname, '..', 'venv', 'Scripts', 'python.exe')
            : path.join(__dirname, '..', 'venv', 'bin', 'python');

        const fs = require('fs');
        if (fs.existsSync(venvPath)) {
            return venvPath;
        }
    }
    // Fallback if venv doesn't exist or in production
    return process.platform === 'win32' ? 'python' : 'python3';
}

function startDjango() {
    const pythonPath = getPythonPath();
    const projectRoot = path.join(__dirname, '..');

    console.log(`[Electron] Starting Django server...`);
    console.log(`[Electron] Python: ${pythonPath}`);
    console.log(`[Electron] CWD: ${projectRoot}`);

    const isWin = process.platform === 'win32';

    djangoProcess = spawn(pythonPath, ['manage.py', 'runserver', `${DJANGO_HOST}:${DJANGO_PORT}`, '--noreload'], {
        cwd: projectRoot,
        stdio: ['ignore', 'pipe', 'pipe'],
        // Detach on Unix to create a process group so we can kill it all.
        // On Windows, taskkill works via PID, so we don't need detached.
        detached: !isWin,
    });

    djangoProcess.stdout.on('data', (data) => {
        console.log(`[Django stdout] ${data.toString().trim()}`);
    });

    djangoProcess.stderr.on('data', (data) => {
        // Django logs most startup output to stderr
        console.log(`[Django stderr] ${data.toString().trim()}`);
    });

    djangoProcess.on('error', (err) => {
        console.error(`[Electron] Failed to start Django process: ${err.message}`);
    });

    djangoProcess.on('exit', (code) => {
        console.log(`[Electron] Django process exited with code ${code}`);
        djangoProcess = null;
    });
}

function killDjango() {
    if (!djangoProcess) return;

    console.log('[Electron] Killing Django process tree...');

    try {
        if (process.platform === 'win32') {
            // Windows: taskkill /T kills the entire process tree
            execSync(`taskkill /PID ${djangoProcess.pid} /T /F`, { stdio: 'ignore' });
        } else {
            // Unix: kill the process group (works because we set detached: true)
            process.kill(-djangoProcess.pid, 'SIGTERM');
        }
    } catch (err) {
        // Process may have already exited
        console.log(`[Electron] Cleanup note: ${err.message}`);
    }

    djangoProcess = null;
}

// --- Server Readiness Polling ---
function waitForServer(attempt = 0) {
    return new Promise((resolve, reject) => {
        if (attempt >= MAX_POLL_ATTEMPTS) {
            reject(new Error('Django server did not start in time.'));
            return;
        }

        const req = http.get(`http://${DJANGO_HOST}:${DJANGO_PORT}/`, (res) => {
            // Any response (even a redirect) means the server is alive
            console.log(`[Electron] Server responded with status ${res.statusCode} (attempt ${attempt + 1})`);
            resolve();
        });

        req.on('error', () => {
            // Connection refused — server not ready yet
            console.log(`[Electron] Waiting for server... (attempt ${attempt + 1}/${MAX_POLL_ATTEMPTS})`);
            setTimeout(() => {
                waitForServer(attempt + 1).then(resolve).catch(reject);
            }, POLL_INTERVAL_MS);
        });

        req.setTimeout(2000, () => {
            req.destroy();
        });
    });
}

// --- Window Creation ---
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 860,
        minWidth: 1024,
        minHeight: 700,
        backgroundColor: '#020617', // Slate 950
        show: false, // Don't show until content is loaded
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
        autoHideMenuBar: true, // Hide menu bar on Windows/Linux
        title: 'The MoneyShot — POS System',
        icon: path.join(__dirname, '..', 'static', 'images', 'logo.png'),
    });

    // Show window only when content is ready (prevents white flash)
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        if (isDev()) {
            // Uncomment below to open DevTools in development:
            // mainWindow.webContents.openDevTools();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    return mainWindow;
}

// --- IPC Handlers for window controls ---
ipcMain.on('window-minimize', () => {
    if (mainWindow) mainWindow.minimize();
});
ipcMain.on('window-maximize', () => {
    if (mainWindow) {
        mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
    }
});
ipcMain.on('window-close', () => {
    if (mainWindow) mainWindow.close();
});

// --- App Lifecycle ---
app.on('ready', async () => {
    Menu.setApplicationMenu(null); // Remove default menu bar
    console.log('[Electron] App ready. Starting Django...');
    startDjango();

    const win = createWindow();

    try {
        await waitForServer();
        console.log('[Electron] Server is up! Loading UI...');
        win.loadURL(DJANGO_URL);
    } catch (err) {
        console.error(`[Electron] ${err.message}`);
        win.loadURL(`data:text/html,<html><body style="background:#020617;color:#ef4444;font-family:system-ui;display:flex;justify-content:center;align-items:center;height:100vh;margin:0"><div style="text-align:center"><h1>Server Failed to Start</h1><p>Check the terminal for Django errors.</p><p style="color:#64748b;font-size:12px">Expected at ${DJANGO_URL}</p></div></body></html>`);
        win.show();
    }
});

app.on('window-all-closed', () => {
    app.quit();
});

app.on('before-quit', () => {
    killDjango();
});
