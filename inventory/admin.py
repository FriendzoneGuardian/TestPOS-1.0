from django.contrib import admin
from .models import Product, BranchStock

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'price', 'category', 'is_active')
    list_filter = ('category', 'is_active')
    search_fields = ('name', 'sku')

@admin.register(BranchStock)
class BranchStockAdmin(admin.ModelAdmin):
    list_display = ('branch', 'product', 'quantity')
    list_filter = ('branch',)
    search_fields = ('product__name', 'product__sku')
