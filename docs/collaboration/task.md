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

## Beta 1.8 — "Bare Assets" (Audit & Payment Logic)
- [ ] Implement **"Payment Tendered" Logic**: Record `amount_paid`, `cost`, and `change_given`.
- [ ] Implement Error Trapping for insufficient cash payments.
- [ ] Implement **"Charge to Loan" Fallback**: Allow lacking amounts to be added as a Loan Transaction (within ₱1,500 limit).
- [ ] Decision (2026-03-12): Insufficient cash **cancels** checkout (no loan fallback in this iteration).
- [ ] Port `StockAuditLog`, `Shift`, and `VoidLog` models.
- [ ] Re-implement "Starting Cash" shift requirements for the backend.
- [ ] Implement Backend authorization gates for post-checkout Voids.
- [x] **Comprehensive Refactoring & UI/UX Audit (The Purge)**
- [x] **Collaborator Handoff Documentation Setup**

## Beta 1.9 — "Safe Words & The Climax" (Vaulting & Reports)
- [ ] Port `BranchVault` and `VaultTransaction` backend logic.
- [ ] Port aggregation queries for Periodic Reports: Daily, Weekly, Bi-Monthly (15 days), Monthly, Quarterly, Annually.
- [ ] Configure Daily/Weekly reports to generate on-demand at Shift End.
- [ ] Configure Monthly+ reports to generate via Accounting role override.
- [ ] Re-implement the Terminal Blackout/Lockout state for closed shifts.

## Beta 2.0 — "Desk Slam & Lube Job" (Electron Shell & Polish)
- [ ] Update `electron/main.js` to spawn the Django development server.
- [ ] Port the IPC Bridge for window controls and startup splash logic.
- [ ] Verify template modularity (Django Includes/Inlines).
- [ ] Implement standard AI-oriented orientation comments in Django core files.
- [ ] Ensure cookie-based theme persistence on the overhauled login page.

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
