from django.urls import path
from . import views

app_name = 'sales'

urlpatterns = [
    path('terminal/', views.terminal, name='terminal'),
    path('checkout/', views.checkout, name='checkout'),
    path('shift/start/', views.shift_start, name='shift_start'),
    path('shift/preview/', views.shift_preview, name='shift_preview'),
    path('shift/end/', views.shift_end, name='shift_end'),
]
