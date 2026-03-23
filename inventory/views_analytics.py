from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.db.models import Sum, F
from core.mixins import role_required
from sales.models import OrderItem, Order

@login_required
@role_required(['admin', 'manager'])
def analytics_dashboard(request):
    # Only calculate from completed orders
    completed_orders = Order.objects.filter(status='completed')

    # Calculate Total Revenue
    total_revenue = completed_orders.aggregate(
        total=Sum('total_amount')
    )['total'] or 0.0

    # Calculate Total COGS from active items in completed orders
    total_cost = OrderItem.objects.filter(
        order__status='completed',
        status='active'
    ).aggregate(
        total=Sum(F('cost_at_time') * F('quantity'))
    )['total'] or 0.0

    # Calculate Gross Profit
    gross_profit = total_revenue - total_cost

    # Calculate Profit Margin
    profit_margin = 0.0
    if total_revenue > 0:
        profit_margin = (gross_profit / total_revenue) * 100

    context = {
        'total_revenue': total_revenue,
        'total_cost': total_cost,
        'gross_profit': gross_profit,
        'profit_margin': profit_margin,
    }

    return render(request, 'inventory/analytics.html', context)
