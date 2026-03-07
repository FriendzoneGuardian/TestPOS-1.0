# Alpha 1.3 — "Fifty Shades of Roles" (Color Palette Revamp)
- [x] Update `tailwind.config.js` to map `primary` theme colors to CSS variables mapping
- [x] Update `app/templates/base.html` to inject CSS variables based on `current_user.role`
  - Admin: Rose/Fuchsia
  - Manager: Violet/Indigo 
  - Cashier: Emerald/Cyan
- [x] Run `npm run build:css` to recompile Tailwind
- [x] Manually verify colors change on login

  ## Alpha 1.3.1 — "Touch-ups" (Background & Palette Tweaks)
  - [x] Make the body background color reflect the active palette's deepest shade (`primary-950`)
  - [x] Swap the unauthenticated (Login) theme to be Emerald/Cyan by default
  - [x] Reconfigure the Cashier role to use a Turquoise/Aquamarine theme

# Alpha 1.4 — "The Bean Counters" (Accounting Role)
- [x] Add the `'accounting'` role to the `User` model definitions
- [x] Seed a dummy accounting user in `seed.py` (e.g., `auditor1`)
- [x] Inject the "Golden Ledger" (Amber/Orange) palette variables in `app/templates/base.html` for `current_user.role == 'accounting'`
- [x] Enforce permission blocks: Prevent 'accounting' from accessing `/pos/` routes
- [x] Verify the UI theme and route blocks logistically and visually

# Alpha 1.5 — "Mood Lighting" (Thematic Extensibility)
- [x] Update `User` model to include `theme_preference` column (default 'dusk')
- [x] Run a migration/update script to add the column to existing SQLite DB
- [x] Create a "User Settings" modal in `base.html` to allow toggling Dawn/Dusk/Midnight
- [x] Create `/auth/settings` POST route to save preference to database
- [x] Inject `data-theme="{{ current_user.theme_preference }}"` into the HTML tag
- [x] Refactor `.glass-card`, text colors, and generic surfaces in `base.html` to use dynamic CSS variables (`--bg-surface`, `--text-base`) instead of hardcoded hex values to support Light Mode
- [x] Implement the Aurora Glow radial gradients dynamically based on the current user role palette
- [x] Inject the subtle CSS/SVG Noise Texture overlay for the tactile matte effect
- [x] **Verification**: Visual verification step across Light, Dark, and AMOLED states utilizing the browser subagent.

# Alpha 1.6 — "The Velvet Rope" (User Management Overhaul)
- [x] Define CRUD Capabilities per Role
- [x] Backend: Build the User Management Blueprint & APIs (`/users`)
- [x] Frontend: Build the User Management Dashboard UI (`users/index.html`)
- [x] Permission Enforcement: Implement Decorators to Restrict Access
- [x] Verify functionality across Admin, Manager, and Auditor roles.

  ## Alpha 1.6.1 — "Bouncer Duties" (Refactoring POS Access)
  - [x] Backend: Restrict `/pos/` and `/pos/checkout` to Cashiers only in `pos.py`.
  - [x] Frontend: Hide the POS Terminal navigation link from Admins, Managers, and Auditors in `base.html`.
  - [x] Verify that Admins and Managers cannot access the POS Terminal via the UI or by forcing the URL.
  - [x] **Verification**: Automated Security Audit (10 Edge-Case Tests via Selenium/Subagent)
    - [x] 01: Phantom Stock (Over-selling 9999 units → rejected)
    - [x] 02: Minus Money Exploit (Negative qty → rejected)
    - [x] 03: Cross-Branch Heist (Non-existent product → rejected)
    - [x] 04: Double Tap Void (Double void → blocked)
    - [x] 05: Infinite Credit Loop (Astronomical loan → capped)
    - [x] 06: Role Spoof Privilege Escalation (Admin→POS → 403)
    - [x] 07: Ghost Void Invalid ID (Fake item_id → 404)
    - [x] 08: Broken Cart Malformed JSON (Missing 'items' key → 400)
    - [x] 09: Unauthorized Cashier Void (Cashier→void-order → 403)
    - [x] 10: Missing CSRF Token (No token → 400)

# Alpha 1.7 — "Deep Stocking" (Inventory & The Backroom)
- [x] Backend: Add `low_stock_threshold` to `app/models.py` -> `Product`
- [x] Backend: Create SQLite migration to `ALTER TABLE products ADD COLUMN low_stock_threshold INTEGER DEFAULT 10;`
- [x] Backend: Construct the `app/routes/inventory.py` blueprint with CRUD features and proper RBAC protection
- [x] Dashboard: Update `app/routes/dashboard.py` and `app/templates/dashboard/index.html` to inject Low Stock Warnings
- [x] Frontend: Build the Inventory Management Dashboard `inventory/index.html`
- [x] POS Terminal: Add the Low Stock visual indicator to `app/templates/pos/terminal.html`
- [x] Verification: Test product creation, branch-restricted stock receiving, and automatic low-stock triggers.

  ## Alpha 1.7.1 — "Money Talks" (Localization & Auditing)
  - [x] Add global `{{ price|currency }}` template filter
  - [x] Define `CURRENCY_SYMBOL` config (default `₱`) and replace all hardcoded `$` signs everywhere
  - [x] Add "Adjust Stock" feature alongside "Receive Stock" for precise inventory overwriting

  ## Alpha 1.7.2 — "Shelf Polish" (Further Optimizations)
  - [x] POS Terminal: Add interactive Category Filter pills to sort products dynamically.
  - [x] POS Terminal: Enforce an Out-Of-Stock (OOS) lock (grayscaled styling, unclickable) for items with $\le$ 0 stock.
  - [x] **Verification**: Verified via browser testing with `cashier1` (Selenium/Subagent).

# Alpha 1.8 — "Bare Assets" (Audit & Accountability Overhaul)
- [ ] Backend: Create `StockAuditLog`, `Shift`, and `VoidLog` models in `models.py`.
- [ ] Backend: Generate and apply SQLite migrations for the new models.
- [ ] Backend: Update `inventory.py` to write to `StockAuditLog` on `receive_stock` and `adjust_stock`.
- [ ] Frontend: Build a secure "Audit Logs" datatable view for Admins and Auditors.
- [ ] POS UI: Refactor `/pos/` to enforce a "Starting Cash" modal before allowing checkout.
- [ ] POS UI: Add a "Close Shift" feature where cashiers declare "Ending Cash".
- [ ] Backend: Strip `void-item` out of POS Terminal. Move Void authorization to Admin/Manager dashboard.
- [ ] Dashboard UI: Build the Auditor Dashboard showing Shift Discrepancies, Void Volume, and Logs.
- [ ] Verification: Test the entire shift lifecycle and verify the logs trap manager adjustments and voids correctly.

