from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import Branch, Product, BranchStock
from core.models import User

@login_required
def branch_list(request):
    if not request.user.is_manager():
        messages.error(request, "Access denied.")
        return redirect('sales:dashboard')

    branches = Branch.objects.order_by('name')
    return render(request, 'branches/index.html', {'branches': branches})

@login_required
def branch_create(request):
    if not request.user.is_admin():
        messages.error(request, "Only admins can create branches.")
        return redirect('inventory:branch_list')

    if request.method == 'POST':
        name = request.POST.get('name', '').strip()
        location = request.POST.get('location', '').strip()
        if not name:
            messages.error(request, "Branch name is required.")
        elif Branch.objects.filter(name=name).exists():
            messages.error(request, "A branch with that name already exists.")
        else:
            Branch.objects.create(name=name, location=location)
            messages.success(request, f'Branch "{name}" created.')
            return redirect('inventory:branch_list')

    return render(request, 'branches/form.html', {'branch': None})

@login_required
def branch_edit(request, branch_id):
    if not request.user.is_admin():
        messages.error(request, "Only admins can edit branches.")
        return redirect('inventory:branch_list')

    branch = get_object_or_404(Branch, id=branch_id)

    if request.method == 'POST':
        branch.name = request.POST.get('name', '').strip()
        branch.location = request.POST.get('location', '').strip()
        branch.is_active = 'is_active' in request.POST
        branch.save()
        messages.success(request, "Branch updated.")
        return redirect('inventory:branch_list')

    return render(request, 'branches/form.html', {'branch': branch})

@login_required
def branch_products(request, branch_id):
    """Manage products / stock for a specific branch."""
    if not request.user.is_manager():
        messages.error(request, "Access denied.")
        return redirect('sales:dashboard')

    branch = get_object_or_404(Branch, id=branch_id)
    
    # This is a bit more complex in Django to get all products and their stock for this branch
    # We want Product + quantity (from BranchStock if it exists)
    from django.db.models import OuterRef, Subquery, IntegerField
    from django.db.models.functions import Coalesce
    
    stock_qty = BranchStock.objects.filter(
        branch=branch,
        product=OuterRef('pk')
    ).values('quantity')
    
    products = Product.objects.filter(is_active=True).annotate(
        quantity=Coalesce(Subquery(stock_qty), 0, output_field=IntegerField())
    ).order_by('name')

    return render(request, 'branches/products.html', {
        'branch': branch,
        'products': products
    })

@login_required
def update_stock(request, branch_id):
    if not request.user.is_manager():
        messages.error(request, "Access denied.")
        return redirect('sales:dashboard')

    if request.method == 'POST':
        product_id = int(request.POST.get('product_id', 0))
        quantity = int(request.POST.get('quantity', 0))

        branch = get_object_or_404(Branch, id=branch_id)
        product = get_object_or_404(Product, id=product_id)

        stock, created = BranchStock.objects.update_or_create(
            branch=branch,
            product=product,
            defaults={'quantity': quantity}
        )

        messages.success(request, "Stock updated.")
        return redirect('inventory:branch_products', branch_id=branch_id)
    
    return redirect('inventory:branch_list')
