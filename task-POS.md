# Beta 1.0 — "The Django Overhaul"

> [!IMPORTANT]
> The project has shifted to a complete Django re-implementation. All previous Flask features are being ported and re-validated under the `tp_django` architecture.

## Beta 1.1 — "Laying the Pipe" (Project Scaffolding)
- [x] Initialize Django Project structure and core settings.
- [x] Port/Refine core Database Models (`Branch`, `User`) to Django ORM.
- [x] Configure Django's native authentication and custom user model logic.

## Beta 1.2 — "The First Thrust" (Data & Initial Wiring)
- [x] Port logic from `seed.py` into Django Management Commands.
- [x] Re-implement POS terminal views and URL routing in the `sales` app.
- [x] Implement basic stock deduction logic in Django signal/view handlers.

## Beta 1.3 — "Fifty Shades of Roles" (Dynamic Theming)
- [x] Port role-based CSS variable injection into Django base templates.
- [x] Re-implement role-specific color palettes using Django template context.
- [x] Verify Tailwind/PostCSS compilation for the new app structure.

## Beta 1.4 — "The Bean Counters" (RBAC & Accounting)
- [x] Configure RBAC and permissions for the 'accounting' role.
- [x] Implement permission-based route blocks (Decorators/Mixins).
- [x] Port the Golden Ledger theme logic into the new base layout.

## Beta 1.5 — "Mood Lighting" (Thematic Persistence)
- [x] Port `theme_preference` into the Custom User model.
- [x] Re-implement display settings toggles (Dawn/Dusk/Midnight).
- [x] Ensure CSS variable persistence across the overhauled templates.
- [x] **First Selenium QA Audit**: Re-test previous scripts and CVEs for regression.

## Beta 1.6 — "The Velvet Rope" (User Management)
- [ ] Build User Management Dashboard using Django's Admin or custom views.
- [ ] Re-implement CSRF-protected User CRUD APIs.
    ### Beta 1.6.1 — "Bouncer Duties"
    - [ ] Re-verify POS Terminal access restrictions for non-cashier roles.
    - [ ] Run automated suite for security edge-case regression tests.

## Beta 1.7 — "Deep Stocking" (Inventory & Thresholds)
- [ ] Port Low Stock Threshold logic into `Product` models.
- [ ] Re-build the Inventory Management dashboard for cross-branch stock.
- [ ] Re-implement POS Category Filter pills and OOS locks.

## Beta 1.8 — "Bare Assets" (Audit & Accountabilities)
- [ ] Port `StockAuditLog`, `Shift`, and `VoidLog` models.
- [ ] Re-implement "Starting Cash" shift requirements for the backend.
- [ ] Implement Backend authorization gates for post-checkout Voids.

## Beta 1.9 — "Safe Words & The Climax" (Vaulting & Reports)
- [ ] Port `BranchVault` and `VaultTransaction` backend logic.
- [ ] Port aggregation queries for Periodic Reports (X-Report/Z-Report).
- [ ] Re-implement the Terminal Blackout/Lockout state for closed shifts.

## Beta 2.0 — "Desk Slam" (Electron Desktop Shell)
- [ ] Update `electron/main.js` to spawn the Django development server.
- [ ] Port the IPC Bridge for window controls and startup splash logic.

## Beta 2.1 — "Deep Clean & Lube Job" (Optimization)
- [ ] Verify template modularity (Django Includes/Inlines).
- [ ] Implement standard AI-oriented orientation comments in Django core files.
- [ ] Ensure cookie-based theme persistence on the overhauled login page.

## Beta 2.2 — "Pulling Out (The Receipts)"
- [ ] Port `SystemSettings` singleton logic for receipt headers.
- [ ] Re-implement silent receipt printing via Electron IPC.
- [ ] Port the Global Barcode Scanner keyboard hooks.
- [ ] Verify Auditor printable ledgers with dynamic pagination/boundaries.

---

# Alpha 3.0 — "The Concrete Hardening"
> Implementation of advanced business rules from the `concrete_implementation_plan.md`.

## Alpha 3.1 — Financial Integrity
- [ ] Implement COGS calculation logic in Sales reporting.
- [ ] Add aging categories (0-15, 16-30, 31+ days) for Credit Ledgers.
- [ ] Implement Gross Profit and Balance Snapshot dashboards per store.

## Alpha 3.2 — Credit & Payroll Control
- [ ] Enforce strict ₱1,500 credit limit in the checkout transaction.
- [ ] Build 15-day payroll evaluation and automatic salary deduction logic.
- [ ] Implement carrying over balances to the next payroll cycle.

## Alpha 3.3 — Cash Session & Vaulting
- [ ] Implement `CashSessions` tracking with Opening/Closing balance requirements.
- [ ] Add Variance Detection (Overage/Shortage) and variance auditing.
- [ ] Implement strict "Terminal Lockout" for closed sessions.

## Alpha 3.4 — Scalable multi-branch Isolation
- [ ] Audit all Business Logic Layer modules for strict `store_id` enforcement.
- [ ] Implement Multi-Store assignment logic for individual employees.
- [ ] Verify Cross-Store data viewing prevention rules.

---
