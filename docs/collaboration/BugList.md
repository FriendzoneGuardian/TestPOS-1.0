# QA Hotfix Report: Alpha 2.0.1 (Status Table)

> [!IMPORTANT]
> 11 high-severity regressions identified during Beta 2 QA.
> All resolved tasks below are **"Crushed Out"** per latest security hardening.

| ID | Bug Description | Status | Resolution / Fix Details |
|:---|:---|:---|:---|
| **BUG-01** | Low Stock & End Day Modal Persistence | ~~**CRUSHED**~~ | Refactored to static root structures; set `z-[160]`; added backdrop blur & scale animations. |
| **BUG-02** | Add Product Feature Missing | ~~**CRUSHED**~~ | Created `ProductForm`, `add/edit/delete` views, and premium UI. |
| **BUG-03** | UI Margins/Spacing inconsistency | ~~**CRUSHED**~~ | Normalized card/table padding and Category pill spacing (BUG-04). |
| **BUG-05** | Notification Dropdown UI Polish | ~~**CRUSHED**~~ | Added `transition-all`, `shadow-2xl`, and enhanced modal buttons. |
| **BUG-06** | Vault Access (Accounting ➔ Cashier) | ~~**CRUSHED**~~ | Migrated `@role_required` and sidebar guards to `admin` and `cashier`. |
| **BUG-07** | Timestamp Localization (UTC+8) | ~~**CRUSHED**~~ | Set `TIME_ZONE = 'Asia/Manila'` and `USE_TZ = True` in `settings.py`. |
| **BUG-08** | "End Shift" Button returns 403 | ~~**CRUSHED**~~ | Contextually fixed via BUG-14 architectural screen restriction. |
| **BUG-09** | Shift Lockout covers entire screen | ~~**CRUSHED**~~ | Changed `fixed inset-0` to `absolute` inside terminal content container. |
| **BUG-10** | Logout Browser Cache Leak | ~~**CRUSHED**~~ | Implemented `NoCacheMiddleware` + `Cache-Control` headers for secure exit. |
| **BUG-11** | Typing Bug (Focus Theft) | ~~**CRUSHED**~~ | Replaced native `alert()` with Toasts; added global `window.onfocus` restore. |
| **BUG-12** | Missing Shift Start/End Toasts | ~~**CRUSHED**~~ | Standardized Django messages; fixed script execution order in `base.html`. |
| **BUG-13** | Broken Navbar Dropdowns | ~~**CRUSHED**~~ | Fixed syntax error in `base.html` (naked JS code) and reloaded Flowbite.js. |
| **BUG-14** | Admin Access to Cashier Shifts | ~~**CRUSHED**~~ | Locked `shift_manage` UI/Backend to `role == 'cashier'` strictly. |
| **BUG-15** | Dash Crash & Invisible Inputs | ~~**CRUSHED**~~ | Fixed missing `timezone` import; replaced `bg-gray-50` with `bg-surface-900`. |
| **BUG-17** | Inventory Dashboard Syntax Error | ~~**CRUSHED**~~ | Added missing `{% load static %}` to `dashboard.html` to enable product icons. |
| **POLISH** | **Inventory UI & Routing** | ~~Missing active states & fields.~~ | **CRUSHED** | Added Price/Status columns, dynamic sidebar active JS, and Search/Filters. |

![Inventory Dashboard](/c:/Users/franc/.gemini/antigravity/brain/34f8acdd-73e9-4495-8073-030010908933/inventory_dashboard_full_1773639320081.png)

## 🧪 Verification Results
The fix was validated through automated browser testing. Both the POS timer and the Inventory Dashboard are now 100% functional.

````carousel
![Countdown Start](/c:/Users/franc/.gemini/antigravity/brain/34f8acdd-73e9-4495-8073-030010908933/countdown_start_1773456044130.png)
<!-- slide -->
![Countdown 4s](/c:/Users/franc/.gemini/antigravity/brain/34f8acdd-73e9-4495-8073-030010908933/countdown_4s_v2_1773456271263.png)
<!-- slide -->
![Countdown 3s](/c:/Users/franc/.gemini/antigravity/brain/34f8acdd-73e9-4495-8073-030010908933/countdown_3s_v2_1773456273906.png)
<!-- slide -->
![Countdown 2s](/c:/Users/franc/.gemini/antigravity/brain/34f8acdd-73e9-4495-8073-030010908933/countdown_2s_v2_1773456276529.png)
<!-- slide -->
![Countdown 1s](/c:/Users/franc/.gemini/antigravity/brain/34f8acdd-73e9-4495-8073-030010908933/countdown_1s_v2_1773456279299.png)
````

### 🎥 Full Interaction Recording
The following recording shows the complete flow from adding an item to the finalized sale with the working countdown.

![Transaction Flow](/c:/Users/franc/.gemini/antigravity/brain/34f8acdd-73e9-4495-8073-030010908933/pos_timer_retry_verification_1773455627601.webp)

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
