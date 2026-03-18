from django.urls import path
from . import views

app_name = 'inventory'

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('add/', views.add_product, name='add_product'),
    path('edit/<int:pk>/', views.edit_product, name='edit_product'),
    path('delete/<int:pk>/', views.delete_product, name='delete_product'),
    path('restock/<int:pk>/', views.restock_product, name='restock_product'),
    path('aura/', views_aura.aura_dashboard, name='aura_dashboard'),
]
