from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model
from django.views.decorators.http import require_POST
from django.shortcuts import get_object_or_404
from .models import Branch
from .forms import UserManagementForm
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
    return render(request, 'core/dashboards/manager.html')

@login_required
def accounting_dashboard(request):
    # Admin and Accounting have access
    if not (request.user.role == 'accounting' or request.user.is_admin()):
        return redirect('core:home')
    return render(request, 'core/dashboards/accounting.html')

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
