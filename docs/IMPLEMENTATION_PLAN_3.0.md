# 🔥 MoneyShot — Alpha 3.0 Aggressive Overhaul Plan
**Codename:** *The Prototype Plunge*
**Branch:** `django-duets`
**Strategy:** Aggressive feature translation from React/Vite Prototype → Django. Logic first. UI second. No mercy.

---

## ✅ Phase 1 — Core Foundation (v3.0 – v3.2) `COMPLETE`

### v3.0 — The Groundwork
> *Lay the pipes before you blast through them.*

- [x] `EMPLOYEE_CREDIT_LIMIT = 1500` added to `settings.py` — The Rizz Limit, globally declared
- [x] `Shift.variance_status` property — Auto-labels Balanced / Shortage / Overage
- [x] `Shift.session_code` property — Formatted as `SESS-S{branch}-{date}-{seq:03d}`
- [x] `peso` + `peso_signed` Django template filters — `core/templatetags/peso_filters.py`
- [x] `PH()` JS helper — `static/js/peso.js` — Client-side ₱ formatting
- [x] Low-stock threshold `<= reorder_level` audited — already correct across all 3 locations

### v3.1 — POS Terminal Parity *(The Gatekeeper's Kiss)*
> *You can't get in without showing your shift badge, handsome.*

- [x] **Session Guard** verified: `checkout` blocks if no active `Shift` exists (line 95-97)
- [x] **Credit Guard** upgraded: now checks `customer.credit_limit` (dynamic) instead of hardcoded 1500
- [x] Error message now shows current balance + limit, printed in ₱X,XXX.XX format

### v3.2 — Valuting Module *(The Ledger's Climax)*
> *Every shift that opens must close. We track every peso, every note.*

- [x] `Shift.variance_notes` field added to model — required capture on close
- [x] Migration `0012_phase_3_2_variance_notes` applied ✅
- [x] `shift_start` response now returns `session_code` in JSON
- [x] `shift_end` captures `variance_notes` from POST, saves to model
- [x] Close message uses `session_code` + `variance_status` label
- [x] Close JSON response: includes `variance_status`, `session_code`

---

## 🔴 Phase 2 — Financial Intelligence (v3.3 – v3.5)

### v3.3 — Dashboard Intelligence *(The Full Exposure)*
> *4 KPIs, naked and unashamed. The numbers tell all.*

- [ ] Build `templates/dashboard/index.html` — empty dir, full build needed
- [ ] 4 KPI tiles: Today's Sales, Credit Outstanding, Low Stock Count, Transaction Count
- [ ] Active Session card (shows `session_code`, start time, cashier name)
- [ ] 7-day Chart.js bar chart (Cash=`#1565c0`, Credit=`#6a1b9a`)
- [ ] Low Stock sidebar panel — OUT / amber badge logic
- [ ] Recent Transactions table (role-filtered)
- [ ] Wire dashboard view in `core/views.py` with all aggregations
- [ ] AJAX auto-refresh every 60 seconds

### v3.4 — Financial Engine *(The Accountant's Revenge)*
> *Every peso is tracked from the moment it was born to when it leaves the register.*

- [ ] Validate full COGS pipeline: `OrderItem.cost_at_time` × `quantity` per line
- [ ] Build revenue vs COGS breakdown in `periodic.html`
- [ ] Implement Gross Profit = Revenue − COGS column
- [ ] Profit Margin = GP / Revenue × 100
- [ ] Expand `periodic.html` to all 6 periods: Daily / Weekly / 15-Day / Monthly / Quarterly / Annual
- [ ] Exclude voided orders from ALL aggregations (verify `status='completed'` in every query)

### v3.5 — Goods Sold & Credit Ledger *(The Receipts)*
> *The Rizz Cap has a paper trail. We keep it.*

- [ ] Build `templates/sales/goods_sold.html` — transaction history list view
- [ ] Build Transaction Detail Flowbite modal — shows COGS (red), Revenue (white), GP (green), Margin
- [ ] Build Credit Aging display (0–15 days, 16–30 days, 31+ days)
- [ ] `CreditLedger` expansion: add `running_balance`, `due_date`, `status` (Current/Due/Deducted)

---

## 🟡 Phase 3 — Inventory & Operations (v3.6)

### v3.6 — Inventory Integrity *(Deep Stocking, Deeper)*
> *No more gaps. Every adjustment tracked. Every cost validated.*

- [ ] Build Inventory Adjust modal — writes to both `BranchStock` and `StockAuditLog`
- [ ] Build Inventory History Log view per product
- [ ] Ensure `cost_price` (unit_cost) is required + validated on every stock batch
- [ ] `StockAuditLog` expansion: add `qty_before`, `qty_after`, `log_type` choices (Sale/Adjust/Void/Transfer/Recount)

---

## 🟡 Phase 4 — UI Component & Theming (v3.7 – v3.8)

### v3.7 — Component Compaction *(Making Her Tighter)*
> *Compact tables. 2-step confirm modals. POS layout actually matches the prototype.*

- [ ] Swap glass-card tables for compact Navy-header / alternating-row style
- [ ] Implement 2-Step "Review → Confirm" Flowbite modal for checkout + shift close
- [ ] Apply 3-panel POS layout to `terminal.html` (Product Grid | Cart | Payment)

### v3.8 — Theming Matrix *(The Wardrobe)*
> *We keep the Glassmorphism. We just expand her wardrobe with Navy/Purple POS accents.*

- [ ] Map prototype colors into `tailwind.config.js` as named tokens:
  - `pos-navy-dark: #1a3a5c` → used in POS table headers (Dusk/Midnight themes)
  - `pos-navy-mid: #2c4a6e` → panel subheaders, Dusk-specific
  - `pos-purple: #6a1b9a` → Credit sales accent
- [ ] Keep `.glass-card`, ambient lights, blur — non-negotiable
- [ ] Explore Material Design overlays: floating labels, ripple on buttons, elevation shadows alongside glassmorphism

---

## 🟢 Phase 5 — Hardware & Edge Cases (v3.9)

### v3.9 — Endgame *(The Finishing Move)*
> *Print the receipt. Refresh the dashboard. Audit everything.*

- [ ] Wire `window.print()` to Transaction Detail modal for receipt output
- [ ] Dashboard AJAX 60s auto-refresh (setInterval + fetch endpoint)
- [ ] Electron `BrowserWindow` config: verify `minWidth=1280`, `webContents.print()` works
- [ ] Full role-based hiding audit: buttons omitted entirely — not just disabled

---

## 📋 Commit Log

| Commit | Phase | Description |
|---|---|---|
| `dd3b9c9` | v3.0 | Core Foundation — Credit Limit, Variance Status, Session Code, Peso Formatters |
| `bd073c4` | v3.1–3.2 | POS Guards + Valuting — dynamic credit limit, variance_notes, session_code in API |

---

> *Built with ☕, suppressed anxiety, and zero regrets.*
> **MoneyShot — Every sale. Right on target. Every. Single. Time.**
