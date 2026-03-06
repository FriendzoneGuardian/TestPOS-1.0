# 💰 TheMoneyShot — POS System

> *"Capture every sale, right on target."*

A modern, multi-branch Point of Sale system built with **Flask**, **Tailwind CSS**, and **Flowbite**. Dark-mode glassmorphism UI out of the box.

**Version:** Alpha 1.0

---

## ✨ Features

| Module | Description |
|--------|-------------|
| **POS Terminal** | Product grid, real-time cart, cash & loan checkout |
| **Branch Management** | Multi-branch support with per-branch stock tracking |
| **Void System** | Void individual items or entire orders with audit logging |
| **Loan / Credit** | Customer credit tracking with payment processing |
| **Reports** | Sales & void reports with CSV export |
| **Dashboard** | Live stats, 7-day sales chart (ApexCharts), top products |

## 🛠️ Tech Stack

- **Backend:** Python 3 · Flask · SQLAlchemy · Flask-Login · Flask-Migrate
- **Frontend:** Jinja2 · Tailwind CSS (CDN) · Flowbite · ApexCharts
- **Database:** SQLite (dev) — PostgreSQL-ready (prod)

## 🚀 Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/TheMoneyShot.git
cd TheMoneyShot

# 2. Create virtual environment
python -m venv venv

# 3. Activate (Windows)
.\venv\Scripts\activate
# or macOS/Linux: source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Seed the database
python seed.py

# 6. Run the dev server
python run.py
```

Then open **http://127.0.0.1:5000** in your browser.

## 🔑 Default Accounts

| Username | Password | Role | Branch |
|----------|----------|------|--------|
| `admin` | `admin123` | Admin | Main Branch |
| `manager` | `manager123` | Manager | Main Branch |
| `cashier1` | `cashier123` | Cashier | Main Branch |
| `cashier2` | `cashier123` | Cashier | Uptown Branch |

## 📂 Project Structure

```
TheMoneyShot/
├── app/
│   ├── __init__.py          # App factory
│   ├── models.py            # Database models (8 tables)
│   ├── routes/
│   │   ├── auth.py          # Login / Logout
│   │   ├── dashboard.py     # Dashboard + chart API
│   │   ├── pos.py           # POS terminal + checkout + voids
│   │   ├── branches.py      # Branch CRUD + stock management
│   │   ├── reports.py       # Sales/void reports + CSV export
│   │   └── loans.py         # Customer loans + payments
│   └── templates/           # Jinja2 templates (Tailwind + Flowbite)
├── config.py
├── run.py
├── seed.py
├── requirements.txt
└── .env
```

## 📋 Roadmap

- [ ] Receipt printing / PDF generation
- [ ] Barcode scanner integration
- [ ] User management admin panel
- [ ] Inventory alerts (low stock)
- [ ] Multi-currency support
- [ ] Deployment guide (Docker / Gunicorn)

## 📄 License

MIT — do whatever you want with it. Just don't blame us if your accountant has questions.

---

*Built with ☕ and questionable naming decisions.*
