# 💰 TheMoneyShot — POS System

> *From the makers of **SwiftGrade** — the Flutter-powered Capstone beast that scans answer sheets like a Zipgrade on steroids (OMR), reads handwritten short answers with OCR + NLP, and turns classrooms into game shows with Kahoot/Quizizz/Mentimeter-style interactivity.*
>
> *We present to you... a system that handles transactions so smooth, so satisfying, so precise — you'll want to do it again. And again. And maybe one more time just to be sure.*
>
> ***TheMoneyShot.** Every sale. Right on target. Every. Single. Time.*

A dangerously attractive, multi-branch Point of Sale system built with **Flask**, **Tailwind CSS**, and **Flowbite**. Dark-mode glassmorphism UI that'll make your registers blush.

**Version:** Alpha 1.6.1 — *The Velvet Rope (Backdoor Secured)*

---

## ✨ Features — What Can She Do?

| Module | Description |
|--------|-------------|
| **Theme Engine (Live)** | Instantly flip between Dawn (Light), Dusk (Dark), and Midnight (AMOLED) states. No reload needed. Smooth. |
| **Role Aesthetic System** | The environment dynamically shifts colors based on your vibe: Admin/Rose, Cashier/Turquoise, Auditor/Amber. |
| **Branch Management** | Multi-branch support with per-branch stock tracking. She gets around — professionally |
| **Void System** | Void individual items or entire orders. Full audit logging, because we don't do anything without consent |
| **Loan / Credit** | Customer credit tracking with payment processing. We keep tabs on who owes us one |
| **Reports** | Sales & void reports with CSV export. She exposes everything — every number, every transaction |
| **Dashboard** | Live stats, 7-day sales chart (ApexCharts), top sellers. The full-body view of your business |

## 🛠️ Tech Stack — What's Under the Hood

No need to undress the architecture yourself — here's the full reveal:

- **Backend:** Python 3 · Flask · SQLAlchemy · Flask-Login · Flask-Migrate
- **Frontend:** Jinja2 · Tailwind CSS (local build) · Flowbite · ApexCharts
- **Database:** SQLite (dev) — PostgreSQL-ready (prod)

> Built tight, runs smooth, and handles heavy loads with grace.

## 🚀 Quick Start — Getting It Up and Running

```bash
# 1. Clone the repo (take her home)
git clone https://github.com/YOUR_USERNAME/TheMoneyShot.git
cd TheMoneyShot

# 2. Create virtual environment (protection first)
python -m venv venv

# 3. Activate (Windows)
.\venv\Scripts\activate
# or macOS/Linux: source venv/bin/activate

# 4. Install Python dependencies (foreplay)
pip install -r requirements.txt

# 5. Install frontend dependencies & build CSS (dress her up)
npm install
npm run build:css

# 6. Seed the database (plant the seed)
python seed.py

# 7. Run the dev server (let her rip)
python run.py
```

Then open **http://127.0.0.1:5000** — she'll be waiting for you.

## 🔑 Default Accounts — Who's in the Backdoor?

| Username | Password | Role | Branch |
|----------|----------|------|--------|
| `admin` | `admin123` | Admin | Main Branch |
| `manager` | `manager123` | Manager | Main Branch |
| `auditor` | `audit123` | Accounting | Main Branch |
| `cashier1` | `cashier123` | Cashier | Main Branch |
| `cashier2` | `cashier123` | Cashier | Uptown Branch |

> ⚠️ **Change these immediately in production.** Leaving defaults on is like leaving the door wide open — and not in the fun way.

## 📂 Project Structure — The Anatomy

```
TheMoneyShot/
├── app/
│   ├── __init__.py          # App factory — where it all begins
│   ├── models.py            # Database models (8 tables, fully relational)
│   ├── routes/
│   │   ├── auth.py          # Login / Logout — knows when to come and go
│   │   ├── dashboard.py     # Dashboard + chart API — the money view
│   │   ├── pos.py           # POS terminal + checkout + voids
│   │   ├── branches.py      # Branch CRUD + stock management
│   │   ├── reports.py       # Sales/void reports + CSV export
│   │   └── loans.py         # Customer loans + payments — IOUs with class
│   └── templates/           # Jinja2 templates (Tailwind + Flowbite)
├── config.py
├── run.py
├── seed.py
├── requirements.txt
└── .env
```

## 📋 Roadmap — What's Coming Next

- [ ] 🧾 Receipt printing / PDF generation — *physical proof of the transaction*
- [ ] 📷 Barcode scanner integration — *scan, beep, done*
- [ ] 👥 User management admin panel — *control who gets access*
- [ ] 📦 Inventory alerts (low stock) — *she'll tell you when she's running low*
- [ ] 💱 Multi-currency support — *international affairs*
- [ ] 🐳 Deployment guide (Docker / Gunicorn) — *taking her public*

## 🤝 Contributing

Pull requests welcome. Just be respectful — she's open-source, not easy.

## 📄 License

MIT — do whatever you want with it. Just don't blame us if your accountant has *questions*.

---

<p align="center">
  <i>Built with ☕, questionable naming decisions, and zero regrets.</i><br>
  <b>questionably Suggestive</b> — <i>We make software that raises eyebrows and productivity.</i>
</p>
