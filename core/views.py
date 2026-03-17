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
    # Admin and Manager have access
    if not request.user.is_manager():
        return redirect('core:home')
    today = timezone.localdate()
    orders = Order.objects.filter(order_date__date=today, status='completed')
    if request.user.role != 'admin' and request.user.branch:
        orders = orders.filter(branch=request.user.branch)
    elif request.user.branch:
        orders = orders.filter(branch=request.user.branch)

    total_sales_today = orders.aggregate(total=Sum('total_amount'))['total'] or 0.0
    transactions_today = orders.count()
    recent_transactions = orders.select_related('user', 'branch').order_by('-order_date')[:8]

    from sales.models import Shift
    recent_shifts = Shift.objects.filter(status='open')
    if request.user.role != 'admin' and request.user.branch:
        recent_shifts = recent_shifts.filter(branch=request.user.branch)
    elif request.user.branch:
        recent_shifts = recent_shifts.filter(branch=request.user.branch)
    recent_shifts = recent_shifts.select_related('user', 'branch').order_by('-start_time')[:5]

    context = {
        'total_sales_today': total_sales_today,
        'transactions_today': transactions_today,
        'recent_transactions': recent_transactions,
        'recent_shifts': recent_shifts,
        'branch_scope': request.user.branch.name if request.user.branch else 'All Branches',
    }
    return render(request, 'core/dashboards/manager.html', context)

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
    # Only Admin and Manager
    if not request.user.is_manager():
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
    if not request.user.is_manager():
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
