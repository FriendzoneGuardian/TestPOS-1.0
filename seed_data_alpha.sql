-- ==============================================================================
-- FILE: seed_data_alpha.sql
-- DESCRIPTION: Dummy data for TheMoneyShot POS (Branches, Users, Products, Customers, Stock).
-- NO TRANSACTIONS, NO ORDERS, NO SHIFTS.
-- All users share the password: 'password123'
-- 
-- USAGE:
-- If using Beekeeper Studio, open this file and click "Run All".
-- Or via CLI: sqlite3 instance/pos.db < seed_data_alpha.sql
-- ==============================================================================

BEGIN TRANSACTION;

-- 1. Insert Branches (Assuming ID 1 is already 'Main Branch' from your init, but we'll use INSERT OR IGNORE)
INSERT OR IGNORE INTO branches (id, name, location, is_active, created_at) VALUES 
(1, 'Main Branch', 'Downtown Metro', 1, CURRENT_TIMESTAMP),
(2, 'Northside Kiosk', 'North Mall 2F', 1, CURRENT_TIMESTAMP),
(3, 'Southside Depot', 'Industrial Park Ave', 1, CURRENT_TIMESTAMP),
(4, 'West End Lounge', 'Sunset Boulevard 44A', 1, CURRENT_TIMESTAMP),
(5, 'East Branch Hub', 'Tech District', 1, CURRENT_TIMESTAMP);

-- 2. Insert Users
-- The hash used here is pbkdf2:sha256 for 'password123'
-- Roles are: admin, manager, accounting, cashier
INSERT OR IGNORE INTO users (id, username, password_hash, role, theme_preference, branch_id, is_active, created_at) VALUES 
(1, 'admin', 'pbkdf2:sha256:600000$PWT0Gxbj5v6M9wA2$4c4e7f3c4d7b1e8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a', 'admin', 'dusk', 1, 1, CURRENT_TIMESTAMP),
(2, 'manager_main', 'pbkdf2:sha256:600000$PWT0Gxbj5v6M9wA2$4c4e7f3c4d7b1e8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a', 'manager', 'dusk', 1, 1, CURRENT_TIMESTAMP),
(3, 'manager_north', 'pbkdf2:sha256:600000$PWT0Gxbj5v6M9wA2$4c4e7f3c4d7b1e8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a', 'manager', 'dawn', 2, 1, CURRENT_TIMESTAMP),
(4, 'accountant_1', 'pbkdf2:sha256:600000$PWT0Gxbj5v6M9wA2$4c4e7f3c4d7b1e8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a', 'accounting', 'midnight', 1, 1, CURRENT_TIMESTAMP),
(5, 'cashier_main_1', 'pbkdf2:sha256:600000$PWT0Gxbj5v6M9wA2$4c4e7f3c4d7b1e8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a', 'cashier', 'dusk', 1, 1, CURRENT_TIMESTAMP),
(6, 'cashier_main_2', 'pbkdf2:sha256:600000$PWT0Gxbj5v6M9wA2$4c4e7f3c4d7b1e8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a', 'cashier', 'dawn', 1, 1, CURRENT_TIMESTAMP),
(7, 'cashier_north_1', 'pbkdf2:sha256:600000$PWT0Gxbj5v6M9wA2$4c4e7f3c4d7b1e8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a', 'cashier', 'dusk', 2, 1, CURRENT_TIMESTAMP),
(8, 'cashier_south_1', 'pbkdf2:sha256:600000$PWT0Gxbj5v6M9wA2$4c4e7f3c4d7b1e8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a', 'cashier', 'midnight', 3, 1, CURRENT_TIMESTAMP),
(9, 'manager_south', 'pbkdf2:sha256:600000$PWT0Gxbj5v6M9wA2$4c4e7f3c4d7b1e8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a', 'manager', 'dusk', 3, 1, CURRENT_TIMESTAMP),
(10, 'cashier_west_1', 'pbkdf2:sha256:600000$PWT0Gxbj5v6M9wA2$4c4e7f3c4d7b1e8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a', 'cashier', 'dawn', 4, 1, CURRENT_TIMESTAMP);

-- 3. Insert Customers (For Loan/Credit accounts)
INSERT OR IGNORE INTO customers (id, name, contact, outstanding_balance, created_at) VALUES 
(1, 'John Doe', '555-0100', 0.0, CURRENT_TIMESTAMP),
(2, 'Jane Smith', '555-0101', 150.50, CURRENT_TIMESTAMP),
(3, 'Acme Corp', '555-0102', 0.0, CURRENT_TIMESTAMP),
(4, 'Bob Builder', '555-0103', 45.00, CURRENT_TIMESTAMP),
(5, 'Alice Wonderland', '555-0104', 320.00, CURRENT_TIMESTAMP),
(6, 'Charlie Brown', '555-0105', 0.0, CURRENT_TIMESTAMP),
(7, 'Diana Prince', '555-0106', 0.0, CURRENT_TIMESTAMP),
(8, 'Evan Wright', '555-0107', 12.75, CURRENT_TIMESTAMP),
(9, 'Fiona Shrek', '555-0108', 0.0, CURRENT_TIMESTAMP),
(10, 'George Washington', '555-0109', 500.00, CURRENT_TIMESTAMP);

-- 4. Insert Products (Diverse Categories)
INSERT OR IGNORE INTO products (id, name, sku, price, category, is_active, low_stock_threshold, created_at) VALUES 
(1, 'Durex Condoms 3pk', 'CON-DUR-03', 15.99, 'Pharmacy', 1, 10, CURRENT_TIMESTAMP),
(2, 'Trojan Magnum 3pk', 'CON-TRO-03', 16.99, 'Pharmacy', 1, 10, CURRENT_TIMESTAMP),
(3, 'Red Bull Energy 250ml', 'BEV-RB-250', 3.50, 'Beverages', 1, 24, CURRENT_TIMESTAMP),
(4, 'Monster Energy Green', 'BEV-MON-500', 3.99, 'Beverages', 1, 24, CURRENT_TIMESTAMP),
(5, 'Coca-Cola 330ml Can', 'BEV-COK-330', 1.50, 'Beverages', 1, 48, CURRENT_TIMESTAMP),
(6, 'Sprite 330ml Can', 'BEV-SPR-330', 1.50, 'Beverages', 1, 48, CURRENT_TIMESTAMP),
(7, 'Marlboro Red 20s', 'TOB-MAR-RED', 14.50, 'Tobacco', 1, 20, CURRENT_TIMESTAMP),
(8, 'Marlboro Gold 20s', 'TOB-MAR-GLD', 14.50, 'Tobacco', 1, 20, CURRENT_TIMESTAMP),
(9, 'Camel Blue 20s', 'TOB-CAM-BLU', 13.99, 'Tobacco', 1, 20, CURRENT_TIMESTAMP),
(10, 'Elf Bar 600 Watermelon', 'VAP-ELF-WAT', 8.99, 'Vapes', 1, 15, CURRENT_TIMESTAMP),
(11, 'Elf Bar 600 Blueberry', 'VAP-ELF-BLU', 8.99, 'Vapes', 1, 15, CURRENT_TIMESTAMP),
(12, 'Juul Pods Mint 4pk', 'VAP-JUL-MNT', 19.99, 'Vapes', 1, 10, CURRENT_TIMESTAMP),
(13, 'Lays Classic 50g', 'SNC-LAY-CLS', 2.00, 'Snacks', 1, 20, CURRENT_TIMESTAMP),
(14, 'Doritos Nacho Cheese 50g', 'SNC-DOR-NAC', 2.00, 'Snacks', 1, 20, CURRENT_TIMESTAMP),
(15, 'Snickers Bar 50g', 'SNC-SNI-50', 1.50, 'Snacks', 1, 30, CURRENT_TIMESTAMP),
(16, 'M&Ms Peanut 45g', 'SNC-MM-PNT', 1.50, 'Snacks', 1, 30, CURRENT_TIMESTAMP),
(17, 'Tylenol Extra Strength 24ct', 'PHR-TYL-24', 6.99, 'Pharmacy', 1, 12, CURRENT_TIMESTAMP),
(18, 'Advil Liqui-Gels 20ct', 'PHR-ADV-20', 7.49, 'Pharmacy', 1, 12, CURRENT_TIMESTAMP),
(19, 'Bic Lighter Standard', 'MIS-BIC-STD', 2.50, 'Misc', 1, 50, CURRENT_TIMESTAMP),
(20, 'AA Batteries 4pk Energizer', 'BAT-ENE-AA4', 6.50, 'Misc', 1, 15, CURRENT_TIMESTAMP),
(21, 'AAA Batteries 4pk Energizer', 'BAT-ENE-AAA4', 6.50, 'Misc', 1, 15, CURRENT_TIMESTAMP),
(22, 'Gatorade Blue Frost 500ml', 'BEV-GAT-BLU', 2.99, 'Beverages', 1, 24, CURRENT_TIMESTAMP),
(23, 'SmartWater 1L', 'BEV-SMT-1L', 2.50, 'Beverages', 1, 24, CURRENT_TIMESTAMP),
(24, 'Orbit Peppermint Gum', 'SNC-ORB-PEP', 1.99, 'Snacks', 1, 30, CURRENT_TIMESTAMP),
(25, 'Skittles Original 60g', 'SNC-SKI-ORG', 1.99, 'Snacks', 1, 20, CURRENT_TIMESTAMP);


-- 5. Insert Branch Stock (Give all branches standard starting inventory)
-- Main Branch (1)
INSERT OR IGNORE INTO branch_stock (branch_id, product_id, quantity) VALUES 
(1, 1, 50), (1, 2, 45), (1, 3, 100), (1, 4, 100), (1, 5, 200), (1, 6, 180),
(1, 7, 120), (1, 8, 120), (1, 9, 80), (1, 10, 60), (1, 11, 60), (1, 12, 40),
(1, 13, 80), (1, 14, 80), (1, 15, 100), (1, 16, 100), (1, 17, 30), (1, 18, 30),
(1, 19, 150), (1, 20, 50), (1, 21, 50), (1, 22, 90), (1, 23, 120), (1, 24, 60), (1, 25, 60);

-- Northside Kiosk (2) - Smaller inventory
INSERT OR IGNORE INTO branch_stock (branch_id, product_id, quantity) VALUES 
(2, 1, 20), (2, 3, 40), (2, 5, 60), (2, 7, 50), (2, 10, 30),
(2, 13, 30), (2, 15, 40), (2, 19, 40), (2, 23, 50), (2, 24, 30);

-- Southside Depot (3) - High inventory for bulk items
INSERT OR IGNORE INTO branch_stock (branch_id, product_id, quantity) VALUES 
(3, 3, 200), (3, 4, 180), (3, 5, 300), (3, 6, 250), (3, 7, 200),
(3, 8, 200), (3, 13, 150), (3, 14, 150), (3, 22, 100), (3, 23, 150);

-- West End (4) / East Hub (5)
INSERT OR IGNORE INTO branch_stock (branch_id, product_id, quantity) VALUES 
(4, 1, 30), (4, 3, 50), (4, 5, 80), (5, 7, 60), (5, 10, 40),
(5, 15, 50), (4, 19, 50), (5, 23, 80), (4, 24, 40), (5, 25, 50);

COMMIT;
