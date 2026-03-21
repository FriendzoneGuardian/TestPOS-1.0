from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from core.mixins import role_required

@login_required
@role_required(['admin', 'manager'])
def aura_dashboard(request):
    return render(request, 'inventory/aura_dashboard.html')
