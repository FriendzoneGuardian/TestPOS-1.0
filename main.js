const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        frame: false, // Frameless window to match "TheMoneyShot" aesthetic
        titleBarStyle: 'hidden',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });

    // Load the Django dev server
    win.loadURL('http://127.0.0.1:8000');

    // Open DevTools during development if needed
    // win.webContents.openDevTools();
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// IPC handler for future silent printing features
ipcMain.on('print-receipt', (event, data) => {
    // Logic for silent printing will go here
    console.log('Print request received:', data);
});
