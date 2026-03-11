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
