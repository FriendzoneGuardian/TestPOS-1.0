# 💰 The MoneyShot — POS System (Django + Electron Edition)

> *From the makers of **SwiftGrade** — the Flutter-powered Capstone beast that scans answer sheets like a Zipgrade on steroids (OMR), reads handwritten short answers with OCR + NLP, and turns classrooms into game shows with Kahoot/Quizizz/Mentimeter-style interactivity.*
>
> *We present to you... a system that handles transactions so smooth, so satisfying, so precise — you'll want to do it again. And again. And maybe one more time just to be sure.*
>
> ***The MoneyShot.** Every sale. Right on target. Every. Single. Time.*

A dangerously attractive, multi-branch Point of Sale system. She used to be a Flask girl, but she's matured into a **Django** architecture with an incoming **Electron** shell wrapper. We've retained the dark-mode glassmorphism UI, "Puddles" ambient backgrounds, and dynamic role-based color matrices that'll make your registers blush.

**Version:** Alpha 3.0.1 — *"Hard Insertion": Base-unit inventory with unit conversions (carton/pack/stick) + bundle promos.*

---

## ✨ Features — What Can She Do?

| Module | Description |
|--------|-------------|
| **POS Terminal** | Smooth product grid, real-time cart action — she handles multiple items at once without breaking a sweat. |
| **Role-Based Theming** | "Fifty Shades of Roles": Admin, Manager, Cashier, and Accounting (The Golden Ledger) all get custom injected CSS color matrices and ambient glowing puddles. |
| **Branch Management** | Multi-branch support with strict data isolation. She gets around — professionally. |
| **Shift Accountability** | Strict opening/closing cash counts with variance auditing. You must insert your float before she lets you start playing. |
| **Loan / Credit** | Customer credit tracking with a strict ₱1,500 limit and payroll deduction cycles. We keep tabs on who owes us one. |
| **Reports** | Daily, Weekly, Bi-Monthly, Monthly, Quarterly, and Annually. She exposes everything — every number, every transaction — but mostly strictly on demand for Accounting. |

## 🛠️ Tech Stack — What's Under the Hood

No need to undress the architecture yourself — here's the full reveal:

- **Backend:** Python 3 · Django 6+ · Django ORM
- **Frontend:** Django Templates · Tailwind CSS (offline compiled) · Flowbite
- **Themes & UI:** Native CSS variables (`data-category` and `data-theme` matrices), Ambient Puddles, Glassmorphism Overlays.
- **Database:** SQLite (dev) — PostgreSQL-ready (production).
- **Desktop Shell (WIP):** Electron.js — *Keeping her strictly local, wrapped tight in a native desktop window.*

> Built tight, runs smooth, and handles heavy database relations with absolute grace.

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

# 6. Apply Migrations & Seed the database (plant the seed)
python manage.py makemigrations
python manage.py migrate
python manage.py seed_pos

# 7. Run the dev server (let her rip)
python manage.py runserver 8000
```

Then open **http://127.0.0.1:8000/login/** — she'll be waiting for you.

## 🔑 Default Accounts — Who's in the Backdoor?

By default, the `seed_pos` command generates the following fully randomized combinations, but here are the standard role test accounts you can create:

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | Admin (Mapped to Manager / Sudo) |
| `cashier1` | `cashier123` | Cashier |
| `accountant` | `accountant123` | Accounting (Golden Ledger Only) |

> ⚠️ **Change these immediately in production.** Leaving defaults on is like leaving the door wide open — and not in the fun way.

## 📂 Project Structure — The Anatomy

```
TestPOS-1.0/
├── core/                # Core logic, authentication, and custom User models.
├── sales/               # Checkout, Shifts, Vaults, and POS Terminal views.
├── inventory/           # Products, Categories, Stock tracking.
├── tp_django/           # The main Django configuration and wiring.
├── templates/           # Centralized Base HTML files with strict layout inheritance.
├── static/
│   ├── src/             # input.css featuring the declarative Role Matrix.
│   └── css/             # Compiled Tailwind output — offline and self-sufficient.
├── electron/            # (WIP) Desktop shell implementation.
├── Legacy/              # (Archived) The original Flask implementation.
├── manage.py
└── README.md
```

## 📋 Roadmap — What's Coming Next (Alpha 3.0+ Aggressive Merge)

We are undergoing a rapid 10-phase integration of the React/Vite Prototype logic into our Django infrastructure.

- [x] 🧮 **Alpha 3.0.1 — "Hard Insertion":** Base-unit inventory with unit conversions + bundle promos.
- [ ] 🏗️ **Phase 3.0–3.2 (Core Logic & Guards):** Enforcing the ₱1,500 Rizz Limit, exact Variance Status tracking for shifts, strictly formatted Session IDs, and blocking POS access without an active Vault Session.
- [ ] 📊 **Phase 3.3–3.5 (Financial Intelligence):** Building the 4-KPI Dashboard, calculating snapshotted COGSchamp on every item, and fleshing out the 6-period Financial Reports and Goods Sold ledger.
- [ ] 📦 **Phase 3.6 (Inventory Audit):** Robust Inventory Log tracking (Adjustments vs Sales) and rigid Cost Price validation.
- [ ] 🎨 **Phase 3.7–3.8 (UI Overhaul & Integration):** Applying the prototype's compact POS layouts and Flat Navy/Purple accents inside our existing Dark Glassmorphism framework. We keep the Glassmorphism look (blur, ambient lights, `.glass-card`) but will inject the flat navy/purple pos tokens into the themes.
- [ ] 🖨️ **Phase 3.9 (Hardware & Print):** Receipt printing and Dashboard Auto-Refresh AJAX polling.

## 🧪 Theme Options (Humor, WIP)
We mocked possible theme variants (including a high-contrast “Noon” mode for daylight-visibility and accessibility) as static previews. Previous mockups and implementation plans have been moved to `/archive`.

## 🤝 Contributing

Pull requests welcome. Just be respectful — she's open-source, not easy.

## 📄 License

MIT — do whatever you want with it. Just don't blame us if your accountant has *questions*.

---

<p align="center">
  <i>Built with ☕, questionable naming decisions, and zero regrets.</i><br>
  <b>Mildly Suggestive (SFW)</b> — <i>We make software that raises eyebrows and productivity.</i>
</p>
