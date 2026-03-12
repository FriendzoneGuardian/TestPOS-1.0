from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth import get_user_model
from core.models import Branch
from inventory.models import Product, BranchStock
from .models import Shift, Order
import json

User = get_user_model()

class POSTerminalAccessTests(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(name="Test Branch")
        self.admin = User.objects.create_user(username='admin_test', password='testpassword', role='admin', branch=self.branch)
        self.cashier = User.objects.create_user(username='cashier_test', password='testpassword', role='cashier', branch=self.branch)
        self.manager = User.objects.create_user(username='manager_test', password='testpassword', role='manager', branch=self.branch)
        self.accounting = User.objects.create_user(username='accounting_test', password='testpassword', role='accounting', branch=self.branch)
        self.client = Client()

    def test_unauthenticated_user_redirect(self):
        # Unauthenticated users should be redirected to login
        response = self.client.get(reverse('sales:terminal'))
        self.assertEqual(response.status_code, 302)
        self.assertIn('/login/', response.url)

    def test_admin_access_denied(self):
        self.client.login(username='admin_test', password='testpassword')
        response = self.client.get(reverse('sales:terminal'))
        self.assertEqual(response.status_code, 403)

    def test_cashier_access(self):
        self.client.login(username='cashier_test', password='testpassword')
        response = self.client.get(reverse('sales:terminal'))
        self.assertEqual(response.status_code, 200)

    def test_manager_access_denied(self):
        self.client.login(username='manager_test', password='testpassword')
        response = self.client.get(reverse('sales:terminal'))
        # Should raise PermissionDenied resulting in 403 status
        self.assertEqual(response.status_code, 403)

    def test_accounting_access_denied(self):
        self.client.login(username='accounting_test', password='testpassword')
        response = self.client.get(reverse('sales:terminal'))
        self.assertEqual(response.status_code, 403)

class CheckoutPaymentTests(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(name="Test Branch")
        self.cashier = User.objects.create_user(username='cashier_pay', password='testpassword', role='cashier', branch=self.branch)
        self.client = Client()
        self.client.login(username='cashier_pay', password='testpassword')

        self.product = Product.objects.create(name='Espresso', sku='SKU-001', price=10.00, category='Beverage')
        BranchStock.objects.create(branch=self.branch, product=self.product, quantity=50)

    def _checkout(self, amount_paid):
        payload = {
            'items': [{'product_id': self.product.id, 'quantity': 1}],
            'payment_method': 'cash',
            'amount_paid': amount_paid
        }
        return self.client.post(
            reverse('sales:checkout'),
            data=json.dumps(payload),
            content_type='application/json'
        )

    def test_checkout_requires_shift(self):
        response = self._checkout(10.00)
        self.assertEqual(response.status_code, 400)
        self.assertIn('Shift required', response.json().get('message', ''))

    def test_checkout_insufficient_cash(self):
        Shift.objects.create(user=self.cashier, branch=self.branch, starting_cash=0.0, expected_cash=0.0, status='open')
        response = self._checkout(5.00)
        self.assertEqual(response.status_code, 400)
        self.assertIn('insufficient', response.json().get('message', '').lower())

    def test_checkout_change_given(self):
        Shift.objects.create(user=self.cashier, branch=self.branch, starting_cash=0.0, expected_cash=0.0, status='open')
        response = self._checkout(20.00)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get('success'))
        order = Order.objects.get(id=data.get('order_id'))
        self.assertEqual(order.amount_paid, 20.00)
        self.assertEqual(order.change_given, 10.00)
