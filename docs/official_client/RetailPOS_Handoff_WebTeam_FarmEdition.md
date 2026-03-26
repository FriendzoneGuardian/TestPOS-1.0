# RetailPOS Enterprise — Web Team Handoff Document
**Prepared for:** Django/Python + Flowbite-Tailwind team  
**Date:** March 25, 2026  
**Status:** Desktop (VB.NET) development paused — handing off to web implementation

---

## 1. Project Overview

**RetailPOS Enterprise** is a multi-branch retail Point-of-Sale system for a small-to-medium retail business (currently 2 stores: Main Branch and Second Branch). The desktop version is built in VB.NET Windows Forms with PostgreSQL 14+ via Npgsql. The web version should replicate all modules using Django + Python backend and Flowbite-Tailwind frontend.

### Store Setup
| store_id | store_code | store_name |
|---|---|---|
| 1 | STR-001 | Main Branch |
| 2 | STR-002 | Second Branch |

### Key Business Rules
- Each store operates independently with its own inventory, cash sessions, and credit balances
- Cash sessions are per-cashier per-store — one open session per cashier per store at a time
- Credit sales deduct from `employee_credit_balance` which is per-store per-employee
- All monetary values use Philippine Peso (₱)
- `quantity_on_hand <= reorder_level` is the universal low-stock threshold (use `<=` everywhere, never `<`)

---

## 2. Database — `POS_Database_v4_1_FINAL.sql`

The complete schema is provided. Key facts:

### 17 Tables
| Table | Purpose |
|---|---|
| `stores` | Store master (store_id, store_code, store_name, address) |
| `roles` | Employee roles (Admin, Manager, Cashier, etc.) |
| `employees` | Employee master with role and store assignments |
| `employee_store_assignments` | Many-to-many employee ↔ store |
| `products` | Product master (product_code, name, unit_price, cost_price, reorder_level) |
| `categories` | Product categories |
| `store_inventory` | Per-store stock levels (quantity_on_hand) — UNIQUE(store_id, product_id) |
| `inventory_history` | Audit log of all stock adjustments |
| `cash_sessions` | Cash session lifecycle (opening_balance, status OPEN/CLOSED, variance) |
| `sales_header` | Transaction header (sale_code, sale_type CASH/CREDIT, session_id, total_amount, payment_status) |
| `sales_details` | Line items (product_code, quantity, unit_price, **cost_price snapshotted**, line_total) |
| `employee_credit_balance` | Running credit balance per employee per store — UNIQUE(store_id, employee_id) |
| `credit_ledger` | Credit transaction log |
| `payments` | Payment records for credit repayments |
| `audit_trail` | System-wide audit log |
| `access_logs` | Login/logout tracking |
| `units_of_measure` | (reference only) |

### 10 Views
- `vw_current_stock` — per-store stock with low-stock flag
- `vw_sales_summary` — daily sales totals per store
- `vw_low_stock_alert` — products at or below reorder level
- `vw_credit_outstanding` — employee credit balances
- `vw_aging_report` — credit aging (0-15, 16-30, 31+ days buckets)
- `vw_balance_snapshot` — balance sheet snapshot per store
- `vw_income_summary` — monthly income per store
- `vw_goods_sold` — transaction list view
- `vw_inventory_valuation` — inventory cost/retail values
- `vw_cashier_performance` — per-cashier sales summary

### 4 Stored Functions
| Function | Purpose |
|---|---|
| `fn_process_sale(p_store_id, p_employee_id, p_session_id, p_sale_type, p_cart_json, p_payment_amount)` | Processes a complete sale atomically — validates stock, inserts header+details, deducts inventory, handles credit balance |
| `fn_open_cash_session(p_store_id, p_employee_id, p_opening_cash, p_terminal_id)` | Opens a cash session, raises error if one already open |
| `fn_close_cash_session(p_session_id, p_closed_by, p_actual_cash)` | Closes session, computes variance, updates cash_sales_total and expected_cash |
| `fn_record_credit_payment(p_store_id, p_employee_id, p_amount, p_payment_type, p_reference)` | Records a credit repayment |

### Critical Data Rules
- `sales_details.cost_price` is **snapshotted at time of sale** — never recalculated retroactively
- COGS = `SUM(quantity * cost_price)` per line item from sales_details
- `payment_status = 'VOID'` transactions are excluded from all reports and counts
- Session code format: `SESS-S{store_id}-{YYYYMMDD}-{session_id:03d}` — constructed in app, not stored in DB
- Sale code format: `SALE-{store_code}-{YYYYMMDD}-{sequence}` — stored in `sales_header.sale_code`

---

## 3. User Roles & Access Control

| Role | POS (Sales) | Cash Valuting | Inventory | Goods Sold | Financial Statements | Dashboard |
|---|---|---|---|---|---|---|
| **Admin** | ✗ | ✗ | ✓ (edit) | ✓ | ✓ | ✓ (all stores) |
| **Manager** | ✗ | ✗ | ✓ (edit) | ✓ | ✓ | ✓ (own store) |
| **Cashier** | ✓ | ✓ | ✓ (view only) | ✗ | ✗ | ✓ (own store, own txns) |

**Key rule:** Never show disabled buttons. If a role cannot use a feature, hide it entirely.

---

## 4. Completed Modules (Desktop — replicate in Web)

### 4.1 Cash Valuting (Cash Sessions)
**Status:** ✅ Complete and verified

**Flow:**
1. Cashier opens session → enters opening balance → `fn_open_cash_session()` called
2. Session guard: Cash Sales module blocked if no open session. Credit Sales always unblocked.
3. Live variance on close modal: as cashier types actual cash, variance = actual − (opening + cash_sales_total) updates in real time
4. On close → `fn_close_cash_session()` → result is Balanced / Shortage / Overage
5. Valuting report shown after close

**UI components needed:**
- Main page: Active session panel (Session ID, Cashier, Opening Balance, Cash Sales Total, Expected Cash)
- Cash Session History table (Session ID, Opened By, Opened At, Closed At, Opening Balance, Actual Cash, Variance, Result)
- Open session modal
- Close session modal with live variance calculation

**Business rule:** One open session per cashier per store. `fn_open_cash_session` raises an exception if violated.

---

### 4.2 Cash Sales
**Status:** ✅ Complete (session guard implemented)

**Key rules:**
- Blocked if no open cash session (shows "Open a cash session first" prompt)
- Product cards show `AvailableQty = stock_on_hand − cart_qty` in real time (UI layer only — never writes to DB during cart)
- `+` button disabled when AvailableQty ≤ 0
- Stock only decremented on checkout via `fn_process_sale()`
- Cart JSON format: `[{"product_id": 1, "quantity": 2, "unit_price": 15.00, "cost_price": 8.00}]`

---

### 4.3 Credit Sales
**Status:** ✅ Complete

**Key rules:**
- Never blocked by cash session status
- Self-selection prevention: cashier cannot buy for themselves (`AND e.employee_id <> @loggedInEmployeeId`)
- `cost_price` must be included in cart JSON — read from products table, not hardcoded to 0
- Upsert pattern: `INSERT INTO employee_credit_balance ... ON CONFLICT (store_id, employee_id) DO NOTHING` — prevents duplicate key 23505
- Credit balances are per-store (intentional — matches payroll cycle)

---

### 4.4 Financial Statements
**Status:** ✅ Complete

**Sections:**
1. **Income Statement** — Cash Sales, Credit Sales, Total Revenue, COGS (red parentheses when > 0), Gross Profit with margin %, transaction count tiles
2. **Balance Snapshot** — Cash Collected, Accounts Receivable, Inventory at Cost → Total Assets, Total Liabilities (= Accounts Receivable), Net Position
3. **6-Month Trend Table** — Revenue, COGS, Gross Profit per period
4. **COGS Breakdown** (collapsible) — per-product: Qty Sold, Unit Price, Unit Cost, Total COGS, Revenue, Gross Profit, Margin %
5. **Employee Credit Outstanding** — aging buckets (0-15, 16-30, 31+ days), employee credit table (Employee, Role, Balance, Limit, Used %)
6. **Inventory Summary by Category** — Category, Products (count), Units on Hand, Stock Cost, Stock Value, Gross Margin

**Date range selector:** Daily / Weekly / 15 Days / Monthly with prev/next navigation  
**Critical bug fix:** All datetime parameters must use `DateTimeKind.Utc` — PostgreSQL TIMESTAMPTZ rejects `Unspecified`

**Formatting rules:**
- Zero values: `₱0.00` in black — never red parentheses
- Negative values: `(₱X.XX)` in red — only when value > 0
- Gross Margin color: green ≥ 20%, amber < 20%, red ≤ 0%
- Out-of-stock inventory rows: light red background

---

### 4.5 Goods Sold (Transaction Records)
**Status:** ✅ Complete

**Features:**
- Filter bar: From/To date, Type (All/Cash/Credit), Employee, Store, Search
- Summary tiles: Total Sales, Cash Sales, Credit Sales, Avg/Trans
- Transaction table: Transaction ID, Date, Type (color-coded), Total Amount, Processed By, Credit Employee, Status
- Footer: Results count, Cash count + amount, Credit count + amount
- "View" button opens Transaction Detail modal

**Access:** Admin and Manager only. Cashiers do not have access.

---

### 4.6 Transaction Detail Modal
**Status:** ✅ Complete

**Layout (compact, 920×560px):**
- Header: Transaction ID in title
- Info grid (2-column): Transaction ID, Store, Date, Type, Status, Processed By, Credit Employee, Items Count
- Items table: #, Product ID, Product Name, Qty, Unit Price, Cost Price, Subtotal, COGS (red), Gross Profit (green)
- Summary bar: Grand Total, Total COGS, Gross Profit, Gross Margin
- Grand Total navy bar
- Footer: cost snapshot note, Print (placeholder), Close buttons

**Key design decisions:**
- Type/Status labels: font color only, no background color badges
- No horizontal scrollbar
- COGS column is red; Gross Profit column is green

---

### 4.7 Dashboard (Role-Based)
**Status:** ✅ Complete (both Admin and Cashier variants)

**Shared sections (both roles):**
- Header: Store name, user info, auto-refresh every 60 seconds
- KPI tiles: Today's Sales (green), Credit Outstanding (purple), Low Stock Items (amber), Transactions Today (blue)
- 7-Day Sales Performance chart: Cash (blue bars) vs Credit (purple bars)
- Active Cash Session panel

**Role differences:**

| Section | Admin/Manager | Cashier |
|---|---|---|
| Quick Actions | Low Stock button only | New Cash Sale, New Credit Sale, Cash Valuting, Low Stock (read-only) |
| Recent Transactions | All cashiers, "View Transactions →" visible | Own transactions only, "View Transactions →" hidden |
| Cash Session header | "Cash Sessions — Active" / all open sessions | "Active Cash Session" / own session only |
| No-session warning | "Assign a cashier to open one" | "Open one in Cash Valuting" |
| Low Stock sidebar | + "Manage Inventory →" button | View only, no button |

**Active Cash Session panel fields:**
- Session ID (format: `SESS-S{store_id}-{YYYYMMDD}-{session_id:03d}`)
- Cashier name
- Opening Balance
- Cash Sales Total (blue)
- Expected Cash (bold) = Opening Balance + Cash Sales Total (computed in app, never queried)

**Low Stock panel:**
- Header: `⚠ Low Stock Alert (N items)` — red background
- Grid: Product Name, Stock (amber badge if low, red "OUT" if zero), Min
- Empty state: `✓ All stock levels are healthy` (green)
- Admin/Manager only: "Manage Inventory →" button at bottom

---

### 4.8 Inventory Management
**Status:** ✅ Complete

**Features:**
- KPI tiles: Total Products, Total Stock Value (cost-based), Low Stock Items, Out of Stock
- Filter bar: Search, Category, Store, Status (All/Active/Inactive), Stock Level (All/In Stock/Low Stock/Out of Stock)
- Grid columns: Product Code, Product Name, Category, Unit Price, Cost Price, Reorder Level, Qty on Hand, Status, Stock Status (OK/LOW/OUT), Actions (Edit/Adjust/Log)
- Footer status bar: Products count, Active count, Stock Cost Value

**Stock Status thresholds:**
- `OUT`: qty = 0
- `LOW`: qty > 0 AND qty ≤ reorder_level
- `OK`: qty > reorder_level

**Critical:** Low Stock filter must include both LOW and OUT items. Low Stock count in KPI tile must include OUT items. This matches the dashboard threshold.

**"Manage Inventory →" from Dashboard:**
- Opens with the active store pre-selected and locked
- Opens with "Low Stock" filter pre-selected and locked
- Store dropdown and Stock Level dropdown both disabled (user cannot change them)

---

## 5. Known Bugs Fixed (Important for Web Implementation)

| Bug | Fix Applied |
|---|---|
| COGS = 0 on credit sales | Must include `cost_price` in cart JSON from products table |
| Duplicate key 23505 on credit balance | Use `INSERT ... ON CONFLICT DO NOTHING` not SELECT+INSERT |
| DateTime timezone error with PostgreSQL | Always use `DateTimeKind.Utc` for TIMESTAMPTZ parameters |
| Low stock count mismatch | Standardize to `quantity_on_hand <= reorder_level` everywhere |
| Inventory filter ignores ComboBox state | Call `ApplyFilters()` (reads from UI) not `LoadProducts()` (uses defaults) |
| Low Stock filter shows "All Stores" aggregate | Pre-select active store before applying Low Stock filter |
| Session code format wrong | Construct as `SESS-S{store_id}-{YYYYMMDD}-{session_id:D3}` not `SESS-{integer}` |

---

## 6. Pending / Not Yet Implemented

| Feature | Notes |
|---|---|
| Print functionality | Transaction Detail modal has "Print" button — placeholder only ("coming soon") |
| Variance notes/reason field | When closing a session with a variance, a notes field for explanation is missing. Best practice — add it. |
| Inventory Edit modal | `AddEditProductForm` exists in desktop — needs web equivalent |
| Inventory Adjust Stock modal | `AdjustStockForm` exists in desktop — needs web equivalent |
| Inventory Log modal | `InventoryLogForm` exists in desktop — needs web equivalent |
| Employee Masterlist | Exists in desktop — full CRUD for employees, role assignments, store assignments |
| Login / Authentication | Exists in desktop via `LoginForm` and `UserSession` — needs Django auth |
| Credit payment recording | `fn_record_credit_payment()` exists — UI for recording repayments not built |

---

## 7. Web Implementation Notes for Django + Flowbite-Tailwind

### Django Models
Map directly to the PostgreSQL schema. Use `managed = False` if connecting to the existing database. Key model relationships:
- `Product` → `Category` (FK)
- `StoreInventory` → `Store` + `Product` (composite unique)
- `SalesHeader` → `Store` + `Employee` (cashier) + `CashSession` + optional `Employee` (buyer)
- `SalesDetails` → `SalesHeader` + `Product` (cost_price snapshotted at time of sale)
- `EmployeeCreditBalance` → `Store` + `Employee` (unique per store per employee)

### Django Views / API Pattern
Use Django REST Framework for API endpoints if building SPA, or Django class-based views for server-rendered. Suggested URL structure:
```
/api/dashboard/kpi/
/api/dashboard/chart/
/api/dashboard/sessions/
/api/dashboard/low-stock/
/api/transactions/
/api/transactions/<id>/
/api/inventory/
/api/inventory/<id>/adjust/
/api/sessions/open/
/api/sessions/close/
/api/financial/income/
/api/financial/balance/
/api/financial/cogs-breakdown/
/api/financial/inventory-summary/
```

### Calling Stored Functions
Call `fn_process_sale`, `fn_open_cash_session`, `fn_close_cash_session`, `fn_record_credit_payment` via `cursor.execute("SELECT fn_process_sale(%s, %s, %s, %s, %s::jsonb, %s)", [...])`

### Flowbite Components to Use
- KPI tiles → Flowbite stat cards
- Transaction tables → Flowbite table with pagination
- Modals → Flowbite modal component
- Filters → Flowbite select/input components
- Badges → Flowbite badge (Cash = blue, Credit = purple, Completed = green, Void = red)
- Charts → Chart.js (already used in dashboard design — bar chart with Cash/Credit series)
- Sidebar navigation → Flowbite sidebar

### Color Conventions (match desktop)
| Meaning | Color |
|---|---|
| Cash / Primary actions | Blue `#1A6EBD` |
| Credit / Purple accent | Purple `#6A1B9A` |
| Positive / Healthy / Completed | Green `#287832` |
| Warning / Low Stock | Amber `#E67E22` |
| Danger / COGS / Out of Stock | Red `#C0392B` |
| Navy header/accent | Navy `#1A2B45` |

---

## 8. Database Connection

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'POS_Database',  # confirm exact DB name
        'USER': '...',
        'PASSWORD': '...',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

All queries must filter by `store_id = active_store_id` from the user session. Never return cross-store data to a non-admin user.

---

## 9. File Reference

| File | Contents |
|---|---|
| `POS_Database_v4_1_FINAL.sql` | Complete schema — 17 tables, 10 views, 4 stored functions, seed data |
| Desktop VB.NET source | Reference implementation for all business logic |

---

*Document prepared from the RetailPOS VB.NET development session. All business logic, database rules, and design decisions documented above have been validated against the live database and working desktop application.*
