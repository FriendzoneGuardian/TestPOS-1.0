# 🏰 TestPOS Wiki: The MoneyShot System

Welcome to the official technical wiki for **MoneyShot** (formerly TestPOS-1.0). This system is designed as a high-performance, security-hardened, and financially integral Point of Sale solution built on **Django**.

---

## 🚀 Core Pillars

### 1. 💰 Financial Integrity (COGSchamp)

The system prioritizes absolute accuracy in tracking profits and costs.

- **COGSchamp**: Real-time Cost of Goods Sold tracking snapshotted at the moment of sale.
- **Aura Gain**: Sophisticated gross profit calculation logic.
- **Ancient Aura**: Advanced debt aging categorization (0-15, 16-30, 31+ days).
- **Rizz Cap**: Strict hard-limit enforcement on customer credit (₱1,500).

### 2. 🔐 Security (The Digital Brick)

Hardened access control layers designed for high-risk retail environments.

- **The Cold Shoulder**: A 90-second frontend inactivity guard.
- **The Endless Foreplay**: 1-hour sliding session persistence for active users.
- **Security Boot Flush**: Process-level tokenization that kills all sessions on server restart.
- **Midnight Purge**: Mandatory system-wide logout between 23:59 and 00:01.

### 3. 🎨 UX & Aesthetics (The Velvet Rope)

A premium, dark-mode interface utilizing glassmorphism and modern typography.

- **MoneyShot Branding**: High-contrast, vibrant UI tokens.
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

- [Inventory Management](file:///c:/Users/franc/Documents/TestPOS-1.0/inventory/)
- [Point of Sale (Sales)](file:///c:/Users/franc/Documents/TestPOS-1.0/sales/)
- [Security Middleware](file:///c:/Users/franc/Documents/TestPOS-1.0/core/middleware.py)

---

> [!IMPORTANT]
> **AESTHETIC RULE**: Every UI update MUST feel premium. Avoid generic colors; use the established HSL tokens and subtle micro-animations.
