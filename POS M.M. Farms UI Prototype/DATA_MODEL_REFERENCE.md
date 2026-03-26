# Data Model Reference
## Source: `src/app/data/mockData.ts`

This document translates the TypeScript interfaces from the prototype into Django ORM model definitions to use as a design reference.

---

## Models

### `Store`
```python
class Store(models.Model):
    id = models.CharField(max_length=20, primary_key=True)  # e.g. "STORE-01"
    name = models.CharField(max_length=100)                 # e.g. "Main Branch"
    location = models.CharField(max_length=100)             # e.g. "Laguna"
    terminal_id = models.CharField(max_length=50)           # e.g. "POS-MAIN-01"
```

---

### `Employee` (extends `AbstractUser` or linked via OneToOne)
```python
ROLE_CHOICES = [('Admin', 'Admin'), ('Manager', 'Manager'), ('Cashier', 'Cashier')]
STATUS_CHOICES = [('Active', 'Active'), ('Inactive', 'Inactive')]

class Employee(models.Model):
    id = models.CharField(max_length=20, primary_key=True)  # e.g. "EMP-001"
    full_name = models.CharField(max_length=150)
    username = models.CharField(max_length=50, unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    stores = models.ManyToManyField(Store)                  # multi-store support
    created_at = models.DateField()
```

---

### `Product`
```python
class Product(models.Model):
    id = models.CharField(max_length=20, primary_key=True)  # e.g. "PRD-S1-001"
    store = models.ForeignKey(Store, on_delete=models.CASCADE)
    name = models.CharField(max_length=150)
    category = models.CharField(max_length=50)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2)
    qty = models.IntegerField(default=0)
    reorder_level = models.IntegerField(default=10)
    status = models.CharField(max_length=10, choices=[('Active','Active'),('Inactive','Inactive')])
```

> **Note:** `cost_price` is used for COGS calculation. Never skip this field.

---

### `Transaction`
```python
TYPE_CHOICES = [('Cash', 'Cash'), ('Credit', 'Credit')]

class Transaction(models.Model):
    id = models.CharField(max_length=40, primary_key=True)  # e.g. "TXN-S1-20260303-001"
    store = models.ForeignKey(Store, on_delete=models.PROTECT)
    date = models.DateField()
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    employee = models.ForeignKey(Employee, on_delete=models.PROTECT, related_name='processed_txns')
    credit_employee = models.ForeignKey(Employee, on_delete=models.PROTECT,
                                        null=True, blank=True, related_name='credit_txns')
    item_count = models.IntegerField(default=0)
    status = models.CharField(max_length=10, choices=[('Completed','Completed'),('Voided','Voided')])
```

---

### `TransactionItem`
```python
class TransactionItem(models.Model):
    transaction = models.ForeignKey(Transaction, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    qty = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)  # price at time of sale
    cost_price = models.DecimalField(max_digits=10, decimal_places=2)  # cost at time of sale (COGS)
```

> **Important:** Always snapshot `unit_price` and `cost_price` at time of sale — never recalculate from current product price.

---

### `CreditLedgerEntry`
```python
ENTRY_TYPE = [('Purchase', 'Purchase'), ('Payment', 'Payment')]
ENTRY_STATUS = [('Current', 'Current'), ('Due', 'Due'), ('Deducted', 'Deducted')]

class CreditLedgerEntry(models.Model):
    store = models.ForeignKey(Store, on_delete=models.PROTECT)
    employee = models.ForeignKey(Employee, on_delete=models.PROTECT)
    date = models.DateField()
    transaction = models.ForeignKey(Transaction, on_delete=models.PROTECT, null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    type = models.CharField(max_length=10, choices=ENTRY_TYPE)
    running_balance = models.DecimalField(max_digits=10, decimal_places=2)
    payroll_period = models.CharField(max_length=50)         # e.g. "2026-03-01 to 2026-03-15"
    due_date = models.DateField()
    status = models.CharField(max_length=10, choices=ENTRY_STATUS)
    notes = models.TextField(blank=True)
```

> **Credit Limit:** `CREDIT_LIMIT = 1500` — hardcode in `settings.py` as `EMPLOYEE_CREDIT_LIMIT = 1500` or store in a `SystemConfig` table.

---

### `CashSession`
```python
VARIANCE_STATUS = [('Balanced','Balanced'),('Shortage','Shortage'),('Overage','Overage')]

class CashSession(models.Model):
    id = models.CharField(max_length=40, primary_key=True)
    store = models.ForeignKey(Store, on_delete=models.PROTECT)
    employee = models.ForeignKey(Employee, on_delete=models.PROTECT)
    terminal_id = models.CharField(max_length=50)
    opening_balance = models.DecimalField(max_digits=10, decimal_places=2)
    opening_time = models.DateTimeField()
    closing_balance = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    closing_time = models.DateTimeField(null=True, blank=True)
    cash_sales_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    expected_cash = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    actual_cash = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    variance = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    variance_status = models.CharField(max_length=10, choices=VARIANCE_STATUS, blank=True)
    status = models.CharField(max_length=10, choices=[('Active','Active'),('Closed','Closed')])

    def close(self, actual_cash):
        self.expected_cash = self.opening_balance + self.cash_sales_total
        self.actual_cash = actual_cash
        self.variance = actual_cash - self.expected_cash
        if abs(self.variance) < 0.01:
            self.variance_status = 'Balanced'
        elif self.variance < 0:
            self.variance_status = 'Shortage'
        else:
            self.variance_status = 'Overage'
        self.status = 'Closed'
        self.closing_time = now()
        self.save()
```

---

### `InventoryLog`
```python
LOG_TYPE = [('Restock','Restock'),('Sale','Sale'),('Adjustment','Adjustment'),
            ('Transfer-In','Transfer-In'),('Transfer-Out','Transfer-Out')]

class InventoryLog(models.Model):
    store = models.ForeignKey(Store, on_delete=models.PROTECT)
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    date = models.DateField(auto_now_add=True)
    type = models.CharField(max_length=20, choices=LOG_TYPE)
    qty_change = models.IntegerField()       # negative for sales/adjustments
    qty_before = models.IntegerField()
    qty_after = models.IntegerField()
    employee = models.ForeignKey(Employee, on_delete=models.PROTECT)
    notes = models.TextField(blank=True)
```

---

## Sample Data Summary (for fixtures / seeding)

| Entity | Count |
|---|---|
| Stores | 2 (Main Branch — Laguna, Branch 2 — Cavite) |
| Employees | 7 (1 Admin, 2 Managers, 4 Cashiers) |
| Products (Store 1) | 15 |
| Products (Store 2) | 12 |
| Transactions | 14 total |
| Credit Ledger Entries | 7 entries across 3 employees |
| Cash Sessions | 7 sessions across 2 stores |
| Inventory Log Entries | 8 |

> See `src/app/data/mockData.ts` for the full raw data to use as **Django fixture seed data**.
