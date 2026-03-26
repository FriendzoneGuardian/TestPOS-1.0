# Beta 1.0 — "The Django Overhaul"

> [!IMPORTANT]
> The project has shifted to a complete Django re-implementation. All previous Flask features are being ported and re-validated under the `tp_django` architecture.

## Beta 1.1 — "Project Scaffolding" [x]
- [x] Initialize Django Project structure and core settings.
- [x] Port/Refine core Database Models (`Branch`, `User`) to Django ORM.

## Beta 1.4 — "RBAC & Accounting" [x]
- [x] Configure RBAC and permissions for the 'accounting' role.
- [x] Implement permission-based route blocks (Decorators/Mixins).

## Beta 1.6 — "User Management & Dashboards" [x]
- [x] Build User Management Dashboard entirely In-App.
- [x] Implement specialized Dashboard views based on Role (Admin/Manager/Accounting/Cashier).

## Beta 1.8 — "Audit & Payment Logic" [x]
- [x] Implement **"Payment Tendered" Logic** (amount_paid, cost, change_given).
- [x] Port `StockAuditLog`, `Shift`, and `VoidLog` models.

---

# Alpha 2.0 — "Electron Shell & Polish" [x]
- [x] Update `electron/main.js` to spawn the Django development server.
- [x] **Resolution Lockdown**: Fixed 1440x810 rigid frame implementation.
- [x] **Sanitization Pass**: Purged redundant test directories and optimized N+1 queries.

# Alpha 2.1 — "Hybrid Lockdown" [x]
- [x] Implement `lock_session` and `unlock_session` via 90s inactivity guard.
- [x] Implement `terminal_pin` authentication for quick unlock.

# Alpha 2.2 — "Inventory & Bundles" [x]
- [x] **Multi-Unit Inventory**: Sub-unit conversion (Piece/Stick/Box) logic.
- [x] **Bundle Promos**: Automated freebie/discount logic (e.g., 10+ Poké Balls = 1 Free Luxury Ball).

# Alpha 2.3 — "COGSchamp" (Financial Integrity) [x]
- [x] **COGSchamp**: Snapshot `cost_at_time` during checkout in `OrderItem` (FIFO).
- [x] **Rizz Cap**: Enforce ₱1,500 hard limit on Customer Credit/Loans.
- [x] **Manual Audit**: Ledger Monitoring & Debt Aging (0-15, 16-30, 31+ days).

# Alpha 2.5 — "Private Sessions" (Scalable Isolation) [x]
- [x] **Branch Isolation**: Strict data filtering by Store/Branch for non-admin users.
- [x] **Middleware Hardening**: Prevented redirect loops and secured logout cache.

---

# Alpha 3.0 — "The Hardware Hook" (Peripherals Integration) [/]
- [ ] **Scanner Hook**: Implement global keyboard event listener in Electron for USB Barcode Scanners.
- [ ] **Silent Print**: Thermal receipt printer integration via Electron `print` (ESC/POS).
- [ ] **Physical Drawer**: Trigger 24V drawer kick-out upon checkout completion.
- [ ] **Pole Display**: Second-screen customer-facing view for cart visualization.

# Alpha 3.1 — "The Payback" (Payroll & Credit Maturation) [ ]
- [ ] **Auto-Payroll Deduction**: Automated deduction of employee loans from 15-day salary cycles.
- [ ] **Revolving Credit**: Audit-safe carrying over of customer balances to next billing cycles.
- [ ] **Credit Audit Trail**: Detailed searchable history for all loan/payment interactions.

# Alpha 4.0 — "The MoneyShot Cloud" (Enterprise Scaling) [ ]
- [ ] **Centralized Catalog Sync**: Automated price/product updates from a master cloud catalog.
- [ ] **Automated Backups**: Encrypted daily SQL dumps sent to secure off-site storage.
- [ ] **Executive Dashboard**: Web-based (non-Electron) portal for cross-branch performance monitoring.

---
- [x] **UI-04**: Project Sanitization, N+1 Query Optimization, and Middleware Hardening Pass.
