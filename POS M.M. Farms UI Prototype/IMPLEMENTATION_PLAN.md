# Implementation Plan: Merging React Prototype → Django + Electron POS

> **Purpose**: This document identifies what to "scrap" from this React/Vite prototype and how to port it as UI blueprints/business logic into the main Django + Flowbite-Tailwind + Electron Shell POS project.

---

## 1. What This Prototype IS (and ISN'T)

| Aspect | Reality |
|---|---|
| **Tech stack** | React 18 + Vite + Tailwind + Radix UI |
| **Data** | 100% client-side mock data (`mockData.ts`) — no real DB |
| **Auth** | Fake login via hardcoded credentials in `AppContext` |
| **Backend** | ❌ None |
| **Purpose** | Figma-exported UI prototype only |

**Bottom line:** You are NOT migrating code. You are using this as a **UI blueprint** and **business logic reference** for your Django project.

---

## 2. Features to Scrap / Port

### ✅ PORT — High Value, Directly Usable as Reference

| Feature | Source File | What to Copy |
|---|---|---|
| **3-Panel POS Layout** (Product Left / Cart Center / Summary Right) | `CashSales.tsx` | The HTML structure and column sizing logic |
| **Credit Sales with Limit Enforcement** | `CreditSales.tsx` | The ₱1,500 credit limit guard, "would-exceed" check, and eligibility banner logic |
| **Cash Session Open/Close (Valuting)** | `CashValuting.tsx` | The `Expected = Opening + Cash Sales` formula; Variance (Balanced/Shortage/Overage) status logic |
| **Dashboard KPI Cards** | `Dashboard.tsx` | 4-card grid layout: Today's Sales, Credit Outstanding, Low Stock, Transactions |
| **7-Day Sales Bar Chart** | `Dashboard.tsx` (Recharts) | Chart structure — replace Recharts with Chart.js or inline `<canvas>` in Django templates |
| **Low Stock Alert Table** | `Dashboard.tsx` | Reorder-level color-coded badge logic |
| **Credit Ledger Per-Employee Balance** | `CreditSales.tsx`, `mockData.ts` | `runningBalance` calculation pattern, per-payroll-period aging |
| **Inventory History Log** | `mockData.ts` | `InventoryHistory` type with `type: Restock | Sale | Adjustment | Transfer-In | Transfer-Out` |
| **Cash Session History Table** | `CashValuting.tsx` | Column set: Session ID, Opened By, Opening Bal, Cash Sales, Expected, Actual, Variance, Result |
| **Confirmation Modals** | `WinModal.tsx` | The 2-step confirm pattern (show summary → confirm) |
| **Role-Gated UI** | All pages | `currentUser?.role === 'Admin'` pattern → map to Django `request.user.groups` |

---

### ❌ SKIP / DISCARD — React-specific, not portable

| What | Why |
|---|---|
| `AppContext.tsx` | React state management — Django uses session/DB instead |
| All `.tsx` component code | Not usable in Jinja2/Django templates |
| `mockData.ts` | Only useful as schema reference (see below) |
| Vite/Radix/Tailwind config | Django already has its own Tailwind + Flowbite setup |
| React Router | Django handles routing natively |
| `react-hook-form`, `recharts`, etc. | Already have Django form handling; use Chart.js for charts |

---

## 3. Data Model Reference

Use `mockData.ts` as the **Django model design spec**. Key models to ensure you have:

```
Store           → id, name, location, terminal_id
Employee/User   → role (Admin|Manager|Cashier), store_ids (M2M), status
Product         → store, category, unit_price, cost_price, qty, reorder_level, status
Transaction     → store, date, type (Cash|Credit), total, employee, credit_employee, items, status
TransactionItem → transaction, product, qty, unit_price, cost_price
CreditLedger    → employee, store, transaction, amount, type (Purchase|Payment),
                  running_balance, payroll_period, due_date, status (Current|Due|Deducted)
CashSession     → store, employee, opening_balance, opening_time, closing_time,
                  cash_sales_total, expected_cash, actual_cash, variance,
                  variance_status (Balanced|Shortage|Overage), terminal_id
InventoryLog    → store, product, date, type (Restock|Sale|Adjustment|Transfer-In|Transfer-Out),
                  qty_change, qty_before, qty_after, employee, notes
```

> The `CREDIT_LIMIT = 1500` constant → store as a Django setting or a `SystemConfig` model.

---

## 4. Page-by-Page Migration Map

| Prototype Page | Django URL | Priority |
|---|---|---|
| `Login.tsx` | `/login/` | Already exists |
| `Dashboard.tsx` | `/` or `/dashboard/` | **HIGH** |
| `CashSales.tsx` | `/pos/cash/` | **HIGH** |
| `CreditSales.tsx` | `/pos/credit/` | **HIGH** |
| `CashValuting.tsx` | `/cash-sessions/` | **HIGH** |
| `Inventory.tsx` | `/inventory/` | **MEDIUM** |
| `GoodsSold.tsx` | `/reports/goods-sold/` | **MEDIUM** |
| `FinancialStatements.tsx` | `/reports/financial/` | **MEDIUM** |
| `EmployeeMasterlist.tsx` | `/employees/` | **LOW** (admin panel covers this) |

---

## 5. Implementation Phases

### Phase A — UI Parity (Layouts & Colors)
1. Replicate the **3-panel POS layout** in Django templates using Flowbite + Tailwind.
2. Port the **color palette** (navy `#1a3a5c`, blue `#1a4a8a`, purple `#4a148c`, red `#bf360c`).
3. Match the **compact data-table style** (bordered, alternating rows, monospace IDs).

### Phase B — Business Logic (Django Views)
1. Implement `CashSession` open/close with `Expected = Opening + Cash Sales` validation.
2. Implement credit limit guard in credit sale view (check `running_balance + new_total <= 1500`).
3. Implement `InventoryLog` write on every sale.
4. Dashboard view aggregates (today's sales, credit outstanding, low stock count).

### Phase C — Electron Shell Integration
1. Set `webSecurity: false` or configure CSP for local Django server.
2. Ensure all API calls are relative (no hardcoded `localhost:8000`) — use `window.DJANGO_URL`.
3. Test print receipt flow inside Electron's `BrowserWindow`.

---

## 6. Key Logic to Preserve Exactly

```
// Credit Guard (port to Django view)
new_balance = current_balance + transaction_total
if new_balance > CREDIT_LIMIT:
    raise ValidationError("Transaction would exceed ₱1,500 credit limit")

// Cash Valuting (port to Django model method)
expected_cash = opening_balance + sum(cash_sales during session)
variance = actual_cash - expected_cash
variance_status = "Balanced" if variance == 0 else "Shortage" if variance < 0 else "Overage"

// Dashboard KPIs
today_sales = sum(transactions where date=today and store=active_store)
credit_outstanding = sum(last running_balance per employee where balance > 0)
low_stock_items = products where qty <= reorder_level and status='Active'
```

---

## 7. What NOT to Rebuild

- Do NOT replicate Radix UI components — Flowbite already covers modals, dropdowns, tables.
- Do NOT port the React component tree — use Django template inheritance with `{% block %}`.
- Do NOT port `AppContext` — Django session + database IS your global state.
