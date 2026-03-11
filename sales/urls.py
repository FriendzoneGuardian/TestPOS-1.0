from django.urls import path
from . import views

app_name = 'sales'

urlpatterns = [
    path('terminal/', views.terminal, name='terminal'),
    path('checkout/', views.checkout, name='checkout'),
]
