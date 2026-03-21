from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from core.mixins import role_required

@login_required
@role_required(['admin', 'accounting'])
def ancient_aura(request):
    return render(request, 'sales/ancient_aura.html')
