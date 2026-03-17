from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

app_name = 'core'

urlpatterns = [
    path('', views.home, name='home'),
    path('login/', auth_views.LoginView.as_view(template_name='core/login.html', redirect_authenticated_user=True), name='login'),
    path('logout/', auth_views.LogoutView.as_view(next_page='core:login'), name='logout'),
    path('theme/update/', views.update_theme, name='update_theme'),
    
    # Dashboards
    path('dashboard/manager/', views.manager_dashboard, name='manager_dashboard'),
    path('dashboard/accounting/', views.accounting_dashboard, name='accounting_dashboard'),
    
    # User Management
    path('users/', views.user_management, name='user_management'),
    path('users/save/', views.user_save, name='user_save'),
    path('users/save/<int:user_id>/', views.user_save, name='user_save_id'),
    
    # Security (The Cold Shoulder)
    path('lock-session/', views.lock_session, name='lock_session'),
    path('unlock-session/', views.unlock_session, name='unlock_session'),
]
