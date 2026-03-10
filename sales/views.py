from django.shortcuts import render, redirect
from django.http import JsonResponse, HttpResponse
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.utils import timezone
from django.contrib import messages
from django.db.models import Sum, Count
from core.decorators import role_required, admin_only, manager_or_admin, cashier_or_higher, auditor_or_higher, shift_required
from .models import Order, OrderItem, Customer, Shift, AuditLog, BranchVault, VaultTransaction
from inventory.models import Product, BranchStock
import json
import csv
from datetime import datetime, timedelta

@login_required
def dashboard(request):
    branch = request.user.branch
    today = timezone.now().date()
    start_of_day = timezone.make_aware(datetime.combine(today, datetime.min.time()))

    # Summary stats
    if request.user.is_admin():
        daily_sales = Order.objects.filter(
            order_date__gte=start_of_day, status='completed'
        ).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        total_orders = Order.objects.filter(order_date__gte=start_of_day).count()
        void_count = Order.objects.filter(status='voided', voided_at__gte=start_of_day).count()
    else:
        daily_sales = Order.objects.filter(
            order_date__gte=start_of_day, status='completed', branch=branch
        ).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        total_orders = Order.objects.filter(order_date__gte=start_of_day, branch=branch).count()
        void_count = Order.objects.filter(
            status='voided', voided_at__gte=start_of_day, branch=branch
        ).count()

    active_loans = Customer.objects.aggregate(Sum('outstanding_balance'))['outstanding_balance__sum'] or 0

    # Top products (last 7 days)
    week_ago = start_of_day - timedelta(days=7)
    top_products = Product.objects.filter(
        order_items__order__order_date__gte=week_ago,
        order_items__order__status='completed',
        order_items__status='active'
    )
    if not request.user.is_admin():
        top_products = top_products.filter(order_items__order__branch=branch)
    
    top_products = top_products.annotate(qty=Sum('order_items__quantity')).order_by('-qty')[:5]

    # Recent orders
    recent_orders = Order.objects.order_by('-order_date')
    if not request.user.is_admin():
        recent_orders = recent_orders.filter(branch=branch)
    recent_orders = recent_orders[:10]

    from core.models import Branch
    branches = Branch.objects.filter(is_active=True)

    return render(request, 'dashboard/index.html', {
        'daily_sales': daily_sales,
        'total_orders': total_orders,
        'void_count': void_count,
        'active_loans': active_loans,
        'top_products': top_products,
        'recent_orders': recent_orders,
        'branches': branches
    })

@login_required
def chart_data(request):
    """Return last-7-days sales data for chart rendering."""
    today = timezone.now().date()
    branch = request.user.branch
    labels = []
    values = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        start = timezone.make_aware(datetime.combine(day, datetime.min.time()))
        end = start + timedelta(days=1)
        
        orders = Order.objects.filter(order_date__gte=start, order_date__lt=end, status='completed')
        if not request.user.is_admin():
            orders = orders.filter(branch=branch)
            
        daily_total = orders.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        labels.append(day.strftime('%b %d'))
        values.append(float(daily_total))
        
    return JsonResponse({'labels': labels, 'values': values})

@cashier_or_higher
def terminal(request):
    products = Product.objects.filter(is_active=True).order_by('category', 'name')
    categories = Product.objects.filter(is_active=True).values_list('category', flat=True).distinct()
    customers = Customer.objects.order_by('name')
    
    # Pre-fetch stock for current branch
    branch_stock = BranchStock.objects.filter(branch=request.user.branch).select_related('product')
    stock_dict = {bs.product_id: bs.quantity for bs in branch_stock}
    
    # Inject stock into products
    for p in products:
        p.current_stock = stock_dict.get(p.id, 0)
        p.is_low_stock = p.current_stock <= p.low_stock_threshold and p.current_stock > 0
        p.is_out_of_stock = p.current_stock <= 0

    current_shift = Shift.objects.filter(user=request.user, branch=request.user.branch, status='open').first()

    return render(request, 'pos/terminal.html', {
        'products': products,
        'categories': [c for c in categories if c],
        'customers': customers,
        'current_shift': current_shift
    })

@cashier_or_higher
@shift_required
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
        transaction.set_rollback(True)
        return JsonResponse({'success': False, 'message': 'Order exceeds maximum transaction total ($50,000.00).'}, status=400)

    order.total_amount = total
    order.save()

    # If loan, add to customer outstanding balance
    if payment_method == 'loan' and customer:
        customer.outstanding_balance += total
        customer.save()

    return JsonResponse({'success': True, 'order_id': order.id, 'total': total})

@cashier_or_higher
def loan_list(request):
    customers = Customer.objects.order_by('name')
    return render(request, 'loans/index.html', {'customers': customers})

@cashier_or_higher
def customer_detail(request, customer_id):
    try:
        customer = Customer.objects.get(id=customer_id)
    except Customer.DoesNotExist:
        messages.error(request, "Customer not found.")
        return redirect('sales:loan_list')

    loan_orders = Order.objects.filter(customer=customer, payment_method='loan', status='completed').order_by('-order_date')
    payments = customer.payments.order_by('-payment_date')
    return render(request, 'loans/detail.html', {
        'customer': customer,
        'loan_orders': loan_orders,
        'payments': payments
    })

@cashier_or_higher
@transaction.atomic
def make_payment(request, customer_id):
    if request.method != 'POST':
        return redirect('sales:customer_detail', customer_id=customer_id)
        
    try:
        customer = Customer.objects.get(id=customer_id)
    except Customer.DoesNotExist:
        messages.error(request, "Customer not found.")
        return redirect('sales:loan_list')

    amount = float(request.POST.get('amount', 0))
    notes = request.POST.get('notes', '').strip()

    if amount <= 0:
        messages.error(request, "Payment amount must be positive.")
        return redirect('sales:customer_detail', customer_id=customer_id)

    if amount > customer.outstanding_balance:
        amount = customer.outstanding_balance

    from .models import LoanPayment
    LoanPayment.objects.create(customer=customer, amount=amount, notes=notes)
    customer.outstanding_balance -= amount
    customer.save()
    
    messages.success(request, f"Payment of ${amount:.2f} recorded.")
    return redirect('sales:customer_detail', customer_id=customer_id)

@auditor_or_higher
def reports_index(request):
    from core.models import Branch
    branches = Branch.objects.filter(is_active=True)
    return render(request, 'reports/index.html', {'branches': branches})

@auditor_or_higher
def sales_report(request):
    branch_id = request.GET.get('branch_id')
    period = request.GET.get('period', 'daily')
    today = timezone.now().date()

    if period == 'weekly':
        start_date = today - timedelta(days=7)
    elif period == 'monthly':
        start_date = today - timedelta(days=30)
    else:
        start_date = today

    start_dt = timezone.make_aware(datetime.combine(start_date, datetime.min.time()))

    orders = Order.objects.filter(order_date__gte=start_dt, status='completed')
    if branch_id:
        orders = orders.filter(branch_id=branch_id)
    elif not request.user.is_admin():
        orders = orders.filter(branch=request.user.branch)

    orders = orders.order_by('-order_date')
    total = orders.aggregate(Sum('total_amount'))['total_amount__sum'] or 0

    from core.models import Branch
    branches = Branch.objects.filter(is_active=True)
    
    return render(request, 'reports/sales.html', {
        'orders': orders,
        'total': total,
        'branches': branches,
        'selected_branch': int(branch_id) if branch_id else None,
        'period': period
    })

@auditor_or_higher
def void_report(request):
    voided_orders = Order.objects.filter(status='voided')
    if not request.user.is_admin():
        voided_orders = voided_orders.filter(branch=request.user.branch)
    voided_orders = voided_orders.order_by('-voided_at')

    voided_items = OrderItem.objects.filter(status='voided')
    if not request.user.is_admin():
        voided_items = voided_items.filter(order__branch=request.user.branch)
    voided_items = voided_items.order_by('-id')

    return render(request, 'reports/voids.html', {
        'voided_orders': voided_orders,
        'voided_items': voided_items
    })

@auditor_or_higher
def export_csv(request):
    branch_id = request.GET.get('branch_id')
    orders = Order.objects.filter(status='completed')
    if branch_id:
        orders = orders.filter(branch_id=branch_id)
    elif not request.user.is_admin():
        orders = orders.filter(branch=request.user.branch)

    orders = orders.order_by('-order_date')

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="sales_report.csv"'

    writer = csv.writer(response)
    writer.writerow(['Order ID', 'Date', 'Branch', 'Cashier', 'Payment', 'Total'])
    for o in orders:
        writer.writerow([
            o.id,
            o.order_date.strftime('%Y-%m-%d %H:%M'),
            o.branch.name if o.branch else '',
            o.user.username if o.user else '',
            o.payment_method,
            f'{o.total_amount:.2f}',
        ])

    return response

@login_required
def shift_status(request):
    current_shift = Shift.objects.filter(user=request.user, branch=request.user.branch, status='open').first()
    past_shifts = Shift.objects.filter(user=request.user, branch=request.user.branch).order_by('-start_time')[:10]
    return render(request, 'reports/shift_manage.html', {
        'current_shift': current_shift,
        'past_shifts': past_shifts
    })

@login_required
def shift_preview(request):
    current_shift = Shift.objects.filter(user=request.user, branch=request.user.branch, status='open').first()
    if not current_shift:
        return JsonResponse({'success': False, 'message': "No active shift."})
    
    cash_sales = Order.objects.filter(
        user=request.user,
        branch=request.user.branch,
        order_date__gte=current_shift.start_time,
        payment_method='cash',
        status='completed'
    ).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
    
    loan_sales = Order.objects.filter(
        user=request.user,
        branch=request.user.branch,
        order_date__gte=current_shift.start_time,
        payment_method='loan',
        status='completed'
    ).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
    
    return JsonResponse({
        'success': True,
        'starting_cash': current_shift.starting_cash,
        'cash_sales': float(cash_sales),
        'loan_sales': float(loan_sales),
        'expected_cash': current_shift.starting_cash + float(cash_sales),
        'total_sales': float(cash_sales + loan_sales)
    })

@login_required
@transaction.atomic
def shift_start(request):
    if request.method == 'POST':
        try:
            amount = float(request.POST.get('amount', 0))
        except ValueError:
            amount = 0.0
            
        if Shift.objects.filter(user=request.user, branch=request.user.branch, status='open').exists():
            return JsonResponse({'success': False, 'message': "You already have an open shift."})
        else:
            Shift.objects.create(user=request.user, branch=request.user.branch, starting_cash=amount)
            return JsonResponse({'success': True, 'message': f"Shift started with ${amount:.2f}"})
    return redirect('sales:shift_status')

@login_required
@transaction.atomic
def shift_end(request):
    if request.method == 'POST':
        try:
            amount = float(request.POST.get('amount', 0))
        except ValueError:
            amount = 0.0
            
        current_shift = Shift.objects.filter(user=request.user, branch=request.user.branch, status='open').first()
        if current_shift:
            current_shift.closing_cash = amount
            current_shift.end_time = timezone.now()
            current_shift.status = 'closed'
            
            # Calculate expected cash
            cash_sales = Order.objects.filter(
                user=request.user,
                branch=request.user.branch,
                order_date__gte=current_shift.start_time,
                payment_method='cash',
                status='completed'
            ).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
            
            current_shift.expected_cash = current_shift.starting_cash + float(cash_sales)
            current_shift.save()
            
            # Audit Log
            AuditLog.objects.create(
                user=request.user,
                branch=request.user.branch,
                action="SHIFT_END",
                details=f"Shift #{current_shift.id} closed. Starting: ${current_shift.starting_cash}, Expected: ${current_shift.expected_cash}, Actual: ${amount}, Variance: ${current_shift.variance}"
            )
            
            return JsonResponse({
                'success': True, 
                'message': f"Shift ended. Expected: ${current_shift.expected_cash:.2f}, Actual: ${amount:.2f}",
                'variance': current_shift.variance
            })
        else:
            return JsonResponse({'success': False, 'message': "No active shift found to end."})
    return redirect('sales:shift_status')

@manager_or_admin
def vault_manage(request):
    vault, created = BranchVault.objects.get_or_create(branch=request.user.branch)
    transactions = vault.transactions.order_by('-timestamp')[:20]
    return render(request, 'reports/vault_manage.html', {
        'vault': vault,
        'transactions': transactions
    })

@manager_or_admin
@transaction.atomic
def vault_transaction(request):
    if request.method == 'POST':
        vault, created = BranchVault.objects.get_or_create(branch=request.user.branch)
        try:
            amount = float(request.POST.get('amount', 0))
        except ValueError:
            amount = 0.0
            
        t_type = request.POST.get('type') # deposit/withdrawal
        reason = request.POST.get('reason', '')
        
        if t_type == 'deposit':
            vault.balance += amount
        else:
            if vault.balance < amount:
                messages.error(request, "Insufficient vault balance.")
                return redirect('sales:vault_manage')
            vault.balance -= amount
        vault.save()
        
        VaultTransaction.objects.create(
            vault=vault, amount=amount, transaction_type=t_type,
            reason=reason, user=request.user
        )
        messages.success(request, f"Vault {t_type} of ${amount:.2f} recorded.")
    return redirect('sales:vault_manage')
