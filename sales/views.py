from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.utils import timezone
from .models import Order, OrderItem, Customer
from inventory.models import Product, BranchStock
from core.mixins import role_required
import json

@login_required
@role_required(['admin', 'cashier'])
def terminal(request):
    products = Product.objects.filter(is_active=True).prefetch_related('stock').order_by('category', 'name')
    customers = Customer.objects.order_by('name')
    
    categories = []
    for product in products:
        if product.category and product.category not in categories:
            categories.append(product.category)
            
        # Get stock for current user branch
        branch_stock = product.stock.filter(branch=request.user.branch).first()
        product.current_stock = branch_stock.quantity if branch_stock else 0
        product.is_out_of_stock = product.current_stock <= 0
        product.is_low_stock = product.current_stock <= product.reorder_level
        
    return render(request, 'pos/terminal.html', {
        'products': products,
        'customers': customers,
        'categories': categories,
        'current_shift': True  # STUB for Beta 1.2
    })

@login_required
@role_required(['admin', 'cashier'])
@transaction.atomic
def checkout(request):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Invalid method.'}, status=405)
    
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON.'}, status=400)

    items_data = data.get('items')
    if not items_data:
        return JsonResponse({'success': False, 'message': 'Cart is empty.'}, status=400)

    payment_method = data.get('payment_method', 'cash')
    customer_id = data.get('customer_id')

    if payment_method == 'loan' and not customer_id:
        return JsonResponse({'success': False, 'message': 'Select a customer for loan transactions.'}, status=400)

    customer = None
    if customer_id:
        try:
            customer = Customer.objects.get(id=int(customer_id))
        except (Customer.DoesNotExist, ValueError):
            return JsonResponse({'success': False, 'message': 'Customer not found.'}, status=400)

    order = Order.objects.create(
        user=request.user,
        branch=request.user.branch,
        customer=customer,
        payment_method=payment_method,
        status='completed'
    )

    total = 0.0
    total_qty = 0
    
    for item in items_data:
        try:
            product = Product.objects.get(id=int(item['product_id']))
        except (Product.DoesNotExist, ValueError):
            return JsonResponse({'success': False, 'message': f'Product not found.'}, status=400)
        
        qty = int(item['quantity'])
        if qty <= 0:
            return JsonResponse({'success': False, 'message': f'Invalid quantity for {product.name}.'}, status=400)
            
        total_qty += qty
        if total_qty > 1000:
            return JsonResponse({'success': False, 'message': 'Order exceeds maximum item limit (1000).'}, status=400)

        # Get stock for the user's branch
        stock = BranchStock.objects.filter(branch=request.user.branch, product=product).first()
        
        if not stock or stock.quantity < qty:
            return JsonResponse({'success': False, 'message': f'Insufficient stock for {product.name}.'}, status=400)

        OrderItem.objects.create(
            order=order,
            product=product,
            quantity=qty,
            price_at_time=product.price
        )
        total += product.price * qty

        # Decrease branch stock
        stock.quantity -= qty
        stock.save()

    if total > 50000.00:
        # Transaction will rollback due to @transaction.atomic if we raise an exception or similar
        # But here we are manually returning a 400. 
        # Actually, in Django, if we are inside atomic, we should probably raise an Exception to rollback,
        # or we rely on the fact that we haven't committed yet.
        # However, Order.objects.create already committed if not in atomic.
        # Since we are in atomic, returning a response doesn't rollback unless we raise.
        # Let's fix this logic.
        transaction.set_rollback(True)
        return JsonResponse({'success': False, 'message': 'Order exceeds maximum transaction total ($50,000.00).'}, status=400)

    order.total_amount = total
    order.save()

    # If loan, add to customer outstanding balance
    if payment_method == 'loan' and customer:
        customer.outstanding_balance += total
        customer.save()

    return JsonResponse({'success': True, 'order_id': order.id, 'total': total})

@login_required
@role_required(['admin', 'manager', 'cashier'])
def shift_start(request):
    return JsonResponse({'success': True, 'message': 'Shift started (stub).'})

@login_required
@role_required(['admin', 'manager', 'cashier'])
def shift_preview(request):
    return JsonResponse({
        'success': True,
        'starting_cash': 0.0,
        'cash_sales': 0.0,
        'loan_sales': 0.0,
        'expected_cash': 0.0
    })

@login_required
@role_required(['admin', 'manager', 'cashier'])
def shift_end(request):
    return JsonResponse({'success': True, 'message': 'Shift ended (stub).'})
