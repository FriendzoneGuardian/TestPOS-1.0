from django import forms
from django.contrib.auth import get_user_model
from .models import Branch

User = get_user_model()

class UserManagementForm(forms.ModelForm):
    password = forms.CharField(widget=forms.PasswordInput, required=False)

    class Meta:
        model = User
        fields = ['username', 'role', 'branch', 'is_active', 'is_active_account']
        
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if hasattr(self.instance, 'pk') and self.instance.pk:
            # Editing existing user, password not strictly required
            self.fields['password'].required = False
        else:
            # New user, password required
            self.fields['password'].required = True
            
    def save(self, commit=True):
        user = super().save(commit=False)
        if self.cleaned_data.get('password'):
            user.set_password(self.cleaned_data['password'])
        if commit:
            user.save()
        return user
