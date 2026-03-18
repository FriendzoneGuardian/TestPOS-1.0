from django.db import models
from core.models import Branch

class Product(models.Model):
    name = models.CharField(max_length=150)
    sku = models.CharField(max_length=50, unique=True)
    price = models.FloatField(default=0.0)
    category = models.CharField(max_length=80, null=True, blank=True)
    reorder_level = models.PositiveIntegerField(default=10)
    image_hash = models.CharField(max_length=64, null=True, blank=True)  # Linking strategy for UI assets
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class BranchStock(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='stock')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stock')
    quantity = models.IntegerField(default=0)

    class Meta:
        unique_together = ('branch', 'product')

    def __str__(self):
        return f'{self.branch.name} - {self.product.name} ({self.quantity})'


class StockBatch(models.Model):
    STATUS_CHOICES = [
        ('good', 'Good'),
        ('broken', 'Broken'),
        ('rotten', 'Rotten'),
        ('expired', 'Expired'),
        ('incomplete', 'Incomplete'),
    ]
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='batches')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='batches')
    quantity = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='good')
    expiry_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    unit_cost = models.FloatField(default=0.0)  # The Batch Aura
    supplier_info = models.TextField(null=True, blank=True)

    def __str__(self):
        return f'{self.product.name} ({self.status}) - {self.quantity}'

    class Meta:
        ordering = ['created_at']  # FIFO by default
