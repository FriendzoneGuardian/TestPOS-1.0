from django.core.exceptions import PermissionDenied
from django.shortcuts import redirect
from functools import wraps

def role_required(allowed_roles=[]):
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return redirect('core:login')
            if request.user.role in allowed_roles:
                return view_func(request, *args, **kwargs)
            raise PermissionDenied
        return _wrapped_view
    return decorator

def admin_only(view_func):
    return role_required(allowed_roles=['admin'])(view_func)

def manager_or_admin(view_func):
    return role_required(allowed_roles=['admin', 'manager'])(view_func)

def cashier_or_higher(view_func):
    return role_required(allowed_roles=['admin', 'manager', 'cashier'])(view_func)

def auditor_or_higher(view_func):
    return role_required(allowed_roles=['admin', 'manager', 'accounting'])(view_func)

def shift_required(view_func):
    """Requires an open shift at the user's current branch."""
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        from sales.models import Shift
        if not Shift.objects.filter(user=request.user, branch=request.user.branch, status='open').exists():
            from django.contrib import messages
            messages.warning(request, "An open shift is required. Please start your day.")
            return redirect('sales:shift_status')
        return view_func(request, *args, **kwargs)
    return _wrapped_view
