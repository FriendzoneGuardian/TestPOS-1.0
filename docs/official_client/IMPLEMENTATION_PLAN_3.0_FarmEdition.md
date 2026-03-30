**Codename:** _The Harvest Integration_
**Branch:** `django-duets`
**Strategy:** Systematic extraction of validated business logic from the React/Vite UI Prototype into the production Django application. Core functional logic is prioritized before UI updates.

---

## ✅ Phase 1 — Foundation Harvest (v3.0 – v3.2) `COMPLETE`

### v3.0 — Sowing the Seeds

> _Establishing the core infrastructure before the crop comes in._

- [x] `EMPLOYEE_CREDIT_LIMIT = 1500` added to `settings.py` — The Harvest Limit, globally declared
- [x] `Shift.variance_status` property — Auto-labels Balanced / Shortage / Overage
- [x] `Shift.session_code` property — Formatted as `SESS-S{branch}-{date}-{seq:03d}`
- [x] `peso` + `peso_signed` Django template filters — `core/templatetags/peso_filters.py`
- [x] `PH()` JS helper — `static/js/peso.js` — Client-side ₱ currency formatting
- [x] Low-stock threshold `<= reorder_level` audited — consistent across all 3 locations

### v3.1 — The Barn Door Protocol _(Access Control)_

> _Only authorised personnel may begin a transaction cycle._

- [x] **Session Guard** verified: transactions blocked if no active Shift/Session exists
- [x] **Harvest Limit Guard** upgraded: now checks `customer.credit_limit` (per-customer, dynamic)
- [x] Error messaging now displays current outstanding balance and limit in ₱X,XXX.XX format

### v3.2 — The Daily Tally _(Cash Session Integrity)_

> _Every session that opens must close with a full count._

- [x] `Shift.variance_notes` field added to model — closure notes captured on record
- [x] Migration `0012_phase_3_2_variance_notes` applied ✅
- [x] Session open response returns `session_code` in JSON payload
- [x] Session close captures `variance_notes` from POST body, persisted to DB
- [x] Close notification message uses `session_code` + `variance_status` classification
- [x] Close JSON payload: includes `variance_status`, `session_code` for frontend display

---

## 🔴 Phase 2 — Field Intelligence (v3.3 – v3.5)

### v3.3 — The Farm Dashboard _(Operations Overview)_

> _A clear view of the field from the farmhouse window._

- [ ] Build `templates/dashboard/index.html` — full build required (directory is empty)
- [ ] 4 KPI Tiles: Today's Revenue, Outstanding Credit, Low Stock Count, Transaction Count
- [ ] Active Session status card (displays `session_code`, start time, operator name)
- [ ] 7-day Chart.js bar chart (Cash Revenue = `#1565c0`, Credit Revenue = `#6a1b9a`)
- [ ] Low Stock sidebar — OUT OF STOCK / Warning badge logic
- [ ] Recent Transactions table (filtered by user role)
- [ ] Wire all aggregations into `core/views.py` dashboard view
- [ ] AJAX auto-refresh polling every 60 seconds

### v3.4 — Crop-to-Table Costing _(COGS Financial Engine)_

> _Tracking every peso from field to register._

- [ ] Validate full COGS pipeline: `OrderItem.cost_at_time` × `quantity` per line item
- [ ] Build Revenue vs. COGS breakdown section in `financials/periodic.html`
- [ ] Implement Gross Profit = Revenue − COGS column
- [ ] Profit Margin = Gross Profit / Revenue × 100%
- [ ] Expand Periodic Reports to all 6 time periods: Daily / Weekly / 15-Day / Monthly / Quarterly / Annual
- [ ] Verify all aggregations exclude voided orders (`status='completed'` filter)

### v3.5 — The Field Ledger _(Transaction Records & Credit Aging)_

> _Every transaction has a paper trail. The books are always open._

- [ ] Build `templates/sales/goods_sold.html` — full transaction history list view
- [ ] Build Transaction Detail modal — line-item view with COGS, Revenue, Gross Profit, Margin
- [ ] Build Credit Aging display panel (0–15 days / 16–30 days / 31+ days categories)
- [ ] Expand `CreditLedger`: add `running_balance`, `due_date`, `status` (Current / Due / Deducted)

---

## 🟡 Phase 3 — Stock & Operations (v3.6)

### v3.6 — The Stockroom Audit _(Inventory Integrity)_

> _Every delivery in. Every sale out. Every adjustment documented._

- [ ] Build Inventory Adjust modal — writes simultaneously to `BranchStock` and `StockAuditLog`
- [ ] Build per-product Inventory History Log view
- [ ] Enforce `cost_price` (unit cost) as required + validated on every stock batch entry
- [ ] Expand `StockAuditLog`: add `qty_before`, `qty_after`, `log_type` (Sale / Adjust / Void / Transfer / Recount)

---

## 🟡 Phase 4 — User Interface Refinement (v3.7 – v3.8)

### v3.7 — Layout Consolidation _(Compact Field Interface)_

> _A clean interface for a productive harvest day._

- [ ] Refine data tables: compact Navy-header / alternating-row style from prototype
- [ ] Implement 2-step confirmation modal: "Review Summary → Confirm" for checkout and session close
- [ ] Apply 3-panel POS layout to `pos/terminal.html` (Product Grid | Cart | Payment)

### v3.8 — Visual Standards _(Branded Interface)_

> _Professional, consistent, and purpose-built for farm retail._

- [ ] Map prototype accent colors into `tailwind.config.js` as named tokens:
  - `pos-navy-dark: #1a3a5c` → POS data table headers
  - `pos-navy-mid: #2c4a6e` → Panel sub-headers
  - `pos-purple: #6a1b9a` → Credit transaction accent color
- [ ] Glassmorphism dark shell retained as primary aesthetic — not replaced
- [ ] Evaluate Material Design UI layer: floating labels, elevation shadows alongside current glassmorphism

---

## 🟢 Phase 5 — Hardware & Finalisation (v3.9)

### v3.9 — Final Harvest _(System Completion)_

> _Printing receipts. Refreshing dashboards. Closing the books._

- [ ] Wire `window.print()` to Transaction Detail modal for receipt printing
- [ ] Dashboard AJAX 60-second auto-refresh (setInterval + lightweight fetch endpoint)
- [ ] Electron `BrowserWindow` configuration: verify `minWidth=1280`, `webContents.print()` functional
- [ ] Full role-based access control audit: restricted UI elements omitted entirely from DOM

---

## 📋 Delivery Log

| Commit    | Phase    | Description                                                                              |
| --------- | -------- | ---------------------------------------------------------------------------------------- |
| `dd3b9c9` | v3.0     | Core Foundation — Harvest Limit, Variance Status, Session Code, Currency Formatters      |
| `bd073c4` | v3.1–3.2 | Access Control + Daily Tally — dynamic credit guard, variance notes, session code in API |

---

> _FarmYield POS — Built for the fields. Reliable for the ledger._
> **Every transaction. Accurately recorded. Every time.**
