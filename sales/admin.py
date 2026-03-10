from django.contrib import admin
from .models import Customer, Order, OrderItem, LoanPayment

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('name', 'contact', 'outstanding_balance')
    search_fields = ('name', 'contact')

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'order_date', 'user', 'branch', 'total_amount', 'payment_method', 'status')
    list_filter = ('status', 'payment_method', 'branch', 'order_date')
    inlines = [OrderItemInline]

@admin.register(LoanPayment)
class LoanPaymentAdmin(admin.ModelAdmin):
    list_display = ('customer', 'amount', 'payment_date')
    list_filter = ('payment_date',)
