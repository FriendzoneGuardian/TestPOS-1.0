from django.urls import path
from . import views

app_name = 'sales'

urlpatterns = [
    path('dashboard/', views.dashboard, name='dashboard'),
    path('api/chart-data/', views.chart_data, name='chart_data'),
    path('terminal/', views.terminal, name='terminal'),
    path('checkout/', views.checkout, name='checkout'),
    path('loans/', views.loan_list, name='loan_list'),
    path('loans/customer/<int:customer_id>/', views.customer_detail, name='customer_detail'),
    path('loans/payment/<int:customer_id>/', views.make_payment, name='make_payment'),
    path('reports/', views.reports_index, name='reports_index'),
    path('reports/sales/', views.sales_report, name='sales_report'),
    path('reports/voids/', views.void_report, name='void_report'),
    path('reports/export/', views.export_csv, name='export_csv'),
    
    # Shifting & Vaulting
    path('shift/status/', views.shift_status, name='shift_status'),
    path('shift/start/', views.shift_start, name='shift_start'),
    path('shift/end/', views.shift_end, name='shift_end'),
    path('shift/preview/', views.shift_preview, name='shift_preview'),
    path('vault/', views.vault_manage, name='vault_manage'),
    path('vault/transaction/', views.vault_transaction, name='vault_transaction'),
]
