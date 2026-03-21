from django.urls import path
from . import views
from . import views_ancient

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
    path('ancient-aura/', views_ancient.ancient_aura, name='ancient_aura'),
]
