# Implementation Plan: Alpha 2.0 — "Desk Slam & Lube Job" (Electron Shell & Polish)

## 1. Goal Description
Re-scaffold the Electron desktop shell for **The MoneyShot** POS system. The goal is to wrap the Django backend in a native desktop window, automate the server lifecycle, and provide a premium "app-like" experience.

## 2. Proposed Changes

### [NEW] One-Click Installer
To ensure seamless deployment in "Internal Farm Stores" with limited connectivity:
- #### [NEW] [setup.bat](file:///c:/Users/franc/Documents/TestPOS-1.0/setup.bat)
    - Bootstraps the environment: Checks for Python/Node, creates `venv`, installs dependencies, and runs migrations.
- #### [NEW] [install.py](file:///c:/Users/franc/Documents/TestPOS-1.0/install.py)
    - A Python-based cross-platform installer that handles directory staging and dependency verification.

### [NEW] Electron Scaffolding
- #### [NEW] [package.json](file:///c:/Users/franc/Documents/TestPOS-1.0/electron/package.json)
    - Define `main` as `main.js`.
    - Include dependencies: `electron`, `electron-is-dev`.
- #### [NEW] [main.js](file:///c:/Users/franc/Documents/TestPOS-1.0/electron/main.js)
    - **Django Process Management**: Spawn `python manage.py runserver` on startup.
    - **Lifecycle Hooks**: Shut down the Django process when the Electron window closes.
    - **Main Window**: Load `http://127.0.0.1:8000/`.

### Deployment Assessment: Venv Whitelisting
> [!IMPORTANT]
> **Assessment of Whitelisting `venv` in `.gitignore`:**
> While whitelisting `venv` seems tempting for "ready-to-run" offline deployment, it is **highly discouraged** for several reasons:
> 1. **Path Dependency**: `venv` contains absolute paths in several scripts (e.g., `activate.bat`). Moving the folder to a different user path on a client machine will break it.
> 2. **Environment Mismatch**: If the client has a different minor version of Python or a slightly different Windows architecture, the compiled binaries in `venv` (like database drivers) will fail.
>
> **Recommended Strategy for Offline Deployment:**
> Instead of whitelisting `venv`, we will implement **"Vended Wheels"**:
> - Download all required `.whl` files into a `vendor/` folder.
> - The `setup.bat` will run `pip install --no-index --find-links=./vendor -r requirements.txt`.
> - This ensures 100% offline installation success without the fragility of a shared `venv`.

## 3. Verification Plan

### Automated Tests
- `npm run lint` (if configured) for JS files.

### Manual Verification
1.  **Startup Flow**: Run `npm run app:dev`. Verify that a native window opens and shows the MoneyShot login page without needing to manually run `python manage.py runserver`.
2.  **Persistence**: Log in and verify that cookies/session persist correctly.
3.  **Shutdown**: Close the Electron window and verify that the `python` dev server process is correctly terminated.
4.  **Window Controls**: Test minimize/maximize functionality.
