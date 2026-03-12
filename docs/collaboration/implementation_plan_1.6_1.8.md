# Implementation Plan: Beta 1.6, 1.7 & 1.8 (Operations & Accountability)

## 1. Goal Description
Transition from basic project scaffolding to a hardened operational state. This involves moving management functions in-app, implementing inventory re-order logic with high-fidelity alerts, and establishing strict shift-based accountability with advanced payment logic.

## 2. Proposed Changes

### Beta 1.6 — "The Velvet Rope" (User Management & Overrides)
**Goal:** Build a custom, role-protected interface for managing employees and system overrides, featuring specialized dashboards and a "BBQ Stick" (Burger) theme menu.

#### [Role-Based Dashboard & CRUD Matrix]
| Role | Dashboard Focus | CRUD Permissions |
| :--- | :--- | :--- |
| **Admin** | **Total Visibility** | Full CRUD on Users, Branches, Products, Sales, Voids, and Logs. |
| **Accounting** | **Money & Flow** | READ ONLY: Sales, Voids, Loans, Stock History. Dashboard: Cash/Stock Flow. |
| **Manager** | **Stock & Sales** | CRUD: Products/Inventory. VIEW: Branch Sales/Staff. Shift Mgmt. |
| **Cashier** | **POS Terminal** | CREATE: Sales. READ: Products. Dashboard: POS Homepage. |

#### [NEW] `templates/core/user_management.html`
- A responsive dashboard listing all users with inline status toggles.
- Role/Branch assignment forms.

#### [MODIFY] `templates/base.html` (The "BBQ Stick")
- Implement the **Burger Menu (BBQ Stick Icon)** near the user profile (Top-Right).
- Dropdown contains: Theme Switcher (Dawn/Dusk/Midnight) and Profile Settings.
- **Note**: The **Logout** button remains outside the menu and is **always visible** near the user interface.

#### [MODIFY] `core/views.py` & `sales/views.py`
- Update redirect logic: Cashiers land on `/pos/terminal/`, others land on specialized dashboards.

---

### Beta 1.7 — "Deep Stocking" (Inventory & Re-order Alerts)
**Goal:** Implementation of "Re-order Level" logic with Modal and Bell-based notification systems.

- #### [MODIFY] `inventory/models.py`
    - Add `reorder_level` (PositiveIntegerField) to `Product`.
- #### [NEW] UI Notification System (Top Right)
    - **The Bell Icon**: Shows count of items at/below reorder level.
    - **Modal Alert**: Auto-triggers on Manager/Admin login if critical stock is detected.
- #### [Internal Access Rules]
    - **Cashiers**: Alerts DISABLED.
    - **Managers**: Stock & Cash alerts.
    - **Accounting**: Reports (Paper Trails) only.
    - **Admin**: Full access.

---

### Beta 1.8 — "Bare Assets" (Audit & Payment Integrity)
**Goal:** Implementation of Shift-locking, detailed Voids, and "Payment Tendered" logic.

- #### [MODIFY] Sales Logic (Checkout)
    - **Payment Tendered**: Record `amount_paid` and `change_given`.
    - **Error Trapping**: Block insufficient cash payments with a "Payment Insufficient" prompt.
    - **Alternative (Loan Fallback)**: If cash is insufficient, allow "Charging to Loan" (creating a Credit Transaction) for the missing balance (₱1,500 limit applies).
- #### [NEW] Models
    - `Shift`: Captures `starting_cash`, `end_time`, and `expected_cash_total`.
    - `VoidLog`: Detailed tracking of items (`user`, `reason`, `timestamp`).
- #### [NEW] Interceptors
    - `shift_required` decorator: Blocks terminal access if no active shift is recorded.

## 3. Verification Plan

### Automated Tests
- `payment_logic_test`: Verify `change_given` calculation and insufficient payment blocking.
- `role_access_test`: Ensure Cashiers are redirected to POS and cannot view "Money Flow" dashboards.

### Manual Verification
1. **BBQ Stick**: Toggle themes via the new Burger menu and verify persistency.
2. **Payment Trap**: Attempt to pay ₱5 for a ₱10 item; verify the "Insufficient" error and the option to "Charge to Loan".
3. **Alert Bell**: Reduce stock below reorder level as Admin and verify the Bell pulses with the correct count.
