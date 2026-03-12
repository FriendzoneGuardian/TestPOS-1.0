from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from django.views.decorators.http import require_POST
from .models import Order, OrderItem, Customer, Shift, VoidLog, StockAuditLog
from inventory.models import Product, BranchStock
from core.mixins import role_required
from core.models import Branch
import json

def resolve_branch(user):
    if getattr(user, 'branch', None):
        return user.branch
    branch = Branch.objects.first()
    if not branch:
        branch, _ = Branch.objects.get_or_create(name='Main Branch')
    if user.is_authenticated and getattr(user, 'branch', None) is None:
        user.branch = branch
        user.save(update_fields=['branch'])
    return branch

def get_active_shift(user):
    branch = resolve_branch(user)
    if not user.is_authenticated or not branch:
        return None
    return Shift.objects.filter(branch=branch, status='open').order_by('-start_time').first()

@login_required
@role_required(['cashier'])
def terminal(request):
    products = Product.objects.filter(is_active=True).prefetch_related('stock').order_by('category', 'name')
    customers = Customer.objects.order_by('name')
    branch = resolve_branch(request.user)
    
    categories = []
    for product in products:
        if product.category and product.category not in categories:
            categories.append(product.category)
            
        # Get stock for current user branch
        branch_stock = product.stock.filter(branch=branch).first() if branch else None
        product.current_stock = branch_stock.quantity if branch_stock else 0
        product.is_out_of_stock = product.current_stock <= 0
        product.is_low_stock = product.current_stock <= product.reorder_level
        
    current_shift = get_active_shift(request.user)

    return render(request, 'pos/terminal.html', {
        'products': products,
        'customers': customers,
        'categories': categories,
        'current_shift': current_shift
    })

@login_required
@role_required(['cashier'])
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
    amount_paid = data.get('amount_paid')

    branch = resolve_branch(request.user)
    if not branch:
        return JsonResponse({'success': False, 'message': 'User branch required.'}, status=400)

    active_shift = get_active_shift(request.user)
    if not active_shift:
        return JsonResponse({'success': False, 'message': 'Shift required before checkout.'}, status=400)

    if payment_method == 'loan' and not customer_id:
        return JsonResponse({'success': False, 'message': 'Select a customer for loan transactions.'}, status=400)

    customer = None
    if customer_id:
        try:
            customer = Customer.objects.get(id=int(customer_id))
        except (Customer.DoesNotExist, ValueError):
            return JsonResponse({'success': False, 'message': 'Customer not found.'}, status=400)

    total = 0.0
    total_qty = 0
    item_rows = []
    
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
        stock = BranchStock.objects.select_for_update().filter(branch=branch, product=product).first()
        
        if not stock or stock.quantity < qty:
            return JsonResponse({'success': False, 'message': f'Insufficient stock for {product.name}.'}, status=400)
        total += product.price * qty
        item_rows.append((product, qty, stock))

    if total > 50000.00:
        return JsonResponse({'success': False, 'message': 'Order exceeds maximum transaction total ($50,000.00).'}, status=400)

    if payment_method == 'cash':
        try:
            amount_paid = float(amount_paid)
        except (TypeError, ValueError):
            return JsonResponse({'success': False, 'message': 'Enter a valid amount paid.'}, status=400)
        if amount_paid < total:
            return JsonResponse({'success': False, 'message': 'Payment insufficient.'}, status=400)
        change_given = round(amount_paid - total, 2)
    else:
        amount_paid = 0.0
        change_given = 0.0

    order = Order.objects.create(
        user=request.user,
        branch=branch,
        customer=customer,
        payment_method=payment_method,
        status='completed',
        total_amount=total,
        amount_paid=amount_paid,
        change_given=change_given
    )

    for product, qty, stock in item_rows:
        OrderItem.objects.create(
            order=order,
            product=product,
            quantity=qty,
            price_at_time=product.price
        )
        stock.quantity -= qty
        stock.save()
        StockAuditLog.objects.create(
            product=product,
            branch=branch,
            user=request.user,
            quantity_change=-qty,
            reason='sale',
            order=order
        )

    # If loan, add to customer outstanding balance
    if payment_method == 'loan' and customer:
        customer.outstanding_balance += total
        customer.save()

    return JsonResponse({'success': True, 'order_id': order.id, 'total': total, 'change': change_given})

@login_required
@role_required(['cashier'])
@require_POST
def shift_start(request):
    branch = resolve_branch(request.user)
    if not branch:
        return JsonResponse({'success': False, 'message': 'User branch required.'}, status=400)
    if get_active_shift(request.user):
        return JsonResponse({'success': False, 'message': 'An active shift already exists.'}, status=400)
    try:
        amount = float(request.POST.get('amount', 0))
    except (TypeError, ValueError):
        return JsonResponse({'success': False, 'message': 'Invalid starting amount.'}, status=400)
    if amount < 0:
        return JsonResponse({'success': False, 'message': 'Invalid starting amount.'}, status=400)
    Shift.objects.create(
        user=request.user,
        branch=branch,
        starting_cash=amount,
        expected_cash=amount,
        status='open'
    )
    return JsonResponse({'success': True, 'message': 'Shift started.'})

@login_required
@role_required(['cashier'])
def shift_preview(request):
    active_shift = get_active_shift(request.user)
    if not active_shift:
        return JsonResponse({'success': False, 'message': 'No active shift.'}, status=400)

    orders = Order.objects.filter(
        branch=resolve_branch(request.user),
        order_date__gte=active_shift.start_time,
        status='completed'
    )
    cash_sales = orders.filter(payment_method='cash').aggregate(total=Sum('total_amount'))['total'] or 0.0
    loan_sales = orders.filter(payment_method='loan').aggregate(total=Sum('total_amount'))['total'] or 0.0
    expected_cash = round(active_shift.starting_cash + cash_sales, 2)

    return JsonResponse({
        'success': True,
        'starting_cash': active_shift.starting_cash,
        'cash_sales': cash_sales,
        'loan_sales': loan_sales,
        'expected_cash': expected_cash
    })

@login_required
@role_required(['cashier'])
@require_POST
def shift_end(request):
    active_shift = get_active_shift(request.user)
    if not active_shift:
        return JsonResponse({'success': False, 'message': 'No active shift to close.'}, status=400)
    try:
        amount = float(request.POST.get('amount', 0))
    except (TypeError, ValueError):
        return JsonResponse({'success': False, 'message': 'Invalid final cash amount.'}, status=400)

    orders = Order.objects.filter(
        branch=resolve_branch(request.user),
        order_date__gte=active_shift.start_time,
        status='completed'
    )
    cash_sales = orders.filter(payment_method='cash').aggregate(total=Sum('total_amount'))['total'] or 0.0
    expected_cash = round(active_shift.starting_cash + cash_sales, 2)

    active_shift.expected_cash = expected_cash
    active_shift.actual_cash = amount
    active_shift.end_time = timezone.now()
    active_shift.status = 'closed'
    active_shift.save(update_fields=['expected_cash', 'actual_cash', 'end_time', 'status'])

    return JsonResponse({'success': True, 'message': 'Shift closed.'})

@login_required
@role_required(['admin', 'manager'])
@require_POST
@transaction.atomic
def void_item(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON.'}, status=400)

    item_id = data.get('item_id')
    reason = (data.get('reason') or '').strip()
    if not item_id or not reason:
        return JsonResponse({'success': False, 'message': 'Void reason is required.'}, status=400)

    try:
        item = OrderItem.objects.select_for_update().select_related('order', 'product').get(id=int(item_id))
    except (OrderItem.DoesNotExist, ValueError):
        return JsonResponse({'success': False, 'message': 'Item not found.'}, status=404)

    if item.status == 'voided':
        return JsonResponse({'success': False, 'message': 'Item already voided.'}, status=400)

    item.status = 'voided'
    item.void_reason = reason
    item.save(update_fields=['status', 'void_reason'])

    stock = BranchStock.objects.select_for_update().filter(branch=item.order.branch, product=item.product).first()
    if stock:
        stock.quantity += item.quantity
        stock.save()
        StockAuditLog.objects.create(
            product=item.product,
            branch=item.order.branch,
            user=request.user,
            quantity_change=item.quantity,
            reason='void',
            order=item.order
        )

    VoidLog.objects.create(
        order_item=item,
        user=request.user,
        reason=reason
    )

    order = item.order
    order.total_amount = max(0.0, (order.total_amount or 0.0) - item.subtotal)
    if order.payment_method == 'loan' and order.customer:
        order.customer.outstanding_balance = max(0.0, order.customer.outstanding_balance - item.subtotal)
        order.customer.save(update_fields=['outstanding_balance'])

    if not order.items.filter(status='active').exists():
        order.status = 'voided'
        order.void_reason = reason
        order.voided_at = timezone.now()

    order.save(update_fields=['total_amount', 'status', 'void_reason', 'voided_at'])

    return JsonResponse({'success': True, 'message': 'Item voided.'})
