# UI Patterns & Business Logic Guide
## For Porting to Django + Flowbite-Tailwind + Electron

This doc captures the visual patterns and business rules from the prototype that must be preserved when rebuilding in Django templates.

---

## 1. Color Palette

Use these exact hex values in your Tailwind config / Flowbite overrides:

| Token | Hex | Used For |
|---|---|---|
| `navy-dark` | `#1a3a5c` | Page headers, table headers |
| `navy-mid` | `#2c4a6e` | Panel section headers |
| `navy-light` | `#1a4a8a` | Primary action buttons (Cash Sales) |
| `purple-dark` | `#4a148c` | Credit sales headers |
| `purple-mid` | `#6a1b9a` | Credit buttons, section headers |
| `red-dark` | `#bf360c` | Low stock alerts, danger |
| `red-mid` | `#c62828` | Errors, blocked states |
| `green-dark` | `#1b5e20` | Confirm buttons border |
| `green-mid` | `#2e7d32` | Success, active sessions |
| `slate` | `#37474f` | Secondary buttons (Cash Valuting) |

```css
/* Tailwind: extend colors in tailwind.config.js */
mmfarms: {
  navy: { dark: '#1a3a5c', mid: '#2c4a6e', light: '#1a4a8a' },
  purple: { dark: '#4a148c', mid: '#6a1b9a' },
  red: { dark: '#bf360c', mid: '#c62828' },
  green: { mid: '#2e7d32' },
}
```

---

## 2. Typography System

```css
font-family: 'Segoe UI', Arial, sans-serif;   /* body text */
font-family: monospace;                         /* IDs, amounts, session codes */
font-size: 13px;   /* page title headers */
font-size: 12px;   /* table data, panel content */
font-size: 11px;   /* secondary labels, sub-text */
font-size: 10px;   /* badges, tags */
font-weight: 700;  /* column headers, totals */
font-weight: 600;  /* section headers */
```

---

## 3. Layout: 3-Panel POS Screen

The POS screens (Cash Sales and Credit Sales) use a **fixed 3-column layout**:

```
┌─────────────────────────────────────────────────────────┐
│  Page Header Bar (full width, navy-dark bg)              │
├──────────┬──────────────────────────────┬───────────────┤
│  LEFT    │  CENTER                      │  RIGHT        │
│  255px   │  flex: 1 (fills available)   │  220px        │
│ Products │  Cart Table                  │  Summary +    │
│  Panel   │  + Action Buttons            │  Payment      │
└──────────┴──────────────────────────────┴───────────────┘
```

**Django Template (Flowbite equivalent):**
```html
<div class="flex gap-2 h-full overflow-hidden p-3">
  <!-- LEFT: Product Panel -->
  <div class="w-64 shrink-0 flex flex-col bg-white border border-slate-300 overflow-hidden">
    ...
  </div>

  <!-- CENTER: Cart -->
  <div class="flex-1 flex flex-col overflow-hidden">
    ...
  </div>

  <!-- RIGHT: Summary/Payment -->
  <div class="w-56 shrink-0 flex flex-col gap-2">
    ...
  </div>
</div>
```

---

## 4. Panel Header Pattern

Every card/panel uses a consistent titled header:

```html
<!-- Section Panel -->
<div class="bg-white border border-slate-300">
  <div class="bg-[#2c4a6e] text-white px-3 py-1 text-xs font-semibold">
    Panel Title
  </div>
  <div class="p-3">
    <!-- content -->
  </div>
</div>
```

---

## 5. Data Table Pattern

```html
<table class="w-full border-collapse text-xs">
  <thead>
    <tr class="bg-[#1a3a5c] text-white">
      <th class="px-2 py-1.5 text-left border border-[#4a6a8c] font-semibold">Column</th>
      <th class="px-2 py-1.5 text-right border border-[#4a6a8c] font-semibold">Amount</th>
    </tr>
  </thead>
  <tbody>
    {% for row in rows %}
    <tr class="{% if forloop.counter|divisibleby:2 %}bg-slate-50{% else %}bg-white{% endif %}">
      <td class="px-2 py-1.5 border border-slate-200">{{ row.field }}</td>
      <td class="px-2 py-1.5 border border-slate-200 text-right font-bold">{{ row.amount }}</td>
    </tr>
    {% endfor %}
  </tbody>
</table>
```

---

## 6. Business Logic Rules

### Cash Sale Flow
```
1. Cashier must have an ACTIVE CashSession → block if not
2. Add items to cart (check qty > 0)
3. Enter amount tendered
4. Grand Total = Subtotal + VAT (12%)
5. Change = Tendered - Grand Total → block if Change < 0
6. On confirm:
   a. Create Transaction (type=Cash)
   b. Create TransactionItems
   c. Deduct qty from each Product
   d. Write InventoryLog (type=Sale)
   e. Update CashSession.cash_sales_total += Transaction.total
```

### Credit Sale Flow
```
1. Select employee from dropdown (show current balance)
2. Check: current_balance >= CREDIT_LIMIT → block entirely
3. Add items to cart
4. Grand Total = Subtotal + VAT (12%)
5. new_balance = current_balance + Grand Total
6. Check: new_balance > CREDIT_LIMIT → block with "would exceed" error
7. On confirm:
   a. Create Transaction (type=Credit, credit_employee=selected)
   b. Create TransactionItems
   c. Deduct qty from each Product
   d. Write InventoryLog (type=Sale)
   e. Create CreditLedgerEntry (type=Purchase, running_balance=new_balance)
```

### Cash Session (Valuting) Flow
```
OPEN:
  - Check: no existing Active session for this store
  - Enter opening cash amount
  - Create CashSession (status=Active, opening_balance=entered_amount)

CLOSE:
  - Count physical cash
  - expected_cash = opening_balance + cash_sales_total
  - variance = actual_cash - expected_cash
  - variance_status:
      |variance| < 0.01 → "Balanced"
      variance < 0      → "Shortage"
      variance > 0      → "Overage"
  - Update CashSession (status=Closed)
  - Display valuting report modal
```

### Inventory Reorder Alert
```
A product triggers a LOW STOCK alert when:
  product.qty <= product.reorder_level AND product.status == 'Active'

Display:
  qty == 0   → "OUT" badge (red)
  qty <= reorder_level → colored qty badge (orange)
```

---

## 7. Role-Based Access Control

Map the prototype's `currentUser.role` to Django groups:

| Prototype Role | Django Group | Permissions |
|---|---|---|
| `Admin` | `admin` | All features, all stores |
| `Manager` | `manager` | Dashboard, Inventory, Reports, Cash Sessions |
| `Cashier` | `cashier` | Cash Sales, Credit Sales, Cash Valuting only |

```python
# Django view guard example
from django.contrib.auth.decorators import user_passes_test

def is_manager_or_admin(user):
    return user.groups.filter(name__in=['admin', 'manager']).exists()

@user_passes_test(is_manager_or_admin)
def inventory_view(request):
    ...
```

```html
<!-- Template guard example -->
{% if request.user|has_group:"admin" or request.user|has_group:"manager" %}
  <a href="{% url 'inventory' %}">Inventory</a>
{% endif %}
```

---

## 8. Modal/Alert Patterns

The prototype uses `WinModal` (confirm dialog) and `WinAlert` (toast). In Django + Flowbite:

- **Confirmation Modal**: Use Flowbite `Modal` component. Always show a summary table before confirming destructive actions.
- **Alert/Toast**: Use Flowbite `Toast` or `Alert` component for inline error/warning messages.
- **Two-step pattern**: All write operations require: `[Fill form] → [Review summary modal] → [Confirm]`

---

## 9. Currency Formatting

Always format Philippine Peso amounts as:
```python
# Python
def format_peso(amount):
    return f"₱{amount:,.2f}"

# Django template filter
{{ transaction.total|floatformat:2 }}  # → extend with custom ₱ prefix filter
```

```javascript
// JS (for Electron/frontend)
const PH = (n) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
```

---

## 10. Electron Shell Notes

| Concern | Recommendation |
|---|---|
| Django server URL | Config via `settings.js` in Electron main process, inject as `window.__DJANGO_URL__` |
| Auth | Use Django session auth (cookie-based) — Electron's BrowserWindow handles cookies natively |
| Print | Use `window.print()` or Electron's `webContents.print()` for receipt/report printing |
| Offline | Ensure Django dev server starts with Electron; use `child_process.spawn` in `main.js` |
| Window Size | POS screens are designed for 1280×800 minimum; set `minWidth: 1280, minHeight: 800` in `BrowserWindow` |
