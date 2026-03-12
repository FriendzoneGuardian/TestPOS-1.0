from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from core.mixins import role_required
from .models import Product, BranchStock

@login_required
@role_required(['admin', 'manager', 'accounting'])
def dashboard(request):
    products = Product.objects.prefetch_related('stock__branch').all().order_by('category', 'name')
    
    for product in products:
        product.total_stock = sum(stock.quantity for stock in product.stock.all())
        
    return render(request, 'inventory/dashboard.html', {
        'products': products
    })
