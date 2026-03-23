from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from django.views.decorators.http import require_POST
from .models import Order, OrderItem, Customer, Shift, VoidLog, StockAuditLog, BranchVault, VaultTransaction, BundlePromotion
from inventory.models import Product, BranchStock, ProductUnit, StockBatch
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
    branch = resolve_branch(request.user)
    
    # Optimize with Prefetch (BUG-10: N+1 Fix)
    from django.db.models import Prefetch
    branch_stock_prefetch = Prefetch(
        'stock',
        queryset=BranchStock.objects.filter(branch=branch),
        to_attr='current_branch_stock'
    )

    products = Product.objects.filter(is_active=True).prefetch_related(
        branch_stock_prefetch, 
        'units'
    ).order_by('category', 'name')
    
    customers = Customer.objects.order_by('name')
    
    categories = []
    for product in products:
        if product.category and product.category not in categories:
            categories.append(product.category)
            
        # Optimization: Use pre-fetched branch stock
        branch_stock = product.current_branch_stock[0] if product.current_branch_stock else None
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
            # The placeholder check for total happens below after total is calculated.
        except (Customer.DoesNotExist, ValueError):
            return JsonResponse({'success': False, 'message': 'Customer not found.'}, status=400)

    total = 0.0
    total_qty = 0
    item_rows = []
    product_totals = {}  # Tracking base units for promo triggers

    for item in items_data:
        try:
            product = Product.objects.get(id=int(item['product_id']))
        except (Product.DoesNotExist, ValueError):
            return JsonResponse({'success': False, 'message': f'Product not found.'}, status=400)
        
        qty = int(item['quantity'])
        unit_id = item.get('unit_id')
        multiplier = 1
        unit_price = product.price
        unit = None # Default to no packaging (base unit)

        if unit_id and unit_id != 'base':
            try:
                unit = ProductUnit.objects.get(id=int(unit_id), product=product)
                multiplier = unit.multiplier
                unit_price = unit.get_price()
            except (ProductUnit.DoesNotExist, ValueError, TypeError):
                unit = None

        if qty <= 0:
            return JsonResponse({'success': False, 'message': f'Invalid quantity for {product.name}.'}, status=400)
            
        deduction_qty = qty * multiplier
        total_qty += deduction_qty
        if total_qty > 1000:
            return JsonResponse({'success': False, 'message': 'Order exceeds maximum item limit (1000).'}, status=400)

        # Track product totals for promo triggers (base units)
        product_totals[product.id] = product_totals.get(product.id, 0) + deduction_qty

        # Get stock for the user's branch
        stock = BranchStock.objects.select_for_update().filter(branch=branch, product=product).first()
        
        if not stock or stock.quantity < deduction_qty:
            return JsonResponse({'success': False, 'message': f'Insufficient stock for {product.name}.'}, status=400)
        
        total += unit_price * qty
        item_rows.append({
            'product': product, 
            'base_qty': deduction_qty, 
            'unit_price': unit_price, 
            'unit_count': qty,
            'multiplier': multiplier,
            'stock': stock,
            'unit': unit, 
        })

    # PROMO CHECK: Automate Freebie Rewards (Poké Mart Rules)
    for p_id, p_qty in product_totals.items():
        promos = BundlePromotion.objects.filter(trigger_product_id=p_id, promo_type='freebie', is_active=True)
        for promo in promos:
            if p_qty >= promo.trigger_quantity:
                bonus_count = (p_qty // promo.trigger_quantity) * promo.bonus_qty
                bonus_product = promo.bonus_product
                
                # Verify freebie exists and has stock
                b_stock = BranchStock.objects.select_for_update().filter(branch=branch, product=bonus_product).first()
                if b_stock and b_stock.quantity >= bonus_count:
                    item_rows.append({
                        'product': bonus_product, 
                        'base_qty': bonus_count, 
                        'unit_price': 0.0, 
                        'unit_count': bonus_count,
                        'multiplier': 1,
                        'stock': b_stock,
                        'unit': None
                    })

    if total > 50000.00:
        return JsonResponse({'success': False, 'message': 'Order exceeds maximum transaction total (₱50,000.00).'}, status=400)

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

    if payment_method == 'loan' and customer:
        if customer.outstanding_balance + total > 1500:
            return JsonResponse({'success': False, 'message': 'Rizz Cap Exceeded! Maximum credit limit is ₱1,500.'}, status=400)

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

    for row in item_rows:
        product = row['product']
        base_qty = row['base_qty']
        unit_price = row['unit_price']
        multiplier = row['multiplier']
        stock = row['stock']
        unit = row['unit']
        
        # Calculate price per base unit for snapping
        price_per_piece = unit_price / multiplier if multiplier > 0 else 0

        # FIFO Deduction Logic
        remaining_to_deduct = base_qty
        batches = StockBatch.objects.select_for_update().filter(
            product=product, 
            branch=branch, 
            status='good', 
            quantity__gt=0
        ).order_by('created_at')

        for batch in batches:
            if remaining_to_deduct <= 0:
                break
            
            deduction = min(batch.quantity, remaining_to_deduct)
            
            OrderItem.objects.create(
                order=order,
                product=product,
                unit=unit,
                quantity=deduction,
                price_at_time=price_per_piece,
                cost_at_time=batch.unit_cost
            )
            
            batch.quantity -= deduction
            batch.save()
            remaining_to_deduct -= deduction

        stock.quantity -= base_qty
        stock.save()

        StockAuditLog.objects.create(
            product=product,
            branch=branch,
            user=request.user,
            quantity_change=-base_qty,
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
    msg = "Shift Started! Target locked, let's get those sales! 🎯"
    from django.contrib import messages
    messages.success(request, msg)

    # AJAX gets JSON, form POST gets redirect
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest' or request.content_type == 'application/x-www-form-urlencoded' and request.headers.get('X-CSRFToken'):
        return JsonResponse({'success': True, 'message': msg})
    
    if request.user.role == 'cashier':
        return redirect('sales:shift_manage')
    return redirect('core:manager_dashboard')

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

    # Auto-deposit to vault
    vault, _ = BranchVault.objects.get_or_create(branch=resolve_branch(request.user))
    VaultTransaction.objects.create(
        vault=vault,
        amount=amount,
        transaction_type='deposit',
        reason=f'Shift close remittance (Shift #{active_shift.id})',
        user=request.user,
    )
    vault.balance += amount
    vault.save()

    variance = active_shift.variance
    if variance == 0:
        msg = "Shift Balanced! Perfect score, you're a legend! 🏆"
        msg_type = 'success'
    elif variance < 0:
        msg = f"Shift Closed. Short of ₱{abs(variance)}. We'll get 'em next time, chin up! 💔"
        msg_type = 'error'
    else:
        msg = f"Shift Closed. Over by ₱{variance}. Check the receipts? 🧐"
        msg_type = 'warning'

    from django.contrib import messages
    getattr(messages, msg_type)(request, msg)

    if request.headers.get('X-CSRFToken'):
        return JsonResponse({'success': True, 'message': msg, 'type': msg_type, 'variance': variance})
    
    if request.user.role == 'cashier':
        return redirect('sales:shift_manage')
    return redirect('core:manager_dashboard')

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

@login_required
@role_required(['admin', 'cashier'])
def vault_manage(request):
    branch = resolve_branch(request.user)
    vault, _ = BranchVault.objects.get_or_create(branch=branch)
    transactions = VaultTransaction.objects.filter(vault=vault).order_by('-timestamp')[:50]
    return render(request, 'reports/vault_manage.html', {
        'vault': vault,
        'transactions': transactions,
    })

@login_required
@role_required(['admin', 'cashier'])
@require_POST
@transaction.atomic
def vault_transaction(request):
    branch = resolve_branch(request.user)
    vault, _ = BranchVault.objects.get_or_create(branch=branch)
    tx_type = request.POST.get('type', 'deposit')
    try:
        amount = float(request.POST.get('amount', 0))
    except (TypeError, ValueError):
        from django.contrib import messages
        messages.error(request, 'Invalid amount.')
        return redirect('sales:vault_manage')
    if amount <= 0:
        from django.contrib import messages
        messages.error(request, 'Amount must be positive.')
        return redirect('sales:vault_manage')
    reason = (request.POST.get('reason') or '').strip()
    if not reason:
        from django.contrib import messages
        messages.error(request, 'Reason is required.')
        return redirect('sales:vault_manage')
    if tx_type == 'withdrawal' and amount > vault.balance:
        from django.contrib import messages
        messages.error(request, 'Insufficient vault balance for withdrawal.')
        return redirect('sales:vault_manage')
    VaultTransaction.objects.create(
        vault=vault,
        amount=amount,
        transaction_type=tx_type,
        reason=reason,
        user=request.user,
    )
    if tx_type == 'deposit':
        vault.balance += amount
    else:
        vault.balance -= amount
    vault.save()
    return redirect('sales:vault_manage')

@login_required
@role_required(['cashier'])
def shift_manage(request):
    branch = resolve_branch(request.user)
    current_shift = get_active_shift(request.user)
    past_shifts = Shift.objects.filter(branch=branch).order_by('-start_time')[:20]
    return render(request, 'reports/shift_manage.html', {
        'current_shift': current_shift,
        'past_shifts': past_shifts,
    })

@login_required
@role_required(['admin', 'accounting'])
def periodic_reports(request):
    from datetime import timedelta
    from django.db.models import Count, Avg
    branch = resolve_branch(request.user)
    period = request.GET.get('period', 'daily')
    now = timezone.now()

    if period == 'weekly':
        start_date = now - timedelta(days=7)
    elif period == '15day':
        start_date = now - timedelta(days=15)
    elif period == 'monthly':
        start_date = now - timedelta(days=30)
    elif period == 'annual':
        start_date = now - timedelta(days=365)
    else:
        start_date = now - timedelta(days=1)
        period = 'daily'

    orders = Order.objects.filter(
        branch=branch,
        order_date__gte=start_date,
        status='completed'
    )
    total_revenue = orders.aggregate(total=Sum('total_amount'))['total'] or 0.0
    total_orders = orders.count()
    avg_order = orders.aggregate(avg=Avg('total_amount'))['avg'] or 0.0
    void_count = Order.objects.filter(
        branch=branch,
        order_date__gte=start_date,
        status='voided'
    ).count()

    return render(request, 'reports/periodic.html', {
        'period': period,
        'start_date': start_date,
        'end_date': now,
        'total_revenue': round(total_revenue, 2),
        'total_orders': total_orders,
        'avg_order': round(avg_order, 2),
        'void_count': void_count,
    })
