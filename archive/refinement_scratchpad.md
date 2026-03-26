# Scratchpad: Structural Refinement & Branch Isolation

## 1. Goal: "The Atom of Inventory" Completion
We need to finalize the `base_unit` logic to ensure that even complex sales (e.g., Cigarettes) have a clear "Smallest Unit" reference.

### Model Tweeks
- **Product**: Add `base_unit = models.CharField(max_length=20, default='pcs')`.
- **OrderItem**: Add `unit = models.ForeignKey(ProductUnit, null=True, on_delete=models.SET_NULL)` to track the EXACT packaging used in the transaction.

## 2. Goal: Branch Data Parity
Currently, a manager at Branch A might see Analytics for Branch B if the queryset isn't filtered.

### View Refactor Strategy
Implement a `get_branch_queryset(user, model_class)` helper in `core/utils.py` (or similar) that:
- Returns `model_class.objects.all()` for `admin`.
- Returns `model_class.objects.filter(branch=user.branch)` for others.

## 3. Goal: The "Gold Standard" Purge
Fix the 50+ Pyre2/Pylance errors in `sales/views.py`. Most are likely due to `import` order or `try/except` blocks that shadow real imports.

### Steps:
1. Standardize all `django.db` and `sales.models` imports at the top.
2. Remove any inline `from sales.models import ...` inside functions.
3. Clean up the `checkout` function signature and local variables.

## 4. Proposed Implementation Order
1. **Migration**: Add `base_unit` and `OrderItem.unit`.
2. **Logic**: Update `checkout` to populate `OrderItem.unit`.
3. **Isolation**: Apply branch filtering to Analytics and Ledger Monitoring views.
4. **Cleanup**: Perform the final lint purge.
