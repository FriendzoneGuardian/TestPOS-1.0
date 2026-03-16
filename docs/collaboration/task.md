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
- [x] **Release v1.5-beta**: Commit, tag, and push code to the remote repository.

## Beta 1.6 — "The Velvet Rope" (User Management & Dashboards)
- [x] Build User Management Dashboard entirely In-App (bypassing Django Admin).
- [x] Implement "Sudo" or Override Options to access hidden system configs.
- [x] Implement specialized Dashboard views based on Role:
    - Admin: Everything (Full Audit/Total Control)
    - Accounting: Money Flow, Cash Flow, Stock Flow (Read Only)
    - Manager: Stock Levels and Sold Items
    - Cashier: POS as Homepage (Stocks/Reports Disabled)
- [x] **BUG-07 (Timestamp Localization)**: Force UTC+8/Asia/Manila in settings.
- [x] **BUG-06 (Vault Move)**: Transfer vault management to Cashier (UI + Backend).
- [x] Implement the **"BBQ Stick" (Burger Menu)** for Theme switching (Dawn/Dusk/Midnight) in the top-right.
- [x] Re-implement CSRF-protected User CRUD APIs with role assignment.
    ### Beta 1.6.1 — "Bouncer Duties"
    - [x] Re-verify POS Terminal access restrictions for non-cashier roles.
    - [x] Run automated suite for security edge-case regression tests.

## Beta 1.7 — "Deep Stocking" (Inventory & Re-order Alerts)
- [x] Port Inventory logic and implement "Re-order Level" functions/checks.
- [x] Implement **Modal & Bell-based Alerts** for low stock (Top Right).
- [x] Configure Role-based Alert Access:
    - Cashiers: Disabled
    - Managers: Stocks & Cash
    - Accounting: Reports only
    - Admin: Everything
- [x] Re-build the Inventory Management dashboard for cross-branch stock.
- [x] Re-implement POS Category Filter pills and OOS/Re-order visual cues.
- [x] Auto-trigger Low Stock Modal on Admin/Manager login (once per session).

## Beta 1.8 — "Bare Assets" (Audit & Payment Logic)
- [x] Implement **"Payment Tendered" Logic**: Record `amount_paid`, `cost`, and `change_given`.
- [x] Implement Error Trapping for insufficient cash payments.
- [ ] Decision (2026-03-12): Insufficient cash **cancels** checkout (no loan fallback in this iteration).
- [x] Port `StockAuditLog`, `Shift`, and `VoidLog` models.
- [x] Re-implement "Starting Cash" shift requirements for the backend.
- [x] Implement Backend authorization gates for post-checkout Voids.
- [x] Cash tendered flow moved to floating modal with change display + 5s close.
- [x] Cashier-only POS access enforced (Admin/Accounting excluded from terminal).
- [x] Accounting/Audit Trails display Stock + Void logs (read-only).
- [x] **Comprehensive Refactoring & UI/UX Audit (The Purge)**
- [x] **Collaborator Handoff Documentation Setup**

## Alpha 1.9 — "The Full Discharge" (Vaulting, Sessions & Reports)
- [x] Re-implement `BranchVault` and `VaultTransaction` models.
- [x] Implement `vault_manage` and `vault_transaction` views.
- [x] Integrate `shift_end` with vault remittance logic.
- [x] Build `periodic_reports` aggregation logic (Daily, Weekly, 15-day, Monthly, Annual).
- [x] ~~Implement POS Terminal "Blackout" overlay for inactive shifts.~~ (Already implemented)
- [x] Update Navigation (Sidebar) for new reporting/vault modules.
- [x] **Cash Sessions & Variance**:
    - [x] Implement `CashSessions` tracking with Opening/Closing balance requirements. (Implemented via `Shift`)
    - [x] Add Variance Detection (Overage/Shortage) and variance auditing. (Available in Shift History)
    - [x] Implement strict "Terminal Lockout" for closed sessions. (Enforced via UI + Backend)

## Alpha 2.0 — "Desk Slam & Lube Job" (Electron Shell & Polish) [/]
- [x] Update `electron/main.js` to spawn the Django development server.
- [x] Port the IPC Bridge for window controls and startup splash logic.
- [ ] Verify template modularity (Django Includes/Inlines).
- [x] Implement standard AI-oriented orientation comments in Django core files.
- [x] Ensure cookie-based theme persistence on the overhauled login page.
- [x] **Shell**: Remove native Electron menu bar for kiosk-mode feel.

## Alpha 2.0.1 — "The QA Purge" (Hotfixes)
- [x] Fix shift_start/shift_end direct return JSON (BUG-08).
- [x] Fix terminal lockout scope and sidebar z-index (BUG-09).
- [x] Implement NoCacheMiddleware for secure logout (BUG-10).
- [x] **Typing Bug**: Replace native `alert()` with custom Toasts + focus restoration (BUG-11).
- [x] **Stacking Fix**: Move modals to body root and standardize z-indexes for foreground priority (BUG-01).
- [x] **Shift Toasts**: Standardize shift lifecycle notifications via Django messages (BUG-12).
- [x] **Dropdown Restoration**: Fix broken script tags and re-enable Flowbite dropdowns (BUG-13).
- [x] **BUG-14**: Restrict Shift Management to Cashier role only (UI + View).

---

# Alpha 2.1 — "Hard Insertion" (Inventory & Bundles)
> Implementation of advanced business rules from the `concrete_implementation_plan.md`.

## Alpha 2.1.1 — Base-Unit Inventory & Bundles (Planned)
- [ ] Unit conversion inventory per product (carton/pack/stick) with strict base-unit storage.
- [ ] Bundle promos like “3 pcs for ₱5” with audit-safe pricing and stock deductions.

# Alpha 2.2 — "The Golden Gush" (Financial Integrity)
- [ ] Implement COGS calculation logic in Sales reporting.
- [ ] Add aging categories (0-15, 16-30, 31+ days) for Credit Ledgers.
- [ ] Implement Gross Profit and Balance Snapshot dashboards per store.

# Alpha 2.3 — "Positions of Interest" (Credit & Payroll)
- [ ] **Revolving Credit**: Forward unpaid balances to the next 15-day cycle with a searchable audit trail.
- [ ] Enforce strict ₱1,500 total outstanding credit limit in the checkout transaction.
- [ ] Build 15-day payroll evaluation and automatic salary deduction logic.
- [ ] Implement carrying over balances to the next payroll cycle.

# Alpha 2.4 — "Private Sessions" (Scalable Isolation)
- [ ] Audit all Business Logic Layer modules for strict `store_id` enforcement.
- [ ] Implement Multi-Store assignment logic for individual employees.
- [ ] Verify Cross-Store data viewing prevention rules.

---
