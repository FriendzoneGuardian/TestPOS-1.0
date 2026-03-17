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

def inventory_alerts_processor(request):
    """
    Injects low stock alerts into the template context for authorized roles.
    """
    context = {'low_stock_alerts': []}
    
    if request.user.is_authenticated and request.user.role in ['admin', 'manager', 'accounting']:
        from inventory.models import BranchStock
        from django.db.models import F
        
        # Get low stock for the user's branch (or all branches if admin/global)
        qs = BranchStock.objects.filter(product__is_active=True, quantity__lte=F('product__reorder_level'))
        if request.user.branch:
            qs = qs.filter(branch=request.user.branch)
            
        alerts = []
        for stock in qs.select_related('product', 'branch')[:10]: # Limit to top 10 for nav
            alerts.append({
                'product_name': stock.product.name,
                'branch_name': stock.branch.name if stock.branch else 'Global',
                'quantity': stock.quantity,
                'reorder_level': stock.product.reorder_level
            })
        context['low_stock_alerts'] = alerts
        context['low_stock_count'] = qs.count()
        
    return context
