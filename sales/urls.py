from django.urls import path
from . import views
from . import views_ledger
from . import views_payroll

app_name = 'sales'

urlpatterns = [
    path('terminal/', views.terminal, name='terminal'),
    path('checkout/', views.checkout, name='checkout'),
    path('void-item/', views.void_item, name='void_item'),
    path('shift/start/', views.shift_start, name='shift_start'),
    path('shift/preview/', views.shift_preview, name='shift_preview'),
    path('shift/end/', views.shift_end, name='shift_end'),
    path('shift/manage/', views.shift_manage, name='shift_manage'),
    path('vault/', views.vault_manage, name='vault_manage'),
    path('vault/transaction/', views.vault_transaction, name='vault_transaction'),
    path('periodic-reports/', views.periodic_reports, name='periodic_reports'),
    path('ledger-monitoring/', views_ledger.ledger_monitoring, name='ledger_monitoring'),
    path('payroll/', views_payroll.payroll_dashboard, name='payroll_dashboard'),
    path('payroll/settle/<int:user_id>/', views_payroll.settle_internal_debt, name='settle_internal_debt'),
    path('payroll/bulk-settle/', views_payroll.bulk_settle_internal_debt, name='bulk_settle_internal_debt'),
]
