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
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default='cash')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='completed')
    void_reason = models.TextField(null=True, blank=True)
    voided_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f'Order #{self.id}'

class OrderItem(models.Model):
    ITEM_STATUS = [
        ('active', 'Active'),
        ('voided', 'Voided'),
    ]
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='order_items')
    quantity = models.IntegerField(default=1)
    price_at_time = models.FloatField()
    status = models.CharField(max_length=20, choices=ITEM_STATUS, default='active')
    void_reason = models.TextField(null=True, blank=True)

    @property
    def subtotal(self):
        return self.quantity * self.price_at_time

    def __str__(self):
        return f'{self.product.name} x{self.quantity}'

class LoanPayment(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='payments')
    amount = models.FloatField()
    payment_date = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(null=True, blank=True)

    def __str__(self):
        return f'LoanPayment ${self.amount} for {self.customer.name}'

class Shift(models.Model):
    STATUS_CHOICES = [('open', 'Open'), ('closed', 'Closed')]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='shifts')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='shifts')
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    starting_cash = models.FloatField(default=0.0)
    closing_cash = models.FloatField(null=True, blank=True)
    expected_cash = models.FloatField(default=0.0)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='open')

    def __str__(self):
        return f'Shift {self.id} - {self.user.username}'

    @property
    def variance(self):
        if self.closing_cash is not None:
            return self.closing_cash - self.expected_cash
        return 0

class AuditLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=255)
    details = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return f'{self.action} by {self.user} at {self.timestamp}'

class BranchVault(models.Model):
    branch = models.OneToOneField(Branch, on_delete=models.CASCADE, related_name='vault')
    balance = models.FloatField(default=0.0)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Vault - {self.branch.name}'

class VaultTransaction(models.Model):
    TYPE_CHOICES = [('deposit', 'Deposit'), ('withdrawal', 'Withdrawal')]
    vault = models.ForeignKey(BranchVault, on_delete=models.CASCADE, related_name='transactions')
    amount = models.FloatField()
    transaction_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    reason = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return f'{self.transaction_type} of ${self.amount} in {self.vault.branch.name}'
