import unittest
import time
import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

BASE_URL = "http://127.0.0.1:5000"

class TestPOSTerminalEdgeCases(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_experimental_option('excludeSwitches', ['enable-logging'])
        
        cls.driver = webdriver.Chrome(service=ChromeService(ChromeDriverManager().install()), options=chrome_options)
        cls.driver.implicitly_wait(5)
        cls.wait = WebDriverWait(cls.driver, 5)
        print("\n====== Starting POS Edge Case Tests ======")

    @classmethod
    def tearDownClass(cls):
        print("====== Finished POS Edge Case Tests ======\n")
        cls.driver.quit()

    def setUp(self):
        self.driver.get(f"{BASE_URL}/auth/logout")
        self.driver.get(f"{BASE_URL}/auth/login")
        self.driver.find_element(By.ID, "username").send_keys("admin")
        self.driver.find_element(By.ID, "password").send_keys("admin123")
        self.driver.find_element(By.ID, "login-btn").click()
        self.wait.until(EC.presence_of_element_located((By.XPATH, "//span[contains(text(), 'TheMoneyShot')]")))

    def tearDown(self):
        self.driver.get(f"{BASE_URL}/pos")
        try:
            self.driver.execute_script("cart = []; renderCart();")
        except Exception:
            pass

    def test_case_1_phantom_stock(self):
        print("\nRunning Case 1: The Phantom Stock (Over-selling)")
        self.driver.get(f"{BASE_URL}/pos")
        
        # Inject 9999 units of product 1 into the cart via JS
        self.driver.execute_script("""
            cart.push({product_id: 1, name: 'Espresso', price: 3.50, quantity: 9999});
            paymentMethod = 'cash';
            checkout();
        """)
        time.sleep(1)
        
        # Check if alert popped up
        try:
            alert = self.driver.switch_to.alert
            text = alert.text
            alert.accept()
            # If the alert says "completed", the exploit worked!
            self.assertNotIn("completed", text.lower(), "VULNERABILITY: System allowed over-selling 9999 units!")
        except:
            self.fail("No alert found during checkout.")

    def test_case_2_minus_money_exploit(self):
        print("\nRunning Case 2: The Minus Money Exploit (Input Tampering)")
        self.driver.get(f"{BASE_URL}/pos")
        
        # Inject -50 units of product 1
        self.driver.execute_script("""
            cart.push({product_id: 1, name: 'Espresso', price: 3.50, quantity: -50});
            paymentMethod = 'cash';
            checkout();
        """)
        time.sleep(1)
        
        try:
            alert = self.driver.switch_to.alert
            text = alert.text
            alert.accept()
            self.assertNotIn("completed", text.lower(), "VULNERABILITY: System allowed a negative quantity checkout!")
        except:
            self.fail("No alert found during checkout.")

    def test_case_3_cross_branch_heist(self):
        print("\nRunning Case 3: The Cross-Branch Heist (Validation Bypass)")
        # Product 999 probably doesn't exist, let's see how the system handles it
        self.driver.get(f"{BASE_URL}/pos")
        self.driver.execute_script("""
            cart.push({product_id: 999, name: 'Ghost Item', price: 100.00, quantity: 1});
            paymentMethod = 'cash';
            checkout();
        """)
        time.sleep(1)
        
        try:
            alert = self.driver.switch_to.alert
            text = alert.text
            alert.accept()
            # It should say 'Product not found.'
            self.assertIn("not found", text.lower(), "VULNERABILITY: System allowed checkout of non-existent cross-branch item!")
        except:
            self.fail("No alert found during checkout.")

    def test_case_4_double_tap_void(self):
        print("\nRunning Case 4: The Double Tap (Void Duplication)")
        # First create an order to void
        self.driver.get(f"{BASE_URL}/pos")
        self.driver.execute_script("""
            cart.push({product_id: 1, name: 'Espresso', price: 3.50, quantity: 1});
            paymentMethod = 'cash';
            checkout();
        """)
        time.sleep(1)
        try:
            alert = self.driver.switch_to.alert
            alert.accept()
        except:
            pass
        
        import re
        source = self.driver.page_source
        match = re.search(r"'X-CSRFToken': '([^']+)'", source)
        csrf_token = match.group(1) if match else ''

        self.driver.execute_script(f"""
            window.promises = [];
            for(let i=0; i<2; i++) {{
                window.promises.push(
                    fetch('/pos/void-item', {{
                        method: 'POST',
                        headers: {{'Content-Type': 'application/json', 'X-CSRFToken': '{csrf_token}'}},
                        body: JSON.stringify({{item_id: 1, reason: 'Double tap test'}})
                    }}).then(r => r.json())
                );
            }}
        """)
        time.sleep(2)
        results = self.driver.execute_script("return Promise.all(window.promises);")
        # If both succeeded, we have a double void issue!
        success_count = sum(1 for r in results if r and r.get('success'))
        self.assertLess(success_count, 2, "VULNERABILITY: System allowed double-voiding the identical item!")

    def test_case_5_infinite_credit_loop(self):
        print("\nRunning Case 5: The Infinite Credit Loop (Stress/Extreme Values)")
        self.driver.get(f"{BASE_URL}/pos")
        
        # Astronomically high loan
        self.driver.execute_script("""
            cart.push({product_id: 1, name: 'Espresso', price: 9999999999999.99, quantity: 99999});
            paymentMethod = 'loan';
            // Assuming customer_id 1 is valid
            document.getElementById('customer-select-wrap').classList.remove('hidden');
            let sel = document.getElementById('customer-select');
            if (sel.options.length > 1) {
                sel.value = sel.options[1].value; // pick first customer
            }
            checkout();
        """)
        time.sleep(1)
        
        try:
            alert = self.driver.switch_to.alert
            text = alert.text
            alert.accept()
            # If it succeeds without error, we check if the DB handled it or crashed.
            # But really, standard limits should block this.
            self.assertNotIn("completed", text.lower(), "VULNERABILITY: System allowed astronomically high loan (Overflow risk)!")
        except:
            self.fail("No alert found during checkout.")

if __name__ == "__main__":
    unittest.main(verbosity=2)
