# Implementation Plan: Beta 1.9 — "Safe Words & The Climax"

This phase focuses on financial integrity, vault accountability, and comprehensive periodic reporting. We will re-introduce the vault models, bridge them to the shift flow, and build a robust reporting engine.

> [!NOTE]
> **Reverification Findings (2026-03-13)**:
> - `vault_manage.html` and `shift_manage.html` templates **already exist** with full UI.
> - Terminal "Blackout Overlay" for inactive shifts is **already implemented** in `terminal.html`.
> - `BranchVault` and `VaultTransaction` were **removed** in migration 0004 — need fresh re-creation.
> - No existing views or URL routes for vault/shift management pages.

## Proposed Changes

### [Sales App]

#### [MODIFY] [models.py](file:///c:/Users/franc/Documents/TestPOS-1.0/sales/models.py)
*   **RE-CREATE** `BranchVault` model (OneToOne with `Branch`, tracks `balance` and `last_updated`).
*   **RE-CREATE** `VaultTransaction` model (ForeignKey to `BranchVault`, Deposit/Withdrawal with `reason`, `user`, `timestamp`).

#### [MODIFY] [views.py](file:///c:/Users/franc/Documents/TestPOS-1.0/sales/views.py)
*   **NEW** `vault_manage`: Renders `vault_manage.html` with vault balance and transaction history. Restricted to Admin/Accounting.
*   **NEW** `vault_transaction`: Handles POST for manual deposits/withdrawals. Updates vault balance atomically.
*   **MODIFY** `shift_end`: After closing a shift, auto-create a `VaultTransaction` (deposit) for the `actual_cash` amount.
*   **NEW** `shift_manage`: Renders `shift_manage.html` with active shift status and past shift history. Restricted to Cashier/Manager/Admin.
*   **NEW** `periodic_reports`: Aggregation view for Daily, Weekly, 15-day, Monthly, Annual periods. Restricted to Accounting/Admin.

#### [MODIFY] [urls.py](file:///c:/Users/franc/Documents/TestPOS-1.0/sales/urls.py)
*   Add: `vault/` → `vault_manage`
*   Add: `vault/transaction/` → `vault_transaction`
*   Add: `shift/manage/` → `shift_manage`
*   Add: `reports/` → `periodic_reports`

### [Templates]

#### [MODIFY] [base.html](file:///c:/Users/franc/Documents/TestPOS-1.0/templates/base.html)
*   Add "Shift Management" link for Cashier/Manager/Admin roles.
*   Add "Vault Management" link for Accounting/Admin roles.
*   Add "Reports" link for Accounting/Admin roles.

#### ~~[MODIFY] terminal.html~~ — **SKIP** (Blackout overlay already implemented)

### [NEW] Reports Template

#### [NEW] [reports/periodic.html](file:///c:/Users/franc/Documents/TestPOS-1.0/templates/reports/periodic.html)
*   Period selector (Daily/Weekly/15-day/Monthly/Annual).
*   Aggregated stats: Total Revenue, Total Orders, Avg Order Value, Void Count.
*   Tabular breakdown per day/period.

## Verification Plan

### Automated Tests
*   `manage.py check`: Zero system issues.
*   `manage.py test sales`: Vault creation and transaction integrity.

### Browser Verification
*   Login as Cashier → Start shift → Make sales → End shift → Verify vault deposit auto-created.
*   Login as Accountant → Open Vault Management → Verify balance and transaction log.
*   Login as Accountant → Open Reports → Select "Weekly" → Verify totals match.
*   Login as Cashier → Verify Vault is NOT visible in sidebar.
