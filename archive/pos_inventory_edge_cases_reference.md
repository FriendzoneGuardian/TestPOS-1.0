# POS Inventory Edge Cases Reference

For VB.NET POS (POS A) and Django POS (POS B)

This document lists critical inventory edge cases that commonly break
POS systems and provides recommended solutions and mitigations. These
cases should be considered during development before deployment.

------------------------------------------------------------------------

# Case 9 --- Expiration-Sensitive Inventory (Batch / Lot Tracking)

## Possible Causes

1.  Inventory stored without batch or lot numbers.
2.  POS deducts inventory randomly instead of from the earliest expiry.
3.  Staff encode stock without expiration dates.
4.  Supplier shipments contain mixed expiration batches.
5.  System assumes one expiration date per item.
6.  Incorrect expiration format during encoding.
7.  Returns re-enter stock without original batch reference.
8.  Expired stock remains sellable in POS.
9.  Inventory adjustments remove stock from wrong batch.
10. Partial sales do not update batch quantities correctly.

## Solution

Implement batch-based inventory tracking.

Inventory table example:

inventory_batches - batch_id - item_id - quantity - expiration_date -
received_date

Use FIFO (First-Expire-First-Out) for deductions.

Example:

Batch A: 10 units (exp Jun 1) Batch B: 20 units (exp Jun 10)

Customer buys 12 units

Result: Batch A → 0 Batch B → 18

## Mitigations

1.  Prevent selling expired batches.
2.  Display expiration warnings in POS UI.
3.  Add near-expiry inventory reports.
4.  Lock expired batches automatically.
5.  Require batch numbers during stock entry.
6.  Track supplier batch numbers.
7.  Separate inventory reports by batch.
8.  Alert managers when expiration is approaching.
9.  Prevent batch merging during adjustments.
10. Record batch ID in sales records.

------------------------------------------------------------------------

# Case 10 --- Price Change During Active Sales

## Possible Causes

1.  Manager changes item price during active cashier transaction.
2.  Price sync occurs while a sale is open.
3.  POS fetches price at checkout instead of scan time.
4.  Multiple terminals cache different prices.
5.  Promotions activate mid-transaction.
6.  Network synchronization delays.
7.  Manual price override errors.
8.  Background updates overwrite cached prices.
9.  Price update scripts run during store hours.
10. Database updates lack transaction isolation.

## Solution

Use price snapshotting when items are scanned.

Transaction item structure:

transaction_items - item_id - quantity - unit_price_snapshot

Example: Price before change: ₱20 Price after change: ₱25

If scanned before change: Receipt price = ₱20

## Mitigations

1.  Price updates apply only to new scans.
2.  Maintain price history table.
3.  Restrict price updates during peak hours.
4.  Log manager price changes.
5.  Notify POS terminals of updates.
6.  Require supervisor approval for overrides.
7.  Track timestamps of price updates.
8.  Generate price discrepancy reports.
9.  Cache prices locally in POS.
10. Prevent open transactions from updating prices.

------------------------------------------------------------------------

# Case 13 --- Inventory Sold by Weight or Volume

Examples: Rice, sugar, cooking oil, meat.

## Possible Causes

1.  Inventory stored as integers instead of decimals.
2.  Floating point rounding errors.
3.  Inconsistent data from weighing scales.
4.  POS truncates decimal precision.
5.  Incorrect price-per-weight calculations.
6.  Different scale hardware across branches.
7.  Manual weight entry errors.
8.  Packaging weight mixed with product weight.
9.  Incorrect gram/kilogram conversions.
10. Precision loss during database storage.

## Solution

Use high-precision decimal storage.

Example:

stock_weight = Decimal(10,3)

Inventory example: Rice stock = 50.000 kg

Sale: 0.250 kg

Remaining: 49.750 kg

Never use floating point numbers for weight inventory.

## Mitigations

1.  Use decimal database fields.
2.  Define base units such as grams.
3.  Validate scale input values.
4.  Standardize scale hardware.
5.  Prevent rounding errors in calculations.
6.  Store price per base unit.
7.  Round only on receipt display.
8.  Log manual weight entries.
9.  Lock weight edits after confirmation.
10. Maintain scale calibration logs.

------------------------------------------------------------------------

# Case 14 --- Damage or Spoilage Inventory

Examples: Broken bottles, expired food, crushed packaging, pest damage.

## Possible Causes

1.  Staff discard items without recording damage.
2.  Inventory system only tracks sales deductions.
3.  Manual adjustments overwrite stock.
4.  Multiple users adjusting stock simultaneously.
5.  Lack of defined damage categories.
6.  Spoilage logged as generic adjustment.
7.  Staff avoid reporting damage.
8.  No approval process for write-offs.
9.  Reports fail to differentiate losses.
10. Adjustments bypass audit trails.

## Solution

Implement inventory adjustment events.

Example table:

inventory_adjustments - adjustment_id - item_id - quantity_change -
reason - user - timestamp

Example entry: Item: Soda Change: -3 Reason: Broken bottle

## Mitigations

1.  Require reason codes for adjustments.
2.  Supervisor approval for large write-offs.
3.  Separate damage reports.
4.  Lock historical adjustment records.
5.  Categorize losses (damage, spoilage, theft).
6.  Monitor adjustment frequency.
7.  Optional photo documentation.
8.  Alert managers for abnormal losses.
9.  Track responsible users.
10. Analyze damage trends across branches.

------------------------------------------------------------------------

# Case 19 --- Void After Inventory Deduction

Example scenario: Item scanned → stock deducted → cashier voids item.

Poor implementation causes stock loss.

## Possible Causes

1.  Inventory deducted immediately on scan.
2.  Void removes item from receipt but not stock.
3.  Database rollback missing.
4.  Transaction commits before void.
5.  POS lacks transaction state tracking.
6.  Network interruptions during void.
7.  Refund logic separate from sales logic.
8.  Duplicate inventory updates.
9.  Cancel after payment attempt.
10. Missing transaction recovery mechanisms.

## Solution

Deduct inventory only when transaction is finalized.

Correct flow: Scan items → build transaction → payment → finalize sale →
deduct inventory.

If void occurs before payment: No inventory change.

## Mitigations

1.  Deduct stock only on completed sales.
2.  Implement transaction rollback.
3.  Link inventory movement to sale IDs.
4.  Restore stock automatically on void.
5.  Require authorization for post-sale voids.
6.  Log void actions in audit trail.
7.  Supervisor approval for refunds.
8.  Separate void vs refund logic.
9.  Lock finalized transactions.
10. Run reconciliation checks regularly.

------------------------------------------------------------------------

End of Reference Document
