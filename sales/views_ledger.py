from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from core.mixins import role_required
from sales.models import Customer
from django.db.models import Max

@login_required
@role_required(['admin', 'accounting'])
def ledger_monitoring(request):
    # Resolve branch and filter by it if not admin
    from sales.views import resolve_branch
    branch = resolve_branch(request.user)

    customers_with_debt = Customer.objects.filter(outstanding_balance__gt=0).annotate(
        last_active=Max('orders__order_date')
    )
    
    if not request.user.is_superuser:
        customers_with_debt = customers_with_debt.filter(orders__branch=branch).distinct()

    now = timezone.now()
    fresh = []
    stale = []
    ancient = []

    for customer in customers_with_debt:
        last_active = customer.last_active or customer.created_at
        days_stale = (now - last_active).days

        item = {
            'name': customer.name,
            'balance': customer.outstanding_balance,
            'days': days_stale,
            'last_active': last_active
        }

        if days_stale <= 15:
            fresh.append(item)
        elif days_stale <= 30:
            stale.append(item)
        else:
            ancient.append(item)

    # Sort descending by balance
    fresh.sort(key=lambda x: x['balance'], reverse=True)
    stale.sort(key=lambda x: x['balance'], reverse=True)
    ancient.sort(key=lambda x: x['balance'], reverse=True)

    context = {
        'fresh': fresh,
        'stale': stale,
        'ancient': ancient
    }

    return render(request, 'sales/ledger_monitoring.html', context)
