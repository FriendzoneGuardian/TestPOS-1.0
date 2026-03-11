def theme_processor(request):
    """
    Injects current theme and user role into the template context.
    CSS variables are handled natively in static/src/input.css based on data-theme and data-role.
    """
    context = {
        'current_theme': 'dusk', # Default
        'user_role': 'guest'
    }
    
    if request.user.is_authenticated:
        context['current_theme'] = getattr(request.user, 'theme_preference', 'dusk')
        context['user_role'] = getattr(request.user, 'role', 'cashier')
        
    return context
