from django import forms
from .models import Product

class ProductForm(forms.ModelForm):
    class Meta:
        model = Product
        fields = ['name', 'sku', 'price', 'category', 'reorder_level', 'is_active']
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'block w-full px-4 py-3 rounded-xl border-white/10 focus:ring-primary-500 focus:border-primary-500 bg-surface-900 border transition-all text-sm text-gray-100',
                'placeholder': 'Product Name'
            }),
            'sku': forms.TextInput(attrs={
                'class': 'block w-full px-4 py-3 rounded-xl border-white/10 focus:ring-primary-500 focus:border-primary-500 bg-surface-900 border transition-all text-sm text-gray-100',
                'placeholder': 'SKU / Barcode'
            }),
            'price': forms.NumberInput(attrs={
                'class': 'block w-full px-4 py-3 rounded-xl border-white/10 focus:ring-primary-500 focus:border-primary-500 bg-surface-900 border transition-all text-sm text-gray-100',
                'step': '0.01',
                'placeholder': '0.00'
            }),
            'category': forms.TextInput(attrs={
                'class': 'block w-full px-4 py-3 rounded-xl border-white/10 focus:ring-primary-500 focus:border-primary-500 bg-surface-900 border transition-all text-sm text-gray-100',
                'placeholder': 'Category'
            }),
            'reorder_level': forms.NumberInput(attrs={
                'class': 'block w-full px-4 py-3 rounded-xl border-white/10 focus:ring-primary-500 focus:border-primary-500 bg-surface-900 border transition-all text-sm text-gray-100',
                'placeholder': '10'
            }),
            'is_active': forms.CheckboxInput(attrs={
                'class': 'w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500'
            }),
        }
