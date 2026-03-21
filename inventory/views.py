from django.shortcuts import render, redirect, get_object_or_404
from django.db import transaction
from django.utils import timezone
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from core.mixins import role_required
from core.models import Branch
from .models import Product, BranchStock
from .forms import ProductForm

@login_required
@role_required(['admin', 'manager', 'accounting'])
def dashboard(request):
    from django.db.models import Q
    query = request.GET.get('q')
    products = Product.objects.prefetch_related('stock__branch').all()
    
    if query:
        products = products.filter(Q(name__icontains=query) | Q(sku__icontains=query))
        
    products = products.order_by('category', 'name')
    branches = Branch.objects.filter(is_active=True)
    
    selected_branch_id = request.GET.get('branch')
    low_stock_count = 0
    low_stock_alerts = []
    
    now = timezone.now()
    for product in products:
        if selected_branch_id:
            product.total_stock = sum(stock.quantity for stock in product.stock.all() if str(stock.branch_id) == selected_branch_id)
        else:
            product.total_stock = sum(stock.quantity for stock in product.stock.all())
        
        product.is_new = (now - product.created_at).days < 2
        if product.total_stock <= product.reorder_level:
            low_stock_count += 1
            low_stock_alerts.append({
                'product_name': product.name,
                'quantity': product.total_stock,
                'reorder_level': product.reorder_level,
                'id': product.id
            })
            
    return render(request, 'inventory/dashboard.html', {
        'products': products,
        'branches': branches,
        'selected_branch': selected_branch_id,
        'low_stock_count': low_stock_count,
        'low_stock_alerts': low_stock_alerts
    })

@login_required
@role_required(['admin', 'manager'])
def add_product(request):
    if request.method == 'POST':
        form = ProductForm(request.POST)
        if form.is_valid():
            product = form.save()
            # Initialize stock for all branches
            branches = Branch.objects.all()
            for branch in branches:
                BranchStock.objects.get_or_create(branch=branch, product=product, defaults={'quantity': 0})
            
            messages.success(request, f'Product "{product.name}" added successfully.')
            return redirect('inventory:dashboard')
    else:
        form = ProductForm()
    
    return render(request, 'inventory/product_form.html', {
        'form': form,
        'title': 'Add New Product'
    })

@login_required
@role_required(['admin', 'manager'])
def edit_product(request, pk):
    product = get_object_or_404(Product, pk=pk)
    if request.method == 'POST':
        form = ProductForm(request.POST, instance=product)
        if form.is_valid():
            form.save()
            messages.success(request, f'Product "{product.name}" updated successfully.')
            return redirect('inventory:dashboard')
    else:
        form = ProductForm(instance=product)
    
    return render(request, 'inventory/product_form.html', {
        'form': form,
        'product': product,
        'title': f'Edit {product.name}'
    })

@login_required
@role_required(['admin'])
def delete_product(request, pk):
    product = get_object_or_404(Product, pk=pk)
    product_name = product.name
    product.delete()
    messages.success(request, f'Product "{product_name}" deleted.')
    return redirect('inventory:dashboard')


@login_required
@role_required(['admin', 'manager'])
@transaction.atomic
def restock_product(request, pk):
    if request.method != 'POST':
        return redirect('inventory:dashboard')
    
    product = get_object_or_404(Product, pk=pk)
    try:
        quantity = int(request.POST.get('quantity'))
        unit_cost = float(request.POST.get('unit_cost', 0))
        branch_id = int(request.POST.get('branch_id'))
    except (TypeError, ValueError):
        messages.error(request, 'Invalid input for quantity, cost, or branch.')
        return redirect('inventory:dashboard')

    status = request.POST.get('status', 'good')
    expiry_date = request.POST.get('expiry_date') or None
    reason = request.POST.get('reason', 'Manual Restock')

    if quantity <= 0:
        messages.error(request, 'Quantity must be greater than zero.')
        return redirect('inventory:dashboard')

    branch = get_object_or_404(Branch, id=branch_id)
    
    # Create the batch
    from .models import StockBatch
    StockBatch.objects.create(
        product=product,
        branch=branch,
        quantity=quantity,
        unit_cost=unit_cost,  # Entry Aura
        status=status,
        expiry_date=expiry_date
    )

    # Update aggregate stock if status is 'good'
    if status == 'good':
        stock, _ = BranchStock.objects.get_or_create(branch=branch, product=product)
        stock.quantity += quantity
        stock.save()

    # Log to audit trail
    from sales.models import StockAuditLog
    StockAuditLog.objects.create(
        product=product,
        branch=branch,
        user=request.user,
        quantity_change=quantity,
        reason=f"Restock ({status}): {reason}"
    )

    messages.success(request, f'Added {quantity} units to {product.name} at {branch.name}.')
    return redirect('inventory:dashboard')
