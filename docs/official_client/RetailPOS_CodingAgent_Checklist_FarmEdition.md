# RetailPOS Enterprise — Coding Agent Checklist
**Stack:** Django/Python + Flowbite-Tailwind + PostgreSQL 14+  
**Reference DB:** `POS_Database_v4_1_FINAL.sql`  
**Date:** March 25, 2026

---

## PHASE 0 — Project Setup

- [ ] Create Django project with PostgreSQL backend configured
- [ ] Install dependencies: `psycopg2`, `djangorestframework`, `django-cors-headers`
- [ ] Connect to existing PostgreSQL database (`POS_Database_v4_1_FINAL.sql`)
- [ ] Run `inspectdb` to generate models from existing schema — verify all 17 tables mapped
- [ ] Set `managed = False` on all models if using existing DB
- [ ] Configure Django Auth with custom User model linked to `employees` table
- [ ] Implement `UserSession` equivalent — store `active_store_id`, `current_store_id`, `employee_id`, `role` in Django session
- [ ] Install and configure Flowbite-Tailwind in frontend
- [ ] Set up base template with sidebar navigation

---

## PHASE 1 — Authentication & Role Access

- [ ] Login page — authenticate against `employees` table, check `is_active = TRUE`
- [ ] On login: populate session with `employee_id`, `role`, `store_id`, `store_name`
- [ ] `UserSession` helpers: `is_admin()`, `is_manager()`, `is_cashier()`, `active_store_id`, `active_store_name`
- [ ] Role-based middleware or decorators for all protected views
- [ ] Sidebar: show/hide sections per role (Cashier = POS only; Admin/Manager = Management + Reports)
- [ ] Access denied page — shown when role lacks permission
- [ ] Logout — clear session, redirect to login
- [ ] `access_logs` table: record login/logout events

---

## PHASE 2 — Dashboard

### KPI Tiles (all roles, own store)
- [ ] Today's Sales — `SUM(total_amount)` WHERE `DATE(sale_date) = CURRENT_DATE` AND `payment_status <> 'VOID'`
- [ ] Credit Outstanding — `SUM(current_balance)` from `employee_credit_balance` WHERE `store_id = active_store_id`
- [ ] Low Stock Items — `COUNT(*)` WHERE `quantity_on_hand <= reorder_level` (use `<=` not `<`)
- [ ] Transactions Today — count + Cash subtotal + Credit subtotal

### 7-Day Chart
- [ ] Query last 7 days grouped by date — Cash total + Credit total per day
- [ ] Fill missing days with zero in Python (do not use calendar table)
- [ ] Render with Chart.js bar chart — Cash = blue `#1A6EBD`, Credit = purple `#6A1B9A`
- [ ] Tooltips showing date + Cash amount + Credit amount

### Active Cash Session Panel
- [ ] Query open session(s) for store — Admin sees all open, Cashier sees own only
- [ ] Display: Session ID (format: `SESS-S{store_id}-{YYYYMMDD}-{session_id:03d}`), Cashier, Opening Balance, Cash Sales Total (blue), Expected Cash (bold) = Opening Balance + Cash Sales Total
- [ ] No session: amber warning — Admin: "Assign a cashier to open one" / Cashier: "Open one in Cash Valuting"
- [ ] Admin header: "Cash Sessions — Active" / Cashier header: "Active Cash Session"

### Recent Transactions
- [ ] Admin/Manager: all transactions for store, LIMIT 20 — "View Transactions →" visible
- [ ] Cashier: own transactions only (`cashier_id = session.employee_id`), LIMIT 20 — "View Transactions →" hidden
- [ ] Type column: Cash = blue bold, Credit = purple bold
- [ ] Status column: COMPLETED = green bold, VOID = red bold

### Low Stock Sidebar Panel
- [ ] Show products WHERE `quantity_on_hand <= reorder_level` — sorted by qty ASC
- [ ] Stock badge: qty = 0 → red "OUT" badge; qty > 0 → amber number badge
- [ ] Empty state: "✓ All stock levels are healthy" (green background)
- [ ] Admin/Manager: "Manage Inventory →" button — opens Inventory pre-filtered to Low Stock + active store locked
- [ ] Cashier: no "Manage Inventory →" button

### Quick Actions Bar
- [ ] Admin/Manager: Low Stock button only (opens Inventory, editable)
- [ ] Cashier: New Cash Sale, New Credit Sale, Cash Valuting, Low Stock (opens Inventory, read-only)
- [ ] Low Stock button text: "Low Stock (N)" — N updated after KPI tiles load
- [ ] **Never use `disabled` for role-based hiding — always use hidden**

### Auto-Refresh
- [ ] Dashboard refreshes all sections every 60 seconds via AJAX/HTMX/polling

---

## PHASE 3 — Cash Valuting (Cash Sessions)

- [ ] Main page: Active session panel + Cash Session History table
- [ ] Session history columns: Session ID, Opened By, Opened At, Closed At, Opening Balance, Actual Cash, Cash Sales, Variance, Result
- [ ] Open session modal: enter opening balance → call `fn_open_cash_session(store_id, employee_id, opening_cash, terminal_id)`
- [ ] Error if session already open: show "You already have an open session. Close it first."
- [ ] Close session modal: enter actual cash count
- [ ] Live variance: actual_cash − (opening_balance + cash_sales_total) updates as user types
- [ ] Result states: Balanced (green), Shortage (red), Overage (amber)
- [ ] On close → call `fn_close_cash_session(session_id, closed_by, actual_cash)`
- [ ] Valuting report shown after close (session summary with all fields + variance + result)
- [ ] **TODO (not in desktop):** Add variance notes/reason field on close modal

---

## PHASE 4 — Cash Sales

- [ ] Session guard: block Cash Sales if no open session — show "Open a cash session in Cash Valuting first"
- [ ] Product grid: show active products for active store with `quantity_on_hand`
- [ ] Cart logic: `AvailableQty = quantity_on_hand − cart_qty` (UI layer only, never writes to DB)
- [ ] Disable "Add" button when `AvailableQty ≤ 0`
- [ ] Restore qty when item removed from cart
- [ ] Checkout → call `fn_process_sale(store_id, employee_id, session_id, 'CASH', cart_json, payment_amount)`
- [ ] Cart JSON: `[{"product_id": N, "quantity": N, "unit_price": N.NN, "cost_price": N.NN}]`
- [ ] **cost_price must come from products table — never hardcode to 0**
- [ ] Show receipt / success confirmation after sale

---

## PHASE 5 — Credit Sales

- [ ] Credit Sales never blocked by session status
- [ ] Employee selector: show store employees EXCLUDING the logged-in cashier (`employee_id <> session.employee_id`)
- [ ] Product grid: same as Cash Sales
- [ ] Cart logic: same AvailableQty rules as Cash Sales
- [ ] Checkout → call `fn_process_sale(store_id, employee_id, session_id=None, 'CREDIT', cart_json, 0)`
- [ ] Upsert credit balance: `INSERT INTO employee_credit_balance ... ON CONFLICT (store_id, employee_id) DO NOTHING` before sale
- [ ] **cost_price must come from products table — never hardcode to 0**
- [ ] Show confirmation with credit employee name and new balance

---

## PHASE 6 — Inventory Management

### Main List
- [ ] KPI tiles: Total Products, Total Stock Value (`SUM(cost_price * qty)`), Low Stock Items (includes OUT), Out of Stock
- [ ] Filter bar: Search (name/code), Category, Store, Status (All/Active/Inactive), Stock Level (All/In Stock/Low Stock/Out of Stock)
- [ ] Stock Level "Low Stock" filter = `stock_status IN ('LOW', 'OUT')` — includes zero-qty items
- [ ] Grid columns: Product Code, Product Name, Category, Unit Price, Cost Price, Reorder Level, Qty on Hand, Status, Stock Status, Actions (Edit/Adjust/Log)
- [ ] Stock Status badge: OK = green, LOW = amber, OUT = red
- [ ] Out-of-stock rows: light red row background
- [ ] Admin/Manager: Edit, Adjust, Log buttons visible
- [ ] Cashier (read-only mode): Edit/Adjust/Log buttons hidden, Add New Product hidden, filter dropdowns disabled
- [ ] Footer: Products count, Active count, Stock Cost Value

### "Manage Inventory →" from Dashboard
- [ ] Pre-select active store (locked — cannot change)
- [ ] Pre-select "Low Stock" filter (locked — cannot change)
- [ ] Show only low-stock items for that store

### Edit Product Modal
- [ ] Fields: Product Code, Product Name, Category, Unit Price, Cost Price, Reorder Level, Status
- [ ] Validation: Product Code unique, prices > 0, reorder_level ≥ 0

### Adjust Stock Modal
- [ ] Fields: Adjustment type (Add/Remove/Set), Quantity, Reason/Notes
- [ ] Write to `store_inventory`, insert record in `inventory_history`

### Inventory Log Modal
- [ ] Show `inventory_history` for selected product — Date, Type, Qty Change, New Qty, Reason, Done By

---

## PHASE 7 — Goods Sold (Transaction Records)

- [ ] Access: Admin and Manager only — Cashiers blocked
- [ ] Filter bar: From/To date (default: current month), Type (All/Cash/Credit), Employee, Store (Admin sees all)
- [ ] Summary tiles: Total Sales, Cash Sales, Credit Sales, Avg/Trans
- [ ] Transaction table columns: Transaction ID, Date, Type (badge), Total Amount (right-aligned bold), Processed By, Credit Employee, Status
- [ ] Footer: "Results: N | Cash: N (₱X.XX) | Credit: N (₱X.XX)"
- [ ] "View" button on each row → Transaction Detail modal
- [ ] Search: by transaction ID, cashier name, or buyer name

---

## PHASE 8 — Transaction Detail Modal

- [ ] Triggered from Goods Sold "View" button
- [ ] Info section (2-column grid): Transaction ID, Store, Date, Type, Status, Processed By, Credit Employee, Items Count
- [ ] Type: font color only — Cash = blue, Credit = purple (NO background color badge)
- [ ] Status: font color only — COMPLETED = green (NO background color badge)
- [ ] Items table: #, Product ID, Product Name, Qty, Unit Price, Cost Price, Subtotal, COGS (red), Gross Profit (green)
- [ ] COGS = `quantity * cost_price` from `sales_details`
- [ ] Summary bar: Grand Total, Total COGS (red parentheses), Gross Profit (green), Gross Margin %
- [ ] Grand Total bar (navy)
- [ ] Footer note: "Cost prices snapshotted at time of sale — historical COGS is always accurate"
- [ ] Print button (placeholder — "coming soon")
- [ ] No horizontal scrollbar

---

## PHASE 9 — Financial Statements

### Date Range Selector
- [ ] Modes: Daily, Weekly, 15 Days, Monthly (default: Monthly)
- [ ] Prev/Next navigation arrows
- [ ] Period label: human-readable (e.g. "March 2026", "Mar 16–31, 2026")
- [ ] All date parameters: timezone-aware (UTC) — Python `datetime.replace(tzinfo=timezone.utc)`

### Income Statement
- [ ] Cash Sales, Credit Sales, Total Revenue
- [ ] COGS: `SUM(sd.quantity * sd.cost_price)` from `sales_details` joined with `sales_header`
- [ ] COGS display: red parentheses `(₱X.XX)` only when > 0, black `₱0.00` when zero
- [ ] Gross Profit = Revenue − COGS — with margin % in label
- [ ] Transaction count tiles: "Cash Sales: N transactions", "Credit Sales: N transactions"

### Balance Snapshot
- [ ] Cash Collected = `SUM(total_amount)` for CASH sales (all time, no date filter)
- [ ] Accounts Receivable = `SUM(current_balance)` from `employee_credit_balance`
- [ ] Inventory at Cost = `SUM(cost_price * quantity_on_hand)` from `store_inventory` join `products`
- [ ] Total Liabilities = Accounts Receivable (override from vw_balance_snapshot)
- [ ] Net Position = Total Assets − Total Liabilities

### 6-Period Trend Table
- [ ] Call income query 6 times for 6 consecutive periods
- [ ] Columns: Period, Revenue, COGS, Gross Profit

### COGS Breakdown (collapsible)
- [ ] Default: collapsed
- [ ] Per product: Qty Sold, Unit Price (avg), Unit Cost (avg), Total COGS, Revenue, Gross Profit, Margin %
- [ ] TOTAL row bold at bottom
- [ ] Margin % color: green ≥ 20%, amber < 20%, red ≤ 0%

### Employee Credit Outstanding
- [ ] 3 aging buckets: 0-15 days, 16-30 days, 31+ days
- [ ] Employee table: Employee, Role, Balance, Limit, Used % (right-aligned)
- [ ] Total Outstanding (bold navy bar)
- [ ] Hide "Credit Info / LimitLabel" column — truncates in narrow grids

### Inventory Summary by Category
- [ ] Columns: Category, Products (count), Units on Hand, Stock Cost, Stock Value (blue), Gross Margin
- [ ] Remove "Avg Price" column — meaningless aggregate across products
- [ ] Gross Margin color: green ≥ 20%, amber < 20%, red ≤ 0%
- [ ] Out-of-stock categories: light red row background
- [ ] TOTAL row bold at bottom

---

## PHASE 10 — Employee Masterlist

- [ ] Access: Admin only
- [ ] List view: Employee Code, Name, Role, Store Assignment(s), Status, Actions
- [ ] Add/Edit employee modal: First Name, Last Name, Role, Store(s), Active status
- [ ] Store assignment uses `employee_store_assignments` table (many-to-many)
- [ ] Cannot delete employees — only deactivate (`is_active = FALSE`)

---

## CROSS-CUTTING REQUIREMENTS

### Low Stock Threshold — MUST BE CONSISTENT
- [ ] Dashboard KPI tile: `quantity_on_hand <= reorder_level`
- [ ] Dashboard sidebar panel: `quantity_on_hand <= reorder_level`
- [ ] Inventory KPI tile: includes both LOW and OUT (`qty <= reorder_level` OR `qty = 0`)
- [ ] Inventory "Low Stock" filter: includes both LOW and OUT
- [ ] Financial Statements inventory summary: same threshold
- [ ] **All queries must use `<=` not `<`**

### COGS Calculation — MUST USE SNAPSHOTTED COST
- [ ] All COGS = `SUM(quantity * cost_price)` from `sales_details.cost_price`
- [ ] Never recalculate from current `products.cost_price`
- [ ] When processing sales: always include `cost_price` in cart JSON from products table

### Currency Display
- [ ] Symbol: ₱ (Philippine Peso)
- [ ] Format: `₱X,XXX.XX` (N2 with comma separator)
- [ ] Negative accounting: `(₱X.XX)` — parentheses format, red color
- [ ] Zero: `₱0.00` in normal (black) color — never red parentheses

### Role-Based UI
- [ ] **Never disable buttons for role access — always hide them**
- [ ] Role checks on every protected view (server-side, not just UI)

### Data Isolation
- [ ] All queries must filter by `store_id` from the user session
- [ ] Admin can query across stores — non-admin restricted to assigned store
- [ ] `payment_status = 'VOID'` excluded from all counts, totals, and reports

### Session Code Format
- [ ] `SESS-S{store_id}-{YYYYMMDD}-{session_id:03d}`
- [ ] Example: `SESS-S1-20260324-022` = store 1, March 24 2026, session_id 22
- [ ] Constructed in Python — not stored in DB

---

## TESTING CHECKLIST

- [ ] Low stock count matches between dashboard tile, sidebar panel, and inventory KPI tile
- [ ] COGS is non-zero for all sales (verify cost_price included in cart JSON)
- [ ] Credit balance is per-store (employee at store 1 and store 2 have separate balances)
- [ ] Session guard blocks Cash Sales when no open session
- [ ] Credit Sales NOT blocked when no open session
- [ ] Cash session expected cash = opening balance + cash sales total (computed, never queried)
- [ ] Variance = actual_cash − expected_cash (can be positive, negative, or zero)
- [ ] "Manage Inventory →" from dashboard opens with active store locked + Low Stock filter locked
- [ ] Transaction Detail COGS is calculated from `sales_details.cost_price` not current product cost
- [ ] Date range UTC timezone — no "unspecified timezone" errors from PostgreSQL
- [ ] All ₱0.00 values display in black, not red parentheses
- [ ] Cashier dashboard shows only own transactions in Recent Transactions
- [ ] Admin dashboard shows all store transactions in Recent Transactions
- [ ] "View Transactions →" button hidden for cashiers
- [ ] Low Stock button opens Inventory in read-only mode for cashiers
