from django.db import models
from django.contrib.auth.models import AbstractUser

class Branch(models.Model):
    name = models.CharField(max_length=120, unique=True)
    location = models.CharField(max_length=255, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('manager', 'Manager'),
        ('cashier', 'Cashier'),
        ('accounting', 'Accounting'),
    ]
    
    THEME_CHOICES = [
        ('dawn', 'Dawn (Light)'),
        ('dusk', 'Dusk (Dark)'),
        ('midnight', 'Midnight (AMOLED)'),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='cashier')
    theme_preference = models.CharField(max_length=20, choices=THEME_CHOICES, default='dusk')
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    is_active_account = models.BooleanField(default=True) # Django User already has is_active, but keeping custom just in case

    def is_admin(self):
        return self.role == 'admin'

    def is_manager(self):
        return self.role in ('admin', 'manager')

    def is_accounting(self):
        return self.role == 'accounting'
