from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model
from django.views.decorators.http import require_POST
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Sum
from .models import Branch
from .forms import UserManagementForm
from sales.models import Order, VoidLog, StockAuditLog, Customer
import json

User = get_user_model()

def home(request):
    if request.user.is_authenticated:
        if request.user.role == 'accounting':
            return redirect('core:accounting_dashboard')
        elif request.user.is_manager():
            return redirect('core:manager_dashboard')
        else:
            return redirect('sales:terminal')
    return redirect('core:login')

@login_required
def manager_dashboard(request):
    from datetime import timedelta
    from sales.models import Shift
    from inventory.models import BranchStock
    from django.db.models import F

    # Admin and Manager have access
    if not request.user.is_manager():
        return redirect('core:home')
    today = timezone.localdate()
    orders = Order.objects.filter(status='completed')
    if request.user.role != 'admin' and getattr(request.user, 'branch', None):
        orders = orders.filter(branch=request.user.branch)
    elif getattr(request.user, 'branch', None):
        orders = orders.filter(branch=request.user.branch)

    # 4 KPIs
    orders_today = orders.filter(order_date__date=today)
    total_sales_today = orders_today.aggregate(total=Sum('total_amount'))['total'] or 0.0
    transactions_today = orders_today.count()
    credit_outstanding = Customer.objects.aggregate(total=Sum('outstanding_balance'))['total'] or 0.0

    # Low Stock Count
    low_stock_qs = BranchStock.objects.filter(
        product__is_active=True,
        quantity__lte=F('product__reorder_level')
    )
    if request.user.role != 'admin' and getattr(request.user, 'branch', None):
        low_stock_qs = low_stock_qs.filter(branch=request.user.branch)
    low_stock_count = low_stock_qs.count()

    # Low Stock Alerts Panel
    low_stock_alerts = low_stock_qs.select_related('product', 'branch').order_by('quantity')[:10]

    # Active Session (for current user or branch depending on design - let's fetch current user's active shift)
    from sales.views import get_active_shift
    active_shift = get_active_shift(request.user)

    # Recent Transactions
    recent_transactions = orders.select_related('user', 'branch', 'customer').order_by('-order_date')[:8]

    # 7-day Chart.js data
    chart_labels = []
    chart_cash = []
    chart_credit = []
    
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        day_orders = orders.filter(order_date__date=d)
        cash = day_orders.filter(payment_method='cash').aggregate(total=Sum('total_amount'))['total'] or 0.0
        credit = day_orders.filter(payment_method='loan').aggregate(total=Sum('total_amount'))['total'] or 0.0
        
        chart_labels.append(d.strftime('%a'))  # e.g., 'Mon', 'Tue'
        chart_cash.append(float(cash))
        chart_credit.append(float(credit))

    context = {
        'total_sales_today': total_sales_today,
        'transactions_today': transactions_today,
        'credit_outstanding': credit_outstanding,
        'low_stock_count': low_stock_count,
        'low_stock_alerts': low_stock_alerts,
        'active_shift': active_shift,
        'recent_transactions': recent_transactions,
        'chart_labels': json.dumps(chart_labels),
        'chart_cash': json.dumps(chart_cash),
        'chart_credit': json.dumps(chart_credit),
        'branch_scope': request.user.branch.name if getattr(request.user, 'branch', None) else 'All Branches',
    }
    return render(request, 'dashboard/index.html', context)

@login_required
def accounting_dashboard(request):
    # Admin and Accounting have access
    if not (request.user.role == 'accounting' or request.user.is_admin()):
        return redirect('core:home')
    today = timezone.localdate()
    orders = Order.objects.filter(status='completed')

    total_revenue = orders.aggregate(total=Sum('total_amount'))['total'] or 0.0
    active_loans = Customer.objects.aggregate(total=Sum('outstanding_balance'))['total'] or 0.0
    total_voids_today = VoidLog.objects.filter(timestamp__date=today).count()

    audit_entries = []
    stock_logs = StockAuditLog.objects.select_related('product', 'branch', 'user').order_by('-timestamp')[:50]
    for log in stock_logs:
        audit_entries.append({
            'timestamp': log.timestamp,
            'type': log.reason,
            'summary': f'{log.product.name} ({log.quantity_change:+})',
            'user': log.user.username if log.user else 'System',
            'branch': log.branch.name if log.branch else 'Global',
            'details': f'Order #{log.order_id}' if log.order_id else ''
        })

    void_logs = VoidLog.objects.select_related('order_item__product', 'order_item__order__branch', 'user').order_by('-timestamp')[:50]
    for log in void_logs:
        branch_name = ''
        if log.order_item and log.order_item.order and log.order_item.order.branch:
            branch_name = log.order_item.order.branch.name
        audit_entries.append({
            'timestamp': log.timestamp,
            'type': 'void',
            'summary': f'Void {log.order_item.product.name if log.order_item else "Item"}',
            'user': log.user.username if log.user else 'System',
            'branch': branch_name or 'Global',
            'details': log.reason
        })

    audit_entries.sort(key=lambda entry: entry['timestamp'], reverse=True)
    audit_entries = audit_entries[:50]

    context = {
        'total_revenue': total_revenue,
        'active_loans': active_loans,
        'total_voids_today': total_voids_today,
        'audit_entries': audit_entries
    }
    return render(request, 'core/dashboards/accounting.html', context)

@login_required
def user_management(request):
    # Only Admin
    if not request.user.is_admin():
        return redirect('core:home')
    
    users = User.objects.select_related('branch').all().order_by('role', 'username')
    branches = Branch.objects.all()
    form = UserManagementForm()
    
    context = {
        'users': users,
        'branches': branches,
        'form': form
    }
    return render(request, 'core/user_management.html', context)

@login_required
@require_POST
def user_save(request, user_id=None):
    if not request.user.is_admin():
        return JsonResponse({'success': False, 'message': 'Permission denied.'}, status=403)
        
    # Only Admin can create Admin users or edit Admin users
    
    if user_id:
        user_obj = get_object_or_404(User, id=user_id)
        if user_obj.is_admin() and not request.user.is_admin():
            return JsonResponse({'success': False, 'message': 'Cannot edit an admin user.'}, status=403)
    else:
        user_obj = None

    role_being_set = request.POST.get('role')
    if role_being_set == 'admin' and not request.user.is_admin():
        return JsonResponse({'success': False, 'message': 'Cannot create an admin user.'}, status=403)

    form = UserManagementForm(request.POST, request.FILES, instance=user_obj)
    if form.is_valid():
        user = form.save()
        return JsonResponse({'success': True, 'message': 'User saved successfully.'})
    else:
        errors = {field: [error for error in field_errors] for field, field_errors in form.errors.items()}
        return JsonResponse({'success': False, 'message': 'Validation failed.', 'errors': errors}, status=400)

@login_required
@require_POST
def user_delete(request, user_id):
    if not request.user.is_admin():
        return JsonResponse({'success': False, 'message': 'Permission denied.'}, status=403)
    
    if user_id == request.user.id:
        return JsonResponse({'success': False, 'message': 'Cannot delete yourself.'}, status=400)
        
    user_obj = get_object_or_404(User, id=user_id)
    user_obj.delete()
    return JsonResponse({'success': True, 'message': 'User deleted successfully.'})

@login_required
@require_POST
def lock_session(request):
    request.session['is_locked'] = True
    return JsonResponse({'success': True})

@login_required
@require_POST
def unlock_session(request):
    pin = request.POST.get('pin')
    if pin == request.user.terminal_pin:
        request.session['is_locked'] = False
        return JsonResponse({'success': True})
    return JsonResponse({'success': False, 'message': 'Invalid PIN.'}, status=400)

@login_required
@require_POST
def update_theme(request):
    try:
        data = json.loads(request.body)
        theme = data.get('theme', 'dusk')
        if theme in dict(request.user.THEME_CHOICES).keys():
            request.user.theme_preference = theme
            request.user.save(update_fields=['theme_preference'])
            return JsonResponse({'success': True, 'theme': theme})
    except json.JSONDecodeError:
        pass
    return JsonResponse({'success': False}, status=400)
