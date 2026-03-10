from django.urls import path
from . import views

app_name = 'inventory'

urlpatterns = [
    path('branches/', views.branch_list, name='branch_list'),
    path('branches/create/', views.branch_create, name='branch_create'),
    path('branches/<int:branch_id>/edit/', views.branch_edit, name='branch_edit'),
    path('branches/<int:branch_id>/products/', views.branch_products, name='branch_products'),
    path('branches/<int:branch_id>/update-stock/', views.update_stock, name='update_stock'),
]
