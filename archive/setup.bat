@echo off
setlocal

echo.
echo ************************************************************
echo *     THE MONEYSHOT - POS SYSTEM - ONE-CLICK INSTALLER     *
echo ************************************************************
echo.

:: Check for Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Please install Python 3.10+ and add it to PATH.
    pause
    exit /b 1
)

:: Check for Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Please install Node.js and add it to PATH.
    pause
    exit /b 1
)

:: Create Virtual Environment if not exists
if not exist venv (
    echo [1/5] Creating Python virtual environment...
    python -m venv venv
) else (
    echo [1/5] Virtual environment already exists.
)

:: Activate venv and install dependencies
echo [2/5] Installing Python dependencies...
call venv\Scripts\activate.bat
:: Check for vendor directory for offline install
if exist vendor (
    pip install --no-index --find-links=./vendor -r requirements.txt
) else (
    pip install -r requirements.txt
)

:: Install Node dependencies
echo [3/5] Installing Node.js dependencies...
npm install

:: Setup Electron folder
echo [4/5] Setting up Electron shell...
cd electron
npm install
cd ..

:: Run Migrations and Seed
echo [5/5] Preparing database...
python manage.py migrate
python manage.py seed_pos

echo.
echo ************************************************************
echo *         INSTALLATION COMPLETE - READY FOR ACTION         *
echo ************************************************************
echo.
echo To launch the app, run: npm run app:dev
echo.
pause
