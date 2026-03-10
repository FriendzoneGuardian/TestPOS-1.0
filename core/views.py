from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.contrib import messages
from django.contrib.auth.forms import AuthenticationForm
from django.http import JsonResponse
from django.views.decorators.http import require_POST
import json

def login_view(request):
    if request.user.is_authenticated:
        if request.user.role == 'cashier':
            return redirect('sales:terminal')
        return redirect('sales:dashboard')

    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                if user.is_active:
                    login(request, user)
                    messages.success(request, f"Logged in as {username}.")
                    if user.role == 'cashier':
                        return redirect('sales:terminal')
                    return redirect('sales:dashboard')
                else:
                    messages.error(request, "This account is inactive.")
            else:
                messages.error(request, "Invalid username or password.")
        else:
            messages.error(request, "Invalid username or password.")
    
    form = AuthenticationForm()
    return render(request, 'auth/login.html', {'form': form})

def logout_view(request):
    # Block logout for cashiers with open shifts
    if request.user.is_authenticated and request.user.role == 'cashier':
        from sales.models import Shift
        if Shift.objects.filter(user=request.user, branch=request.user.branch, status='open').exists():
            messages.error(request, "Shift Active! End your day before logging out.")
            return redirect('sales:terminal')
            
    logout(request)
    messages.info(request, "You have been logged out.")
    return redirect('core:login')
@require_POST
def update_theme(request):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False}, status=403)
    
    try:
        data = json.loads(request.body)
        theme = data.get('theme')
        if theme in ['dawn', 'dusk', 'midnight']:
            request.user.theme_preference = theme
            request.user.save()
            return JsonResponse({'success': True})
    except Exception:
        pass
    
    return JsonResponse({'success': False}, status=400)
