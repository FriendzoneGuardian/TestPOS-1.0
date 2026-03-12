from django.contrib import admin
from .models import Customer, Order, OrderItem, LoanPayment, Shift, VoidLog, StockAuditLog

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

@admin.register(Shift)
class ShiftAdmin(admin.ModelAdmin):
    list_display = ('id', 'branch', 'user', 'start_time', 'status', 'starting_cash', 'expected_cash', 'actual_cash')
    list_filter = ('status', 'branch', 'start_time')

@admin.register(VoidLog)
class VoidLogAdmin(admin.ModelAdmin):
    list_display = ('order_item', 'user', 'timestamp')
    list_filter = ('timestamp',)

@admin.register(StockAuditLog)
class StockAuditLogAdmin(admin.ModelAdmin):
    list_display = ('product', 'branch', 'quantity_change', 'reason', 'timestamp')
    list_filter = ('reason', 'timestamp', 'branch')
