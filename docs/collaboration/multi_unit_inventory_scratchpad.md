# Technical Scratchpad: Multi-Unit Inventory Strategy
**Target Areas**: Cigarettes, Candies, and Individual-Unit items.

## 1. The Core Philosophy: "The Atom of Inventory"
To prevent "Decimal Drift" and inventory leakage, we will implement **Base-Unit Storage**.

- **Database Rule**: The `BranchStock.quantity` will ALWAYS represent the smallest possible sellable unit (The "Atom").
    - Cigarettes are stored in **Sticks**.
    - Candies are stored in **Pieces**.
    - Coffee is stored in **Sachets**.

## 2. Database Schema Revisions

### [MODIFY] `inventory.Product`
Add a field to identify what the base unit actually is for reporting.
```python
class Product(models.Model):
    # ... existing fields ...
    base_unit = models.CharField(max_length=20, default='pcs') # 'stick', 'pc', 'sachet'
```

### [NEW] `inventory.ProductUnit` (Unit Definitions)
```python
class ProductUnit(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='units')
    name = models.CharField(max_length=20)   # 'Stick', 'Pack', 'Carton'
    multiplier = models.IntegerField()        # 1, 20, 200
    price = models.FloatField()               # Set price for this config
    is_default = models.BooleanField(default=False)
    sku_extension = models.CharField(max_length=10, blank=True) # e.g., 'STK', 'PK'
```

### [MODIFY] `sales.OrderItem` (Transaction Tracking)
Must record WHICH unit was sold for accurate receipt rendering, even if stock deduction uses the multiplier.
```python
class OrderItem(models.Model):
    # ... existing fields ...
    unit = models.ForeignKey(ProductUnit, on_delete=models.SET_NULL, null=True)
    # multiplier_snapshot = models.IntegerField() # Optional: for historical audit integrity
```

## 3. The Logic Flow (Alpha 2.1.1)

### A. Inventory Deduction
Calculated as: `Quantity Sold` × `Unit Multiplier`.
- *Example*: Selling 2 Packs of Marlboro.
- *Logic*: `2 (Packs)` × `20 (Multiplier)` = `40 Sticks` deducted from `BranchStock`.

### B. Pricing & Bundling
Since a Pack (₱150) is often cheaper than 20 Sticks (₱8 × 20 = ₱160), prices are NOT calculated dynamically. They are **hard-set** in the `ProductUnit` record.

### C. The "3 for ₱10" Candy Case (Promos)
For cases where 1 Piece is ₱4 but 3 Pieces is ₱10:
- Use a **Cart-Level Interceptor** in the POS JS.
- Detect if `quantity % 3 == 0`.
- Apply a "Bundle Discount" line item to the order to adjust the total.

## 4. POS UI Requirements

- **Unit Selector Matrix**: When a product with multi-units (e.g., Cigarettes) is selected, a smaller sub-menu or pill-selector appears: `[STICK] [PACK] [CARTON]`.
- **Defaulting**: Most items default to `multiplier=1`, but items like Cigarettes will have a smart-default based on common sales.

## 5. Potential Edge Cases & Solutions

| Edge Case | Solution |
|-----------|----------|
| **Carton breakdown** | No explicit "Breakdown" action is needed. Since stock is stored in sticks, selling a pack just pulls 20 sticks. |
| **Price Hijacking** | Product prices will be verified server-side using the `ProductUnit` ID during checkout to prevent JS price manipulation. |
| **Reorder Alerts** | Reorder levels will be calculated in **Base Units** (e.g., "Alert me when less than 200 sticks remain"). |

---
*Drafting Phase complete. Prepared for Implementation Plan 2.1.1.*
