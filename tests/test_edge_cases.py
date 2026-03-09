"""
=======================================================================
  POS Security Audit — 11 Automated Edge-Case Tests
  Alpha 1.8 "Bare Assets" (Updated for Audit & Accountability)
=======================================================================
  All tests use pure HTTP requests.Session for maximum reliability.
  No Selenium flakiness — tests hammer the backend API directly.
======================================================================="""
import unittest
import re
import requests as http_requests

BASE_URL = "http://127.0.0.1:5000"


# ─── Helpers ─────────────────────────────────────────────────────────
def _api_session(username, password):
    """Return a requests.Session logged in via the Flask login form."""
    s = http_requests.Session()
    r = s.get(f"{BASE_URL}/auth/login")
    match = re.search(r'name="csrf_token" value="([^"]+)"', r.text)
    csrf = match.group(1) if match else ""
    s.post(f"{BASE_URL}/auth/login",
           data={"username": username, "password": password,
                 "branch_id": "1", "csrf_token": csrf})
    return s


def _extract_csrf(session):
    """Grab the CSRF token from the meta tag on any authenticated page."""
    r = session.get(f"{BASE_URL}/")
    match = re.search(r'name="csrf-token" content="([^"]+)"', r.text)
    return match.group(1) if match else ""


# =====================================================================
#  Cashier Endpoint Tests  (01-05)
# =====================================================================
class TestPOSCashierExploits(unittest.TestCase):
    """Tests 01-05: Validate server-side input sanitisation on
    the checkout and POS endpoints when called by a Cashier."""

    @classmethod
    def setUpClass(cls):
        cls.s = _api_session("cashier1", "cashier123")
        cls.csrf = _extract_csrf(cls.s)
        print("\n====== PART A: Cashier Exploit Tests (01-05) ======")

    @classmethod
    def tearDownClass(cls):
        cls.s.close()
        print("====== PART A Complete ======\n")

    def _checkout(self, items, payment="cash", customer_id=None):
        """Fire a checkout POST and return (status_code, json)."""
        payload = {"items": items, "payment_method": payment}
        if customer_id:
            payload["customer_id"] = customer_id
        r = self.s.post(f"{BASE_URL}/pos/checkout",
                        json=payload,
                        headers={"X-CSRFToken": self.csrf})
        return r.status_code, r.json()

    # ── Test 01 ──────────────────────────────────────────────────────
    def test_case_01_phantom_stock(self):
        """Over-sell: 9999 units of product 1. Server must reject."""
        print("\n[01] The Phantom Stock (Over-selling)")
        code, body = self._checkout(
            [{"product_id": 1, "name": "Espresso",
              "price": 3.50, "quantity": 9999}])
        self.assertEqual(code, 400,
                         f"VULNERABILITY: 9999-unit checkout was accepted! "
                         f"Got {code}: {body}")
        self.assertFalse(body.get("success"),
                         "VULNERABILITY: success=True on over-sell!")

    # ── Test 02 ──────────────────────────────────────────────────────
    def test_case_02_minus_money_exploit(self):
        """Negative quantity: -50 units. Server must reject."""
        print("\n[02] The Minus Money Exploit (Input Tampering)")
        code, body = self._checkout(
            [{"product_id": 1, "name": "Espresso",
              "price": 3.50, "quantity": -50}])
        self.assertEqual(code, 400,
                         f"VULNERABILITY: Negative qty accepted! "
                         f"Got {code}: {body}")
        self.assertFalse(body.get("success"),
                         "VULNERABILITY: success=True on negative qty!")

    # ── Test 03 ──────────────────────────────────────────────────────
    def test_case_03_cross_branch_heist(self):
        """Non-existent product_id=999. Server must return 400."""
        print("\n[03] The Cross-Branch Heist (Validation Bypass)")
        code, body = self._checkout(
            [{"product_id": 999, "name": "Ghost Item",
              "price": 100.00, "quantity": 1}])
        self.assertEqual(code, 400,
                         f"VULNERABILITY: Non-existent product accepted! "
                         f"Got {code}: {body}")

    # ── Test 04 ──────────────────────────────────────────────────────
    def test_case_04_double_tap_void(self):
        """Cashier tries void-item → must get 403 (Alpha 1.8 restriction)."""
        print("\n[04] The Double Tap (Cashier Void Blocked)")
        r = self.s.post(f"{BASE_URL}/pos/void-item",
                        json={"item_id": 1, "reason": "double tap attempt"},
                        headers={"X-CSRFToken": self.csrf})
        self.assertEqual(r.status_code, 403,
                         f"VULNERABILITY: Cashier void-item succeeded! "
                         f"Got {r.status_code}")

    # ── Test 05 ──────────────────────────────────────────────────────
    def test_case_05_infinite_credit_loop(self):
        """Astronomical price × qty. Server must cap at $50K."""
        print("\n[05] The Infinite Credit Loop (Extreme Values)")
        code, body = self._checkout(
            [{"product_id": 1, "name": "Espresso",
              "price": 9999999999999.99, "quantity": 99999}],
            payment="loan", customer_id="1")
        self.assertEqual(code, 400,
                         f"VULNERABILITY: Unlimited loan accepted! "
                         f"Got {code}: {body}")


# =====================================================================
#  Role & Payload Security Tests  (06-10)
# =====================================================================
class TestPOSRoleSecurity(unittest.TestCase):
    """Tests 06-11: Validate role-based access control and payload
    sanity across Admin / Cashier / Manager boundaries."""

    @classmethod
    def setUpClass(cls):
        cls.cashier = _api_session("cashier1", "cashier123")
        cls.admin   = _api_session("admin",    "admin123")
        cls.manager = _api_session("manager",  "manager123")
        cls.cashier_csrf = _extract_csrf(cls.cashier)
        cls.admin_csrf   = _extract_csrf(cls.admin)
        cls.manager_csrf = _extract_csrf(cls.manager)
        print("\n====== PART B: Role & Payload Security (06-11) ======")

    @classmethod
    def tearDownClass(cls):
        cls.cashier.close()
        cls.admin.close()
        cls.manager.close()
        print("====== PART B Complete ======\n")

    # ── Test 06 ──────────────────────────────────────────────────────
    def test_case_06_role_spoof_privilege_escalation(self):
        """Admin tries /pos/checkout → must get 403."""
        print("\n[06] The Role Spoof (Privilege Escalation)")
        r = self.admin.post(f"{BASE_URL}/pos/checkout",
                            json={"items": [{"product_id": 1,
                                             "quantity": 1}],
                                  "payment_method": "cash"},
                            headers={"X-CSRFToken": self.admin_csrf})
        self.assertEqual(r.status_code, 403,
                         f"VULNERABILITY: Admin reached /pos/checkout! "
                         f"Got {r.status_code}")

    # ── Test 07 ──────────────────────────────────────────────────────
    def test_case_07_ghost_void_invalid_id(self):
        """Admin voids item_id=999999 → must get 404."""
        print("\n[07] The Ghost Void (Invalid Object ID)")
        r = self.admin.post(f"{BASE_URL}/pos/void-item",
                            json={"item_id": 999999,
                                  "reason": "non-existent item"},
                            headers={"X-CSRFToken": self.admin_csrf})
        self.assertEqual(r.status_code, 404,
                         f"VULNERABILITY: System didn't 404 on fake item! "
                         f"Got {r.status_code}")

    # ── Test 08 ──────────────────────────────────────────────────────
    def test_case_08_broken_cart_malformed_json(self):
        """Send payload with no 'items' key. Must get 400."""
        print("\n[08] The Broken Cart (Malformed Payload)")
        r = self.cashier.post(f"{BASE_URL}/pos/checkout",
                              json={"garbage": []},
                              headers={"X-CSRFToken": self.cashier_csrf})
        self.assertEqual(r.status_code, 400,
                         f"VULNERABILITY: Malformed cart accepted! "
                         f"Got {r.status_code}")

    # ── Test 09 ──────────────────────────────────────────────────────
    def test_case_09_unauthorized_cashier_void(self):
        """Cashier tries /pos/void-order → must get 403."""
        print("\n[09] The Unauthorized Cashier Void")
        r = self.cashier.post(f"{BASE_URL}/pos/void-order",
                              json={"order_id": 1,
                                    "reason": "bypassing manager lock"},
                              headers={"X-CSRFToken": self.cashier_csrf})
        self.assertEqual(r.status_code, 403,
                         f"VULNERABILITY: Cashier void-order succeeded! "
                         f"Got {r.status_code}")

    # ── Test 10 ──────────────────────────────────────────────────────
    def test_case_10_missing_csrf_token(self):
        """POST without X-CSRFToken → must get 400."""
        print("\n[10] Missing CSRF Token (State Tampering)")
        r = self.admin.post(f"{BASE_URL}/pos/void-item",
                            json={"item_id": 1, "reason": "no csrf"},
                            headers={"Content-Type": "application/json"})
        self.assertEqual(r.status_code, 400,
                         f"VULNERABILITY: POST accepted without CSRF! "
                         f"Got {r.status_code}")

    # ── Test 11 ──────────────────────────────────────────────────────
    def test_case_11_cashier_void_item_blocked(self):
        """Cashier tries /pos/void-item → must get 403 (Alpha 1.8)."""
        print("\n[11] Cashier Void-Item Blocked (Alpha 1.8 Enforcement)")
        r = self.cashier.post(f"{BASE_URL}/pos/void-item",
                              json={"item_id": 1,
                                    "reason": "sneaky cashier"},
                              headers={"X-CSRFToken": self.cashier_csrf})
        self.assertEqual(r.status_code, 403,
                         f"VULNERABILITY: Cashier can void items! "
                         f"Got {r.status_code}")


if __name__ == "__main__":
    unittest.main(verbosity=2)
