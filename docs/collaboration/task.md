# Project Roadmap: The MoneyShot POS

> [!IMPORTANT]
> This tracker consolidates all progress from the migration (Beta 1.0) through the current implementation of Alpha 3.0.1 ("Hard Insertion").

## ✅ Completed Phases

### Beta 1.x — Foundations & UX
- [x] **Project Scaffolding**: Django setup and role-based themes ("Fifty Shades of Roles").
- [x] **Core POS**: Terminal views, cart logic, and stock deduction.
- [x] **Accountability**: Shift start/end, starting cash, and variance auditing ("Bare Assets").
- [x] **Inventory**: Low stock alerts, re-order levels, and audit trails ("Deep Stocking").

### Alpha 1.x — Secure Operations
- [x] **Vaulting**: Branch vault management and auto-remittance ("The Full Discharge").
- [x] **Reports**: Periodic reporting engine (Daily to Annual).

### Alpha 2.0 — Desktop Shell
- [x] **Electron Shell**: Integrated spawning and lifecycle management ("Desk Slam & Lube Job").
- [x] **Clean Sweep**: 100% formalization of dashboards and routes (Jules' Cleaning).

### Alpha 3.0.1 — "Hard Insertion" (Multi-Unit & Promos)
- [x] **Base-Unit Inventory**: Sub-unit conversion (Piece/Stick/Box) logic.
- [x] **Bundle Promos**: Automated freebie/discount logic (e.g., 10+ Poké Balls = 1 Free Luxury Ball).
- [x] **Stock Logic**: Multiplier-aware stock verification and deduction.

---

## 🚀 Upcoming: Alpha 2.2 — "The Golden Gush" (Financial Integrity) [/]

### 1. COGSchamp (Cost of Goods Sold)
- [x] Implement `unit_cost` tracking in `StockBatch`.
- [x] Snapshot `cost_at_time` during checkout in `OrderItem`.
- [x] Implement Gross Profit and Profit Margin calculations in Analytics dashboard.

### 2. Ancient Aura (Debt Aging)
- [x] Implement aging buckets (0-15, 16-30, 31+ days) for Credit Ledgers.
- [x] Build searchable Audit Trail for Revolving Credit.

### 3. Rizz Cap (Credit Control)
- [x] Enforce strict ₱1,500 total outstanding credit limit at checkout.
- [x] Implement structural unit tracking (`OrderItem.unit`) and branch isolation.

---

## 📂 Gap Analysis & Improvements
- **Receipt Clarity**: Update `OrderItem` to store the *Display Unit* (e.g., "Box") instead of just base units.
- **Promo Visibility**: Add a "Rewards Earned" section to the checkout success modal.
- **Lint Cleanup**: Resolve the 50+ Pyre2/Pylance warnings in `sales/views.py`.
