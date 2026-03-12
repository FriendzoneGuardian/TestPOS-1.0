from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth import get_user_model
from core.models import Branch

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

    def test_admin_access(self):
        self.client.login(username='admin_test', password='testpassword')
        response = self.client.get(reverse('sales:terminal'))
        self.assertEqual(response.status_code, 200)

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
