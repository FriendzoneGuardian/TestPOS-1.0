# QA Hotfix Report: Alpha 2.0.1 (Status Table)

> [!IMPORTANT]
> 11 high-severity regressions identified during Beta 2 QA.
> All resolved tasks below are **"Crushed Out"** per latest security hardening.

| ID | Bug Description | Status | Resolution / Fix Details |
|:---|:---|:---|:---|
| **BUG-01** | Low Stock Modal hidden behind dashboard | ~~**CRUSHED**~~ | Moved to `body` root; set `z-[150]`; added backdrop blur & dark overlay. |
| **BUG-02** | Add Product Feature Missing | **PENDING** | Plan: Create `add_product` view/form + modal UI in inventory. |
| **BUG-03** | UI Margins/Spacing inconsistency | **PENDING** | Plan: Normalize card/table padding and Category pill spacing (BUG-04). |
| **BUG-05** | Notification Dropdown UI Polish | **PENDING** | Plan: Add `transition-all` and shadow depth to Alerts dropdown. |
| **BUG-06** | Vault Access (Accounting ➔ Cashier) | ~~**CRUSHED**~~ | Migrated `@role_required` and sidebar guards to `admin` and `cashier`. |
| **BUG-07** | Timestamp Localization (UTC+8) | ~~**CRUSHED**~~ | Set `TIME_ZONE = 'Asia/Manila'` and `USE_TZ = True` in `settings.py`. |
| **BUG-08** | "End Shift" Button returns 403 | ~~**CRUSHED**~~ | Contextually fixed via BUG-14 architectural screen restriction. |
| **BUG-09** | Shift Lockout covers entire screen | ~~**CRUSHED**~~ | Changed `fixed inset-0` to `absolute` inside terminal content container. |
| **BUG-10** | Logout Browser Cache Leak | ~~**CRUSHED**~~ | Implemented `NoCacheMiddleware` + `Cache-Control` headers for secure exit. |
| **BUG-11** | Typing Bug (Focus Theft) | ~~**CRUSHED**~~ | Replaced native `alert()` with Toasts; added global `window.onfocus` restore. |
| **BUG-12** | Missing Shift Start/End Toasts | ~~**CRUSHED**~~ | Standardized Django messages; fixed script execution order in `base.html`. |
| **BUG-13** | Broken Navbar Dropdowns | ~~**CRUSHED**~~ | Fixed syntax error in `base.html` (naked JS code) and reloaded Flowbite.js. |
| **BUG-14** | Admin Access to Cashier Shifts | ~~**CRUSHED**~~ | Locked `shift_manage` UI/Backend to `role == 'cashier'` strictly. |

---

## File Change Manifest (Cumulative)

| File Path | Modification Summary | Status |
|:---|:---|:---|
| `tp_django/settings.py` | Timezone (Manila), Session TTL (300s), Cache Middleware | ✅ |
| `templates/base.html` | Z-Index Hierarchy, showToast/Focus logic, Sidebar RBAC | ✅ |
| `sales/views.py` | RBAC updates for Vault/Shifts, role-aware redirects | ✅ |
| `core/middleware.py` | [NEW] `NoCacheMiddleware` implementation | ✅ |
| `templates/pos/terminal.html` | Overlay scoping, Z-Index standardization | ✅ |

---

## Final Verification Checklist
- [x] Login as **Cashier** ➔ Verify **Vault** appears, **Shift Manage** appears.
- [x] Login as **Admin** ➔ Verify **Vault** appears, **Shift Manage** is HIDDEN.
- [x] Change Theme (Dawn/Dusk) ➔ Verify Navbar dropdowns and switchers work.
- [x] Logout ➔ Click "Back" ➔ Verify user is NOT sent back to dashboard.
- [x] Verify timestamps in console/logs show local UTC+8 time.
