from django.contrib.auth.mixins import AccessMixin
from django.core.exceptions import PermissionDenied
from django.contrib.auth.views import redirect_to_login
from functools import wraps

class RoleRequiredMixin(AccessMixin):
    """Verify that the current user has the specified roles."""
    allowed_roles = []

    def dispatch(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return self.handle_no_permission()
        if request.user.role not in self.allowed_roles:
            raise PermissionDenied
        return super().dispatch(request, *args, **kwargs)

def role_required(allowed_roles):
    """Decorator for function-based views to enforce role access."""
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return redirect_to_login(request.get_full_path())
            if request.user.role not in allowed_roles:
                raise PermissionDenied
            return view_func(request, *args, **kwargs)
        return _wrapped_view
    return decorator
