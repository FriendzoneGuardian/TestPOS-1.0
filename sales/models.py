from django.db import models
from django.conf import settings
from core.models import Branch
from inventory.models import Product

class Customer(models.Model):
    name = models.CharField(max_length=150)
    contact = models.CharField(max_length=150, null=True, blank=True)
    outstanding_balance = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Order(models.Model):
    PAYMENT_METHODS = [
        ('cash', 'Cash'),
        ('loan', 'Loan'),
    ]
    STATUS_CHOICES = [
        ('completed', 'Completed'),
        ('voided', 'Voided'),
    ]
    order_date = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='orders')
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    total_amount = models.FloatField(default=0.0)
    amount_paid = models.FloatField(default=0.0)
    change_given = models.FloatField(default=0.0)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default='cash')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='completed')
    void_reason = models.TextField(null=True, blank=True)
    voided_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f'Order #{self.id}'

class Shift(models.Model):
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('closed', 'Closed'),
    ]
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    starting_cash = models.FloatField(default=0.0)
    expected_cash = models.FloatField(default=0.0)
    actual_cash = models.FloatField(null=True, blank=True, default=0.0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='shifts')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='shifts')

    @property
    def variance(self):
        if self.actual_cash is None:
            return 0.0
        return round((self.actual_cash or 0.0) - (self.expected_cash or 0.0), 2)

    @property
    def closing_cash(self):
        return self.actual_cash

class StockAuditLog(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stock_audits')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='stock_audits')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='stock_audits')
    quantity_change = models.IntegerField()
    reason = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True, related_name='stock_audits')

    def __str__(self):
        return f'{self.product.name}: {self.quantity_change}'

class OrderItem(models.Model):
    ITEM_STATUS = [
        ('active', 'Active'),
        ('voided', 'Voided'),
    ]
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='order_items')
    unit = models.ForeignKey('inventory.ProductUnit', on_delete=models.SET_NULL, null=True, blank=True) # Selected packaging (Box/Pack)
    quantity = models.IntegerField(default=1)
    price_at_time = models.FloatField()
    cost_at_time = models.FloatField(default=0.0)  # Snapshotted COGSchamp
    status = models.CharField(max_length=20, choices=ITEM_STATUS, default='active')
    void_reason = models.TextField(null=True, blank=True)

    @property
    def subtotal(self):
        return self.quantity * self.price_at_time

    def __str__(self):
        return f'{self.product.name} x{self.quantity}'

class VoidLog(models.Model):
    order_item = models.ForeignKey(OrderItem, on_delete=models.CASCADE, related_name='void_logs')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='void_logs')
    reason = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Void {self.order_item_id}'

class LoanPayment(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='payments')
    amount = models.FloatField()
    payment_date = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(null=True, blank=True)

    def __str__(self):
        return f'LoanPayment ${self.amount} for {self.customer.name}'

class BranchVault(models.Model):
    branch = models.OneToOneField(Branch, on_delete=models.CASCADE, related_name='vault')
    balance = models.FloatField(default=0.0)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.branch.name} Vault ()'


class VaultTransaction(models.Model):
    TRANSACTION_TYPES = [
        ('deposit', 'Deposit'),
        ('withdrawal', 'Withdrawal'),
    ]
    vault = models.ForeignKey(BranchVault, on_delete=models.CASCADE, related_name='transactions')
    amount = models.FloatField()
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    reason = models.CharField(max_length=255)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.transaction_type}  ({self.reason})'


class BundlePromotion(models.Model):
    PROMO_TYPES = [
        ('discount', 'Discounted Price'),
        ('freebie', 'Free Product Bonus'),
    ]
    trigger_product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='promotions')
    trigger_quantity = models.PositiveIntegerField(default=1)
    promo_type = models.CharField(max_length=20, choices=PROMO_TYPES, default='discount')
    
    # For 'discount' type
    promo_price = models.FloatField(null=True, blank=True)
    
    # For 'freebie' type
    bonus_product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True, related_name='bonus_promos')
    bonus_qty = models.PositiveIntegerField(default=1)
    
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Promo: {self.trigger_product.name} ({self.promo_type})"
