# POINT OF SALE SYSTEM

## Simplified Implementation Plan

---

# 1. PROJECT SCOPE

The Point of Sale (POS) System is a **desktop-based transaction processing system** designed to manage retail sales, employee credit purchases, inventory, and store-level financial summaries.

The system supports **multiple stores**. It begins with **two stores** but is designed to **scale to additional stores in the future**.

### Store Operation Rules

1. Each store operates **independently**.
2. Employees may be **assigned to one or more stores**.
3. During login, the employee operates under **one active store context**.
4. **Cross‑store data viewing is strictly prohibited**.
5. All transactions, inventory records, and reports operate only within the **active store**.

### Core System Modules

1. Cash Sales
2. Credit Sales (₱1,500 limit evaluated every 15 days)
3. Inventory Management
4. Employee Management
5. Goods Sold Tracking
6. Financial Statements
7. Cash Valuting and Beginning Balance

### System Characteristics

- Desktop application
- Offline capable
- Deterministic rule‑based logic
- No AI or automation components
- Uses strict database transaction control

---

# 2. SYSTEM ARCHITECTURE

The system follows a **layered architecture** to separate interface, logic, and data processing.

### Layers

1. **Presentation Layer** – Desktop UI forms
2. **Business Logic Layer** – validation and transaction rules
3. **Data Access Layer** – database operations
4. **Database Layer** – persistent storage

### Architectural Rules

1. UI must **not contain business rules**.
2. All validations are executed in the **Business Logic Layer**.
3. Store filtering is enforced through the **active store_id**.

---

# 3. DATABASE STRUCTURE

### Core Tables

- Stores
- Employees
- EmployeeStoreAssignments
- Customers
- Products
- InventoryHistory
- SalesHeader
- SalesDetails
- CreditLedger
- Payments
- AuditTrail
- CashSessions

### Store Isolation

1. Operational tables include a **store_id** field.
2. All queries must filter using **store_id**.
3. Users only retrieve records belonging to the **active store**.

### Data Constraints

1. quantity_on_hand ≥ 0
2. credit_limit ≥ 0
3. current_balance ≥ 0
4. total_amount ≥ 0
5. Foreign key constraints enabled
6. Financial fields cannot be NULL

---

# 4. SALES TRANSACTION FLOW

Every sale is executed inside a **database transaction** to guarantee data integrity.

### Transaction Process

BEGIN TRANSACTION

1. Insert **SalesHeader** (includes store_id)
2. Insert **SalesDetails**
3. Deduct product quantity from inventory
4. Update customer balance if the sale is credit
5. Insert record into **CreditLedger** if applicable

COMMIT

If any step fails, the system performs **ROLLBACK**.

---

# 5. CREDIT SALES CONTROL

Employee credit purchases follow strict validation rules.

### Credit Rules

1. Maximum running balance: **₱1,500**.
2. Credit purchases have **no cooldown**.
3. If current_balance ≥ ₱1,500 → credit purchase blocked.
4. If current_balance + purchase > ₱1,500 → transaction blocked.

### Approved Credit Flow

1. Sale is recorded.
2. Amount is added to **current_balance**.
3. Entry is created in **CreditLedger**.

### Payroll Review

Credit balances are evaluated every **15 days**.

1. Outstanding balances are marked **Due**.
2. Unpaid balances are **flagged for salary deduction**.
3. Salary deductions are recorded in the **Payments table**.
4. Remaining balances **carry over to the next payroll cycle**.

---

# 6. INVENTORY CONTROL

Inventory validation prevents incorrect stock movement.

### Pre‑Sale Validation

1. System checks if available stock ≥ requested quantity.
2. Stock records are locked during the transaction.

### Protection Rules

- Negative stock is not allowed
- Zero‑price sales are blocked
- All adjustments are logged in **InventoryHistory**

Inventory records are maintained **per store**.

---

# 7. ROLE‑BASED ACCESS CONTROL

System access is controlled through defined employee roles.

### Roles

**Admin**

- Full system access
- Employee management
- Financial reporting

**Manager**

- Inventory management
- Sales monitoring
- Report viewing

**Cashier**

- Sales processing only
- Cannot modify inventory
- Cannot access financial reports

### Store Access Rules

1. Employees may have **multiple store assignments**.
2. Each login session uses **one active store**.
3. All queries filter using the **active store_id**.
4. Employees cannot access stores outside their **assigned stores**.
5. System modules display **data only from the active store**.

### Security Controls

1. Role validation during login
2. Store assignment verification
3. Permission checks before module access
4. Activity logging in **AuditTrail**

---

# 8. FINANCIAL REPORTING

The system generates simplified financial summaries **per store**.

### Income Statement

Revenue

= SUM(SalesHeader.total_amount)

COGS

= SUM(SalesDetails.quantity × Products.cost_price)

Gross Profit

= Revenue − COGS

### Balance Snapshot

Assets

- Cash from cash sales
- Accounts receivable
- Inventory value

Liabilities

- Outstanding credit balances

### Aging Categories

1. 0–15 days
2. 16–30 days
3. 31+ days

---

# 9. CASH VALUTING AND BEGINNING BALANCE

This module controls **cash accountability per register session**.

### Beginning Balance

1. Employee logs into the POS.
2. If no active session exists, the system requests an **opening cash amount**.
3. Cashier enters the physical cash counted in the drawer.
4. System records this as the **Opening Balance**.
5. The cash session becomes active.

### CashSessions Table Records

- session_id
- employee_id
- store_id
- opening_balance
- opening_time
- terminal_id

### Cash Valuting (Closing)

1. Cashier selects **Close Session**.
2. System calculates **Expected Cash**.
3. Cashier performs a physical cash count.
4. Actual cash value is entered.
5. System compares expected and actual values.

### Cash Formula

Expected Cash = Opening Balance + Cash Sales

Difference = Actual Cash − Expected Cash

### Possible Results

1. Balanced
2. Cash Shortage
3. Cash Overage

All variances are recorded for audit review.

---

# 10. TESTING REQUIREMENTS

### Functional Tests

1. Credit limit enforcement
2. Multiple credit purchase handling
3. Zero‑stock transaction blocking
4. Partial payment validation
5. Role restriction verification
6. Transaction rollback validation
7. Inventory deduction accuracy
8. Financial report calculations
9. Cash session opening validation
10. Cash variance detection

### Data Integrity Tests

- No negative balances
- No orphaned foreign keys
- No duplicate transaction IDs

---

# 11. DEPLOYMENT PLAN

### Deployment Steps

1. Install the local database
2. Apply database schema
3. Load seed data
4. Configure application connection string
5. Enable scheduled database backups

---

# 12. SYSTEM PRINCIPLES

1. All transactions must pass validation rules.
2. Credit balances cannot exceed the defined limit.
3. Inventory levels cannot become negative.
4. Financial reports use only verified transaction data.
5. The UI cannot directly manipulate database tables.
6. Store data must remain isolated.
7. All critical operations must be logged.
8. Financial adjustments must always produce an audit record.

