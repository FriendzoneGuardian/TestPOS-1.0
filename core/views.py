from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
import json

def home(request):
    if request.user.is_authenticated:
        return redirect('sales:terminal')
    return redirect('core:login')

@login_required
def update_theme(request):
    if request.method == 'POST':
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
