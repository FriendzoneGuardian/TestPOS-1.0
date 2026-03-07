# Scratch Pad: Alpha 1.7 — "Deep Stocking (The Backroom Edition)"

## 📦 The Current State
Right now, `Product` holds global data (SKU, Name, Price, Category) and `BranchStock` holds the many-to-many relationship tracking `quantity` per branch. Cashiers interact with this indirectly via the `/pos` by depleting stock, but nobody can actually *see* or *manage* the stock directly.

## 🚨 Feature 1: The "Stocks Warning" System
**Concept:** We need an automated way to know when we're running dry. 
- **Implementation:** Add a `low_stock_threshold` (Integer, default `10`) column to the `Product` model. 
- **The Dashboard Alert:** When a Manager or Admin logs into the Dashboard, query `BranchStock` where `quantity <= Product.low_stock_threshold`. If found, a seductive "Low Stock" alert banner ("*We're running a little dry in the back, time to restock...*") appears.
- **POS Indicator:** On the `/pos` terminal, Cashiers should see a visual indicator (e.g., a pulsating orange dot or red text) if a product is running low, preventing the awkward "oops we don't have that" moment in front of a customer.

## 📥 Feature 2: Receiving Shipments (Restocking)
**Concept:** A way to pump up the inventory numbers.
- **Implementation:** An interface for Managers/Admins to "Receive Stock".
- They select a `Product`, enter the `quantity` received, and click "Stock". This performs `BranchStock.quantity += X`.
- *Optimization:* Rather than just wildly editing numbers, a "Restock Action" creates an audit trail. However, for a slick MVP, we can just allow an explicit "Add Stock" modal that logs the action (maybe a minimal `StockMovement` table or simply relying on the UI constraint of only *adding* to stock, while Voids/Sales handle depletion).

## 🗂️ Feature 3: The Product Catalog (CRUD)
**Concept:** Adding new toys to the menu.
- **Implementation:** A standard `/products` route for Admins to create new products. 
- When a new `Product` is created, it automatically seeds a `BranchStock` row with `quantity = 0` for all active branches.

## 🎭 Role Guarding (The Velvet Rope Continuation)
- **Admin:** Can create new global Products, edit prices, set global low-stock thresholds, and receive stock for *any* branch.
- **Manager:** Can view the catalog, but can *only* Receive Stock for *their own* branch. Cannot change global prices.
- **Auditor:** Can look at the stock levels and low stock warnings across all branches, but can't touch.
- **Cashier:** Sees the low-stock indicators on the POS Terminal, but has no access to `/products` or `/inventory`.

## Database Migration Required:
1. `ALTER TABLE products ADD COLUMN low_stock_threshold INTEGER DEFAULT 10;`
