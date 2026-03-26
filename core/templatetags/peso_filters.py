from django import template

register = template.Library()

@register.filter
def peso(value):
    """Phase 3.0: Format a number as Philippine Peso — ₱X,XXX.XX"""
    try:
        val = float(value)
        return f'₱{val:,.2f}'
    except (ValueError, TypeError):
        return '₱0.00'

@register.filter
def peso_signed(value):
    """Peso format with sign indicator for variance display."""
    try:
        val = float(value)
        if val < 0:
            return f'-₱{abs(val):,.2f}'
        elif val > 0:
            return f'+₱{val:,.2f}'
        return '₱0.00'
    except (ValueError, TypeError):
        return '₱0.00'
