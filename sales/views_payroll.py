from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from .models import Customer, PayrollDeduction
from core.models import User
from django.db import transaction

@login_required
def settle_internal_debt(request, user_id):
    """
    "The Salary Squeeze": Settles the outstanding balance of a user's linked customer
    account by recording a payroll deduction.
    """
    target_user = get_object_or_404(User, id=user_id)
    
    if not target_user.linked_customer:
        return JsonResponse({'success': False, 'message': 'User has no linked customer profile.'})
        
    customer = target_user.linked_customer
    debt_amount = customer.outstanding_balance
    
    if debt_amount <= 0:
        return JsonResponse({'success': False, 'message': 'No outstanding debt to settle.'})
        
    try:
        with transaction.atomic():
            # 1. Create the Deduction Record
            PayrollDeduction.objects.create(
                user=target_user,
                amount=debt_amount,
                customer=customer,
                description=f"Salary Squeeze: Automated settlement of ₱{debt_amount:.2f} debt."
            )
            
            # 2. Clear the Customer Debt
            customer.outstanding_balance = 0
            customer.save()
            
            # 3. Log the action (Audit/Forensics)
            # In a real system, we'd also link this to a PayrollPeriod model
            
        return JsonResponse({
            'success': True, 
            'message': f'Successfully settled ₱{debt_amount:.2f} for {target_user.username}.',
            'new_balance': 0
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)})

@login_required
def bulk_settle_internal_debt(request):
    """
    "The Great Reset": Settles all outstanding internal debts for all users
    with linked customer profiles in a single atomic operation.
    """
    if not request.user.is_admin() and not request.user.is_manager():
        return JsonResponse({'success': False, 'message': 'Insufficient clearance.'})
        
    employees = User.objects.filter(linked_customer__outstanding_balance__gt=0).select_related('linked_customer')
    count = 0
    total_amount = 0
    
    try:
        with transaction.atomic():
            for emp in employees:
                customer = emp.linked_customer
                debt = customer.outstanding_balance
                
                PayrollDeduction.objects.create(
                    user=emp,
                    amount=debt,
                    customer=customer,
                    description=f"Bulk Settlement: System-wide clearance of ₱{debt:.2f}."
                )
                
                customer.outstanding_balance = 0
                customer.save()
                
                count += 1
                total_amount += debt
                
        return JsonResponse({
            'success': True,
            'message': f'Bulk settlement complete. Cleared ₱{total_amount:.2f} across {count} accounts.'
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)})

@login_required
def payroll_dashboard(request):
    """
    Overview of all employees with linked debt profiles.
    """
    if not request.user.is_admin() and not request.user.is_manager():
        messages.error(request, "Access Denied: Auditor/Manager clearance required.")
        return redirect('sales:manager_dashboard')
        
    employees = User.objects.filter(linked_customer__isnull=False).select_related('linked_customer')
    
    return render(request, 'sales/payroll_dashboard.html', {
        'employees': employees,
        'title': 'Salary Squeeze · Payroll Forensics'
    })
