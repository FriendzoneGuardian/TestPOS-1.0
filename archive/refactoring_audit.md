# Comprehensive Refactoring Audit — "The Purge"

> [!IMPORTANT]
> This document catalogs every confirmed defect found across the entire Django POS migration. Each fix is categorized by severity and grouped by layer (Backend → Templates → UI/UX).

---

## 🔴 Critical Fixes (Broken Functionality)

### C1. Sidebar uses `user.is_admin` as property, but it's a method
**File:** [base.html](file:///c:/Users/franc/Documents/TestPOS-1.0/templates/base.html#L69-L84)
**Bug:** `{% if user.is_admin %}` works by accident in Django templates (they call callables), but `{% if user.is_admin or user.is_manager %}` (line 75) evaluates the **method object** as truthy, not the result. This means **every authenticated user** sees the Manager Dashboard and User Management links regardless of role.
**Fix:** Django templates auto-call callables, so `user.is_admin` already calls `is_admin()`. However, the `or` condition `user.is_admin or user.is_manager` is correct in Django templates. But `user.is_accounting` (line 84) is also the method — which is fine. **Actual Issue:** Line 75 says `is_admin or is_manager` but `is_manager()` already returns True for admins, so the `is_admin or` part is redundant. The real bug is that `is_manager` returns True for admins, meaning Managers AND Admins see the sidebar links. This is correct behavior. **Verdict: Not a bug, but redundant.**

**ACTUAL BUG on Line 69:** `{% if user.is_admin %}` for "Django Admin (Sudo)" — this should have an additional check: only superusers or admins should see this. Currently the check works for role='admin', but `is_admin` is a method, and Django templates DO call it. ✅ This is fine.

**REVISED: The REAL sidebar bug** is that a `manager` role user will see "POS Terminal" in the sidebar (line 90-94: `user.role != 'accounting'`), but clicking it gives a **403 Forbidden** because `terminal` view only allows `admin` and `cashier`. This is a confusing dead link.

### C2. Bell icon visibility check is wrong (Django template `in` operator)
**File:** [base.html](file:///c:/Users/franc/Documents/TestPOS-1.0/templates/base.html#L106)
**Bug:** `{% if user.role in 'admin,manager' %}` — Django's template `in` operator treats `'admin,manager'` as a **string**, checking if `user.role` is a **substring** of `"admin,manager"`. This happens to work for `admin` and `manager`, but would also match `"in"`, `"min"`, `"man"` etc. This is fragile and semantically wrong.
**Fix:** Use a proper list: `{% if user.role == 'admin' or user.role == 'manager' %}`

### C3. `update_theme` view is missing `@require_POST`
**File:** [views.py](file:///c:/Users/franc/Documents/TestPOS-1.0/core/views.py#L82)
**Bug:** The view manually checks `if request.method == 'POST'` but doesn't use the decorator. A GET request returns a 400 JSON, but the endpoint should properly reject non-POST methods with 405.
**Fix:** Add `@require_POST` decorator.

### C4. Duplicate import in `sales/views.py`
**File:** [sales/views.py](file:///c:/Users/franc/Documents/TestPOS-1.0/sales/views.py#L5-L6)
**Bug:** `from django.utils import timezone` is imported twice.
**Fix:** Remove the duplicate line 6.

### C5. Inventory `dashboard.html` uses wrong `in` check for role
**File:** [inventory/dashboard.html](file:///c:/Users/franc/Documents/TestPOS-1.0/inventory/templates/inventory/dashboard.html#L11)
**Bug:** Same fragile substring check: `{% if user.role in 'admin,manager' %}`.
**Fix:** Same as C2.

### C6. Empty `:root {}` ruleset in `base.html` `<style>` block
**File:** [base.html](file:///c:/Users/franc/Documents/TestPOS-1.0/templates/base.html#L15-L17)
**Bug:** `:root { /* comment */ }` creates a CSS lint warning for empty rulesets.
**Fix:** Remove the empty `:root {}` block entirely.

---

## 🟡 Medium Fixes (Logic / Consistency)

### M1. Sidebar shows POS Terminal link to `manager` role but view returns 403
**File:** [base.html](file:///c:/Users/franc/Documents/TestPOS-1.0/templates/base.html#L90-L94)
**Bug:** The condition `user.role != 'accounting'` allows managers to see "POS Terminal" link. But `sales/views.py` restricts access to `['admin', 'cashier']` only.
**Fix:** Change condition to `{% if user.role == 'admin' or user.role == 'cashier' %}`.

### M2. Sidebar doesn't show Inventory Dashboard link
**File:** [base.html](file:///c:/Users/franc/Documents/TestPOS-1.0/templates/base.html#L68-L95)
**Bug:** The Inventory Dashboard is accessible via `/inventory/` but has no sidebar link. Admin, Manager, and Accounting can access it via the bell dropdown's "View Inventory Dashboard" text, but that's hidden and non-discoverable.
**Fix:** Add an "Inventory" sidebar link for admin, manager, and accounting roles.

### M3. Admin role `home` redirect sends admin to POS Terminal
**File:** [views.py](file:///c:/Users/franc/Documents/TestPOS-1.0/core/views.py#L13-L21)
**Bug:** In the `home()` view, an admin falls through `accounting` check, then `is_manager()` which returns True for admins, so admins land on the Manager Dashboard. This is **correct** behavior per the original plan but worth documenting. However, a `cashier` user falls through to `sales:terminal` which is correct.
**Verdict:** Not a bug; already correct.

### M4. `user_save` view doesn't handle FormData checkbox fields correctly
**File:** [views.py](file:///c:/Users/franc/Documents/TestPOS-1.0/core/views.py#L73)
**Bug:** HTML checkboxes don't send a value when unchecked. The `UserManagementForm` expects `is_active` and `is_active_account` fields, but unchecked checkboxes won't be present in `request.POST`, causing them to always save as `False` when editing.
**Fix:** The form POST logic in `user_management.html` should explicitly convert checkbox states, or the Django form should handle this with `required=False`. The `ModelForm` with `BooleanField` treats missing = False, which IS correct for unchecking. ✅ This works correctly for Django forms. **Verdict: Not a bug.**

### M5. `user_management.html` JS hardcodes URL path instead of using Django URL tag
**File:** [user_management.html](file:///c:/Users/franc/Documents/TestPOS-1.0/core/templates/core/user_management.html#L228)
**Bug:** `url = `/users/save/${userId}/`;` — hardcoded URL path. If URL routing changes, this breaks silently.
**Fix:** Use a template-driven URL pattern.

### M6. `inventory_alerts_processor` runs on every request for eligible roles
**File:** [context_processors.py](file:///c:/Users/franc/Documents/TestPOS-1.0/core/context_processors.py#L17-L43)
**Bug:** Queries BranchStock on **every page load** for admin/manager users. Not a bug per se, but a performance concern.
**Fix:** Add caching or limit to 5 results. Already limited to 10, which is acceptable for now.

### M7. Accounting dashboard SVGs missing explicit dimensions (same as manager icon bug)
**File:** [accounting.html](file:///c:/Users/franc/Documents/TestPOS-1.0/core/templates/core/dashboards/accounting.html#L47-L48)
**Bug:** The "Audit Logs" empty-state SVG (line 48) has `class="w-12 h-12"` but no native `width`/`height` attributes, same issue that caused the Manager Dashboard SVG to blow up.
**Fix:** Add `width="48" height="48"` as native SVG fallback attributes.

---

## 🔵 UI/UX Fixes (Visual Polish & HCI)

### U1. Login page uses wrong content block
**File:** [login.html](file:///c:/Users/franc/Documents/TestPOS-1.0/templates/core/login.html#L6)
**Assessment:** Uses `{% block content_unauth %}` which is correct since `base.html` line 209 renders this for unauthenticated users. ✅ Correct.

### U2. "Profile Settings" link in BBQ menu is a dead `#` link
**File:** [base.html](file:///c:/Users/franc/Documents/TestPOS-1.0/templates/base.html#L171)
**Bug:** `href="#"` goes nowhere. Should either be removed or stubbed with a tooltip.
**Fix:** Replace with a disabled state or implement later.

### U3. POS Terminal "Lock Terminal" button has no implementation
**File:** [terminal.html](file:///c:/Users/franc/Documents/TestPOS-1.0/templates/pos/terminal.html#L26-L28)
**Bug:** `onclick="lockTerminal()"` but no `lockTerminal()` function exists in the JS.
**Fix:** Add stub function to prevent console errors.

### U4. All dashboard SVGs may have sizing issues without Tailwind JIT
**Assessment:** Since we're using precompiled CSS (`output.css`), Tailwind utility classes like `w-12 h-12` work IF they were included during compilation. If not, SVGs collapse or explode. Adding native `width`/`height` to ALL decorative SVGs as a safety net is prudent.

---

## Proposed Fix Order

| # | Fix | File(s) | Risk |
|---|-----|---------|------|
| 1 | C2,C5: Fix all `in 'admin,manager'` checks | `base.html`, `inventory/dashboard.html` | Low |
| 2 | C4: Remove duplicate import | `sales/views.py` | None |
| 3 | C6: Remove empty `:root {}` | `base.html` | None |
| 4 | M1: Fix POS Terminal sidebar visibility | `base.html` | Low |
| 5 | M2: Add Inventory sidebar link | `base.html` | Low |
| 6 | M5: Fix hardcoded URL in user management JS | `user_management.html` | Low |
| 7 | M7: Add SVG dimension fallbacks | `accounting.html` | None |
| 8 | U2: Stub dead Profile Settings link | `base.html` | None |
| 9 | U3: Add `lockTerminal()` stub | `terminal.html` | None |
| 10 | C3: Add `@require_POST` to `update_theme` | `core/views.py` | None |

## Verification Plan

### Automated
- `python manage.py test sales.tests` — re-run existing access control tests
- `python manage.py check` — Django system check

### Browser Agent Audit (Meticulous HCI Review)
The browser agent will be instructed to:
1. Login as each role (admin, manager, cashier, accounting)
2. Verify sidebar links match their access permissions (no 403 dead links)
3. Click EVERY button and dropdown (Bell, Burger, Add Employee, Edit, Sudo, theme switch)
4. Check for visual regressions: oversized icons, misaligned text, broken modals, unreadable text in Dawn/Light mode
5. Verify proper modal open/close behavior for User Management
6. Test POS terminal: category filters, product search, cart add/remove, checkout flow
7. Verify the Inventory Dashboard table renders with correct stock counts
