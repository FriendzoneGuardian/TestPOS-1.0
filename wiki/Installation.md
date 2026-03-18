# 🛠️ Installation Guide

Follow these steps to set up the **MoneyShot** development environment.

## 1. Prerequisites
Ensure you have the following installed on your system:
- **Python 3.10+**: [Download here](https://www.python.org/downloads/)
- **Node.js 16+**: [Download here](https://nodejs.org/) (Required for Electron/Tailwind)
- **Git**: [Download here](https://git-scm.com/)

## 2. Clone the Repository
```bash
git clone https://github.com/FriendzoneGuardian/TestPOS-1.0.git
cd TestPOS-1.0
```

## 3. Python Environment Setup
We recommend using a virtual environment to manage dependencies.
```powershell
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

## 4. Frontend & Shell Setup
Install the necessary Node modules for the Electron wrapper and styling.
```bash
npm install
```

## 5. Database Initialization
Initialize the Django ORM and seed the initial data.
```bash
python manage.py migrate
# Seed data (if applicable)
python manage.py shell < scripts/seed_initial_data.py
```

## 6. Running the Application
To run the full desktop experience (Recommended):
```bash
npm start
```
To run the web-only development server:
```bash
python manage.py runserver
```

---
> [!TIP]
> Always ensure your `venv` is active before running any `python manage.py` commands!
