# 🏰 TestPOS Wiki: The FarmYield POS System

Welcome to the official technical wiki for **FarmYield POS** (formerly FarmYield-1.0). This system is designed as a high-performance, security-hardened, and financially integral Point of Sale solution built on **Django**.

---

## 🚀 Core Pillars

### 1. 💰 Financial Integrity (Crop-to-Table Costing (COGS))

The system prioritizes absolute accuracy in tracking profits and costs.

- **Crop-to-Table Costing (COGS)**: Real-time Cost of Goods Sold tracking snapshotted at the moment of sale.
- **Golden Yield (Gross Profit)**: Sophisticated gross profit calculation logic.
- **Fermented Crop (Debt Aging)**: Advanced debt aging categorization (0-15, 16-30, 31+ days).
- **Rizz Cap**: Strict hard-limit enforcement on customer credit (₱1,500).

### 2. 🔐 Security (The Barn Door (System Lockdown))

Hardened access control layers designed for high-risk retail environments.

- **The Scarecrow Protocol (Inactivity Guard)**: A 90-second frontend inactivity guard.
- **The Long Season (Session Persistence)**: 1-hour sliding session persistence for active users.
- **The Spring Till (Token Purge)**: Process-level tokenization that kills all sessions on server restart.
- **The Rooster's Call (Midnight Reset)**: Mandatory system-wide logout between 23:59 and 00:01.

### 3. 🎨 UX & Aesthetics (The White Picket Fence (Premium UI))

A premium, dark-mode interface utilizing glassmorphism and modern typography.

- **FarmYield POS Branding**: High-contrast, vibrant UI tokens.
- **Role-Based Theming**: Dynamic Dawn/Dusk/Midnight modes with color persistence.
- **Tap-to-Type**: Zero-friction numerical entry logic via `this.select()`.

---

## 🛠️ Tech Stack

- **Backend**: Django 4.x (Python 3.x)
- **Frontend**: Vanilla JS, CSS3 (Glassmorphism), HTML5
- **Shell**: Electron (Cross-platform Desktop wrapper)
- **Database**: SQLite (Development) / Optimized for DB-level constraints

---

## 📖 Key Modules

- [Inventory Management](file:///c:/Users/franc/Documents/FarmYield-1.0/inventory/)
- [Point of Sale (Sales)](file:///c:/Users/franc/Documents/FarmYield-1.0/sales/)
- [Security Middleware](file:///c:/Users/franc/Documents/FarmYield-1.0/core/middleware.py)

---

> [!IMPORTANT]
> **AESTHETIC RULE**: Every UI update MUST feel premium. Avoid generic colors; use the established HSL tokens and subtle micro-animations.
