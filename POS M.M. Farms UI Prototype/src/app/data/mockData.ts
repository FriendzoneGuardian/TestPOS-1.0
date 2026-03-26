// ===================== TYPES =====================

export interface Store {
  id: string;
  name: string;
  location: string;
  terminalId: string;
}

export interface Employee {
  id: string;
  fullName: string;
  username: string;
  password: string;
  role: 'Admin' | 'Manager' | 'Cashier';
  status: 'Active' | 'Inactive';
  storeIds: string[];
  createdAt: string;
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  category: string;
  unitPrice: number;
  costPrice: number;
  qty: number;
  reorderLevel: number;
  status: 'Active' | 'Inactive';
}

export interface TransactionItem {
  productId: string;
  productName: string;
  qty: number;
  unitPrice: number;
  costPrice: number;
}

export interface Transaction {
  id: string;
  storeId: string;
  date: string;
  type: 'Cash' | 'Credit';
  total: number;
  employeeId: string;
  employeeName: string;
  creditEmployeeId?: string;
  creditEmployeeName?: string;
  items: TransactionItem[];
  itemCount: number;
  status: 'Completed' | 'Voided';
}

export interface CreditLedgerEntry {
  id: string;
  storeId: string;
  employeeId: string;
  employeeName: string;
  date: string;
  transactionId: string;
  amount: number;
  type: 'Purchase' | 'Payment';
  runningBalance: number;
  payrollPeriod: string;
  dueDate: string;
  status: 'Current' | 'Due' | 'Deducted';
  notes: string;
}

export interface CashSession {
  id: string;
  storeId: string;
  employeeId: string;
  employeeName: string;
  openingBalance: number;
  openingTime: string;
  closingBalance?: number;
  closingTime?: string;
  cashSalesTotal: number;
  expectedCash?: number;
  actualCash?: number;
  variance?: number;
  varianceStatus?: 'Balanced' | 'Shortage' | 'Overage';
  status: 'Active' | 'Closed';
  terminalId: string;
}

export interface InventoryHistory {
  id: string;
  storeId: string;
  productId: string;
  productName: string;
  date: string;
  type: 'Restock' | 'Sale' | 'Adjustment' | 'Transfer-In' | 'Transfer-Out';
  qtyChange: number;
  qtyBefore: number;
  qtyAfter: number;
  employeeId: string;
  employeeName: string;
  notes: string;
}

// ===================== STORES =====================
export const stores: Store[] = [
  { id: 'STORE-01', name: 'Main Branch', location: 'Laguna', terminalId: 'POS-MAIN-01' },
  { id: 'STORE-02', name: 'Branch 2', location: 'Cavite', terminalId: 'POS-CVT-01' },
];

// ===================== EMPLOYEES =====================
export const employees: Employee[] = [
  {
    id: 'EMP-001', fullName: 'Maria Santos', username: 'msantos', password: 'admin123',
    role: 'Admin', status: 'Active', storeIds: ['STORE-01', 'STORE-02'], createdAt: '2023-01-15',
  },
  {
    id: 'EMP-002', fullName: 'Juan Dela Cruz', username: 'jdelacruz', password: 'jdc2026',
    role: 'Manager', status: 'Active', storeIds: ['STORE-01'], createdAt: '2023-03-20',
  },
  {
    id: 'EMP-003', fullName: 'Ana Reyes', username: 'areyes', password: 'ana2026',
    role: 'Cashier', status: 'Active', storeIds: ['STORE-01'], createdAt: '2023-05-10',
  },
  {
    id: 'EMP-004', fullName: 'Pedro Bautista', username: 'pbautista', password: 'pedro2026',
    role: 'Cashier', status: 'Active', storeIds: ['STORE-02'], createdAt: '2023-06-01',
  },
  {
    id: 'EMP-005', fullName: 'Elena Garcia', username: 'egarcia', password: 'elena2026',
    role: 'Cashier', status: 'Inactive', storeIds: ['STORE-01', 'STORE-02'], createdAt: '2023-02-14',
  },
  {
    id: 'EMP-006', fullName: 'Roberto Villanueva', username: 'rvillanueva', password: 'robv2026',
    role: 'Manager', status: 'Active', storeIds: ['STORE-02'], createdAt: '2023-04-05',
  },
  {
    id: 'EMP-007', fullName: 'Lisa Mendoza', username: 'lmendoza', password: 'lisa2026',
    role: 'Cashier', status: 'Active', storeIds: ['STORE-02'], createdAt: '2024-01-08',
  },
];

// ===================== PRODUCTS — STORE-01 =====================
const productsStore01: Product[] = [
  { id: 'PRD-S1-001', storeId: 'STORE-01', name: 'Premium Rice 25kg', category: 'Grains', unitPrice: 1250.00, costPrice: 950.00, qty: 45, reorderLevel: 10, status: 'Active' },
  { id: 'PRD-S1-002', storeId: 'STORE-01', name: 'Cooking Oil 1L', category: 'Oils', unitPrice: 85.00, costPrice: 65.00, qty: 3, reorderLevel: 20, status: 'Active' },
  { id: 'PRD-S1-003', storeId: 'STORE-01', name: 'White Sugar 1kg', category: 'Sweeteners', unitPrice: 75.00, costPrice: 58.00, qty: 120, reorderLevel: 30, status: 'Active' },
  { id: 'PRD-S1-004', storeId: 'STORE-01', name: 'Coffee 3in1 Box (30pcs)', category: 'Beverages', unitPrice: 125.00, costPrice: 95.00, qty: 8, reorderLevel: 25, status: 'Active' },
  { id: 'PRD-S1-005', storeId: 'STORE-01', name: 'Canned Sardines 155g', category: 'Canned Goods', unitPrice: 35.00, costPrice: 25.00, qty: 0, reorderLevel: 50, status: 'Active' },
  { id: 'PRD-S1-006', storeId: 'STORE-01', name: 'Laundry Detergent 1kg', category: 'Cleaning', unitPrice: 95.00, costPrice: 70.00, qty: 35, reorderLevel: 15, status: 'Active' },
  { id: 'PRD-S1-007', storeId: 'STORE-01', name: 'Condensed Milk 300ml', category: 'Dairy', unitPrice: 55.00, costPrice: 42.00, qty: 60, reorderLevel: 20, status: 'Active' },
  { id: 'PRD-S1-008', storeId: 'STORE-01', name: 'Instant Noodles (24pcs)', category: 'Noodles', unitPrice: 240.00, costPrice: 180.00, qty: 5, reorderLevel: 10, status: 'Active' },
  { id: 'PRD-S1-009', storeId: 'STORE-01', name: 'Shampoo 200ml', category: 'Personal Care', unitPrice: 115.00, costPrice: 85.00, qty: 22, reorderLevel: 12, status: 'Active' },
  { id: 'PRD-S1-010', storeId: 'STORE-01', name: 'Bath Soap Bar', category: 'Personal Care', unitPrice: 45.00, costPrice: 32.00, qty: 48, reorderLevel: 20, status: 'Inactive' },
  { id: 'PRD-S1-011', storeId: 'STORE-01', name: 'Vinegar 1L', category: 'Condiments', unitPrice: 35.00, costPrice: 25.00, qty: 4, reorderLevel: 15, status: 'Active' },
  { id: 'PRD-S1-012', storeId: 'STORE-01', name: 'Soy Sauce 1L', category: 'Condiments', unitPrice: 55.00, costPrice: 40.00, qty: 18, reorderLevel: 15, status: 'Active' },
  { id: 'PRD-S1-013', storeId: 'STORE-01', name: 'Mineral Water (12pcs)', category: 'Beverages', unitPrice: 95.00, costPrice: 70.00, qty: 30, reorderLevel: 15, status: 'Active' },
  { id: 'PRD-S1-014', storeId: 'STORE-01', name: 'Cornstarch 250g', category: 'Baking', unitPrice: 42.00, costPrice: 30.00, qty: 2, reorderLevel: 10, status: 'Active' },
  { id: 'PRD-S1-015', storeId: 'STORE-01', name: 'Bleach 1L', category: 'Cleaning', unitPrice: 45.00, costPrice: 30.00, qty: 25, reorderLevel: 10, status: 'Active' },
];

// ===================== PRODUCTS — STORE-02 =====================
const productsStore02: Product[] = [
  { id: 'PRD-S2-001', storeId: 'STORE-02', name: 'Premium Rice 25kg', category: 'Grains', unitPrice: 1280.00, costPrice: 970.00, qty: 30, reorderLevel: 10, status: 'Active' },
  { id: 'PRD-S2-002', storeId: 'STORE-02', name: 'Cooking Oil 1L', category: 'Oils', unitPrice: 88.00, costPrice: 66.00, qty: 25, reorderLevel: 20, status: 'Active' },
  { id: 'PRD-S2-003', storeId: 'STORE-02', name: 'White Sugar 1kg', category: 'Sweeteners', unitPrice: 78.00, costPrice: 60.00, qty: 80, reorderLevel: 30, status: 'Active' },
  { id: 'PRD-S2-004', storeId: 'STORE-02', name: 'Canned Tuna 155g', category: 'Canned Goods', unitPrice: 42.00, costPrice: 30.00, qty: 0, reorderLevel: 40, status: 'Active' },
  { id: 'PRD-S2-005', storeId: 'STORE-02', name: 'Instant Noodles (24pcs)', category: 'Noodles', unitPrice: 245.00, costPrice: 185.00, qty: 20, reorderLevel: 10, status: 'Active' },
  { id: 'PRD-S2-006', storeId: 'STORE-02', name: 'Coffee 3in1 Box (30pcs)', category: 'Beverages', unitPrice: 128.00, costPrice: 97.00, qty: 6, reorderLevel: 15, status: 'Active' },
  { id: 'PRD-S2-007', storeId: 'STORE-02', name: 'Laundry Detergent 1kg', category: 'Cleaning', unitPrice: 98.00, costPrice: 72.00, qty: 40, reorderLevel: 15, status: 'Active' },
  { id: 'PRD-S2-008', storeId: 'STORE-02', name: 'Bath Soap Bar', category: 'Personal Care', unitPrice: 47.00, costPrice: 33.00, qty: 55, reorderLevel: 20, status: 'Active' },
  { id: 'PRD-S2-009', storeId: 'STORE-02', name: 'Soy Sauce 1L', category: 'Condiments', unitPrice: 58.00, costPrice: 42.00, qty: 12, reorderLevel: 15, status: 'Active' },
  { id: 'PRD-S2-010', storeId: 'STORE-02', name: 'Mineral Water (12pcs)', category: 'Beverages', unitPrice: 98.00, costPrice: 72.00, qty: 45, reorderLevel: 15, status: 'Active' },
  { id: 'PRD-S2-011', storeId: 'STORE-02', name: 'Sardines 155g', category: 'Canned Goods', unitPrice: 36.00, costPrice: 26.00, qty: 3, reorderLevel: 40, status: 'Active' },
  { id: 'PRD-S2-012', storeId: 'STORE-02', name: 'Vinegar 1L', category: 'Condiments', unitPrice: 37.00, costPrice: 26.00, qty: 22, reorderLevel: 15, status: 'Active' },
];

export const products: Product[] = [...productsStore01, ...productsStore02];

// ===================== TRANSACTIONS — STORE-01 =====================
const txnsStore01: Transaction[] = [
  {
    id: 'TXN-S1-20260303-001', storeId: 'STORE-01', date: '2026-03-03', type: 'Cash', total: 1250.00,
    employeeId: 'EMP-003', employeeName: 'Ana Reyes', itemCount: 1, status: 'Completed',
    items: [{ productId: 'PRD-S1-001', productName: 'Premium Rice 25kg', qty: 1, unitPrice: 1250.00, costPrice: 950.00 }],
  },
  {
    id: 'TXN-S1-20260303-002', storeId: 'STORE-01', date: '2026-03-03', type: 'Credit', total: 310.00,
    employeeId: 'EMP-003', employeeName: 'Ana Reyes', creditEmployeeId: 'EMP-002', creditEmployeeName: 'Juan Dela Cruz',
    itemCount: 3, status: 'Completed',
    items: [
      { productId: 'PRD-S1-002', productName: 'Cooking Oil 1L', qty: 2, unitPrice: 85.00, costPrice: 65.00 },
      { productId: 'PRD-S1-003', productName: 'White Sugar 1kg', qty: 1, unitPrice: 75.00, costPrice: 58.00 },
      { productId: 'PRD-S1-007', productName: 'Condensed Milk 300ml', qty: 1, unitPrice: 55.00, costPrice: 42.00 },
    ],
  },
  {
    id: 'TXN-S1-20260303-003', storeId: 'STORE-01', date: '2026-03-03', type: 'Cash', total: 345.00,
    employeeId: 'EMP-003', employeeName: 'Ana Reyes', itemCount: 2, status: 'Completed',
    items: [
      { productId: 'PRD-S1-006', productName: 'Laundry Detergent 1kg', qty: 2, unitPrice: 95.00, costPrice: 70.00 },
      { productId: 'PRD-S1-015', productName: 'Bleach 1L', qty: 3, unitPrice: 45.00, costPrice: 30.00 },
    ],
  },
  {
    id: 'TXN-S1-20260302-001', storeId: 'STORE-01', date: '2026-03-02', type: 'Cash', total: 2100.00,
    employeeId: 'EMP-003', employeeName: 'Ana Reyes', itemCount: 4, status: 'Completed',
    items: [
      { productId: 'PRD-S1-001', productName: 'Premium Rice 25kg', qty: 1, unitPrice: 1250.00, costPrice: 950.00 },
      { productId: 'PRD-S1-013', productName: 'Mineral Water (12pcs)', qty: 3, unitPrice: 95.00, costPrice: 70.00 },
      { productId: 'PRD-S1-004', productName: 'Coffee 3in1 Box (30pcs)', qty: 4, unitPrice: 125.00, costPrice: 95.00 },
      { productId: 'PRD-S1-003', productName: 'White Sugar 1kg', qty: 2, unitPrice: 75.00, costPrice: 58.00 },
    ],
  },
  {
    id: 'TXN-S1-20260302-002', storeId: 'STORE-01', date: '2026-03-02', type: 'Credit', total: 140.00,
    employeeId: 'EMP-003', employeeName: 'Ana Reyes', creditEmployeeId: 'EMP-002', creditEmployeeName: 'Juan Dela Cruz',
    itemCount: 2, status: 'Completed',
    items: [
      { productId: 'PRD-S1-003', productName: 'White Sugar 1kg', qty: 1, unitPrice: 75.00, costPrice: 58.00 },
      { productId: 'PRD-S1-012', productName: 'Soy Sauce 1L', qty: 1, unitPrice: 55.00, costPrice: 40.00 },
    ],
  },
  {
    id: 'TXN-S1-20260301-001', storeId: 'STORE-01', date: '2026-03-01', type: 'Cash', total: 1875.00,
    employeeId: 'EMP-003', employeeName: 'Ana Reyes', itemCount: 5, status: 'Completed',
    items: [
      { productId: 'PRD-S1-001', productName: 'Premium Rice 25kg', qty: 1, unitPrice: 1250.00, costPrice: 950.00 },
      { productId: 'PRD-S1-009', productName: 'Shampoo 200ml', qty: 2, unitPrice: 115.00, costPrice: 85.00 },
      { productId: 'PRD-S1-007', productName: 'Condensed Milk 300ml', qty: 4, unitPrice: 55.00, costPrice: 42.00 },
      { productId: 'PRD-S1-006', productName: 'Laundry Detergent 1kg', qty: 1, unitPrice: 95.00, costPrice: 70.00 },
    ],
  },
  {
    id: 'TXN-S1-20260228-001', storeId: 'STORE-01', date: '2026-02-28', type: 'Cash', total: 890.00,
    employeeId: 'EMP-003', employeeName: 'Ana Reyes', itemCount: 3, status: 'Completed',
    items: [
      { productId: 'PRD-S1-008', productName: 'Instant Noodles (24pcs)', qty: 2, unitPrice: 240.00, costPrice: 180.00 },
      { productId: 'PRD-S1-013', productName: 'Mineral Water (12pcs)', qty: 3, unitPrice: 95.00, costPrice: 70.00 },
      { productId: 'PRD-S1-011', productName: 'Vinegar 1L', qty: 5, unitPrice: 35.00, costPrice: 25.00 },
    ],
  },
  {
    id: 'TXN-S1-20260226-001', storeId: 'STORE-01', date: '2026-02-26', type: 'Cash', total: 2200.00,
    employeeId: 'EMP-002', employeeName: 'Juan Dela Cruz', itemCount: 5, status: 'Completed',
    items: [
      { productId: 'PRD-S1-001', productName: 'Premium Rice 25kg', qty: 1, unitPrice: 1250.00, costPrice: 950.00 },
      { productId: 'PRD-S1-004', productName: 'Coffee 3in1 Box (30pcs)', qty: 6, unitPrice: 125.00, costPrice: 95.00 },
      { productId: 'PRD-S1-006', productName: 'Laundry Detergent 1kg', qty: 2, unitPrice: 95.00, costPrice: 70.00 },
      { productId: 'PRD-S1-007', productName: 'Condensed Milk 300ml', qty: 3, unitPrice: 55.00, costPrice: 42.00 },
    ],
  },
];

// ===================== TRANSACTIONS — STORE-02 =====================
const txnsStore02: Transaction[] = [
  {
    id: 'TXN-S2-20260303-001', storeId: 'STORE-02', date: '2026-03-03', type: 'Cash', total: 1560.00,
    employeeId: 'EMP-004', employeeName: 'Pedro Bautista', itemCount: 3, status: 'Completed',
    items: [
      { productId: 'PRD-S2-001', productName: 'Premium Rice 25kg', qty: 1, unitPrice: 1280.00, costPrice: 970.00 },
      { productId: 'PRD-S2-002', productName: 'Cooking Oil 1L', qty: 2, unitPrice: 88.00, costPrice: 66.00 },
      { productId: 'PRD-S2-003', productName: 'White Sugar 1kg', qty: 1, unitPrice: 78.00, costPrice: 60.00 },
    ],
  },
  {
    id: 'TXN-S2-20260303-002', storeId: 'STORE-02', date: '2026-03-03', type: 'Credit', total: 325.00,
    employeeId: 'EMP-004', employeeName: 'Pedro Bautista', creditEmployeeId: 'EMP-006', creditEmployeeName: 'Roberto Villanueva',
    itemCount: 2, status: 'Completed',
    items: [
      { productId: 'PRD-S2-005', productName: 'Instant Noodles (24pcs)', qty: 1, unitPrice: 245.00, costPrice: 185.00 },
      { productId: 'PRD-S2-010', productName: 'Mineral Water (12pcs)', qty: 1, unitPrice: 98.00, costPrice: 72.00 },
    ],
  },
  {
    id: 'TXN-S2-20260302-001', storeId: 'STORE-02', date: '2026-03-02', type: 'Cash', total: 980.00,
    employeeId: 'EMP-004', employeeName: 'Pedro Bautista', itemCount: 4, status: 'Completed',
    items: [
      { productId: 'PRD-S2-006', productName: 'Coffee 3in1 Box (30pcs)', qty: 3, unitPrice: 128.00, costPrice: 97.00 },
      { productId: 'PRD-S2-007', productName: 'Laundry Detergent 1kg', qty: 4, unitPrice: 98.00, costPrice: 72.00 },
      { productId: 'PRD-S2-003', productName: 'White Sugar 1kg', qty: 2, unitPrice: 78.00, costPrice: 60.00 },
    ],
  },
  {
    id: 'TXN-S2-20260301-001', storeId: 'STORE-02', date: '2026-03-01', type: 'Credit', total: 550.00,
    employeeId: 'EMP-004', employeeName: 'Pedro Bautista', creditEmployeeId: 'EMP-004', creditEmployeeName: 'Pedro Bautista',
    itemCount: 3, status: 'Completed',
    items: [
      { productId: 'PRD-S2-001', productName: 'Premium Rice 25kg', qty: 0, unitPrice: 0, costPrice: 0 },
      { productId: 'PRD-S2-008', productName: 'Bath Soap Bar', qty: 5, unitPrice: 47.00, costPrice: 33.00 },
      { productId: 'PRD-S2-010', productName: 'Mineral Water (12pcs)', qty: 3, unitPrice: 98.00, costPrice: 72.00 },
      { productId: 'PRD-S2-009', productName: 'Soy Sauce 1L', qty: 5, unitPrice: 58.00, costPrice: 42.00 },
    ],
  },
  {
    id: 'TXN-S2-20260228-001', storeId: 'STORE-02', date: '2026-02-28', type: 'Cash', total: 1420.00,
    employeeId: 'EMP-007', employeeName: 'Lisa Mendoza', itemCount: 4, status: 'Completed',
    items: [
      { productId: 'PRD-S2-001', productName: 'Premium Rice 25kg', qty: 1, unitPrice: 1280.00, costPrice: 970.00 },
      { productId: 'PRD-S2-008', productName: 'Bath Soap Bar', qty: 3, unitPrice: 47.00, costPrice: 33.00 },
    ],
  },
  {
    id: 'TXN-S2-20260227-001', storeId: 'STORE-02', date: '2026-02-27', type: 'Cash', total: 756.00,
    employeeId: 'EMP-007', employeeName: 'Lisa Mendoza', itemCount: 5, status: 'Completed',
    items: [
      { productId: 'PRD-S2-005', productName: 'Instant Noodles (24pcs)', qty: 2, unitPrice: 245.00, costPrice: 185.00 },
      { productId: 'PRD-S2-002', productName: 'Cooking Oil 1L', qty: 3, unitPrice: 88.00, costPrice: 66.00 },
      { productId: 'PRD-S2-012', productName: 'Vinegar 1L', qty: 3, unitPrice: 37.00, costPrice: 26.00 },
    ],
  },
];

export const transactions: Transaction[] = [...txnsStore01, ...txnsStore02];

// ===================== CREDIT LEDGER =====================
export const creditLedger: CreditLedgerEntry[] = [
  // Store-01: EMP-002 Juan Dela Cruz — balance ₱450.00
  {
    id: 'CL-S1-001', storeId: 'STORE-01', employeeId: 'EMP-002', employeeName: 'Juan Dela Cruz',
    date: '2026-02-16', transactionId: 'TXN-S1-HIST-001', amount: 310.00, type: 'Purchase',
    runningBalance: 310.00, payrollPeriod: '2026-02-16 to 2026-02-28', dueDate: '2026-02-28',
    status: 'Due', notes: 'Credit purchase — Feb 16',
  },
  {
    id: 'CL-S1-002', storeId: 'STORE-01', employeeId: 'EMP-002', employeeName: 'Juan Dela Cruz',
    date: '2026-03-02', transactionId: 'TXN-S1-20260302-002', amount: 140.00, type: 'Purchase',
    runningBalance: 450.00, payrollPeriod: '2026-03-01 to 2026-03-15', dueDate: '2026-03-15',
    status: 'Current', notes: 'Credit purchase — Mar 2',
  },
  {
    id: 'CL-S1-003', storeId: 'STORE-01', employeeId: 'EMP-002', employeeName: 'Juan Dela Cruz',
    date: '2026-03-03', transactionId: 'TXN-S1-20260303-002', amount: 310.00, type: 'Purchase',
    runningBalance: 450.00, payrollPeriod: '2026-03-01 to 2026-03-15', dueDate: '2026-03-15',
    status: 'Current', notes: 'Credit purchase — Mar 3',
  },

  // Store-02: EMP-006 Roberto Villanueva — balance ₱1,200.00
  {
    id: 'CL-S2-001', storeId: 'STORE-02', employeeId: 'EMP-006', employeeName: 'Roberto Villanueva',
    date: '2026-02-20', transactionId: 'TXN-S2-HIST-001', amount: 875.00, type: 'Purchase',
    runningBalance: 875.00, payrollPeriod: '2026-02-16 to 2026-02-28', dueDate: '2026-02-28',
    status: 'Due', notes: 'Credit purchase — Feb 20',
  },
  {
    id: 'CL-S2-002', storeId: 'STORE-02', employeeId: 'EMP-006', employeeName: 'Roberto Villanueva',
    date: '2026-03-03', transactionId: 'TXN-S2-20260303-002', amount: 325.00, type: 'Purchase',
    runningBalance: 1200.00, payrollPeriod: '2026-03-01 to 2026-03-15', dueDate: '2026-03-15',
    status: 'Current', notes: 'Credit purchase — Mar 3',
  },

  // Store-02: EMP-004 Pedro Bautista — balance ₱875.00
  {
    id: 'CL-S2-003', storeId: 'STORE-02', employeeId: 'EMP-004', employeeName: 'Pedro Bautista',
    date: '2026-03-01', transactionId: 'TXN-S2-20260301-001', amount: 550.00, type: 'Purchase',
    runningBalance: 550.00, payrollPeriod: '2026-03-01 to 2026-03-15', dueDate: '2026-03-15',
    status: 'Current', notes: 'Credit purchase — Mar 1',
  },
  {
    id: 'CL-S2-004', storeId: 'STORE-02', employeeId: 'EMP-004', employeeName: 'Pedro Bautista',
    date: '2026-03-01', transactionId: 'TXN-S2-HIST-002', amount: 325.00, type: 'Purchase',
    runningBalance: 875.00, payrollPeriod: '2026-03-01 to 2026-03-15', dueDate: '2026-03-15',
    status: 'Current', notes: 'Credit purchase — Mar 1 supplement',
  },
];

// ===================== CASH SESSIONS =====================
export const cashSessions: CashSession[] = [
  // Store-01 — ACTIVE session (Ana Reyes)
  {
    id: 'SESS-S1-20260303-001', storeId: 'STORE-01', employeeId: 'EMP-003', employeeName: 'Ana Reyes',
    openingBalance: 5000.00, openingTime: '2026-03-03T08:00:00', cashSalesTotal: 1595.00,
    status: 'Active', terminalId: 'POS-MAIN-01',
  },
  // Store-01 — Previous closed sessions
  {
    id: 'SESS-S1-20260302-001', storeId: 'STORE-01', employeeId: 'EMP-003', employeeName: 'Ana Reyes',
    openingBalance: 5000.00, openingTime: '2026-03-02T08:00:00', closingTime: '2026-03-02T20:00:00',
    cashSalesTotal: 2100.00, expectedCash: 7100.00, actualCash: 7100.00, variance: 0.00,
    varianceStatus: 'Balanced', status: 'Closed', terminalId: 'POS-MAIN-01',
  },
  {
    id: 'SESS-S1-20260301-001', storeId: 'STORE-01', employeeId: 'EMP-003', employeeName: 'Ana Reyes',
    openingBalance: 4500.00, openingTime: '2026-03-01T08:00:00', closingTime: '2026-03-01T20:00:00',
    cashSalesTotal: 1875.00, expectedCash: 6375.00, actualCash: 6300.00, variance: -75.00,
    varianceStatus: 'Shortage', status: 'Closed', terminalId: 'POS-MAIN-01',
  },
  {
    id: 'SESS-S1-20260228-001', storeId: 'STORE-01', employeeId: 'EMP-003', employeeName: 'Ana Reyes',
    openingBalance: 5000.00, openingTime: '2026-02-28T08:00:00', closingTime: '2026-02-28T19:30:00',
    cashSalesTotal: 890.00, expectedCash: 5890.00, actualCash: 5940.00, variance: 50.00,
    varianceStatus: 'Overage', status: 'Closed', terminalId: 'POS-MAIN-01',
  },

  // Store-02 — ACTIVE session (Pedro Bautista)
  {
    id: 'SESS-S2-20260303-001', storeId: 'STORE-02', employeeId: 'EMP-004', employeeName: 'Pedro Bautista',
    openingBalance: 3000.00, openingTime: '2026-03-03T07:30:00', cashSalesTotal: 1560.00,
    status: 'Active', terminalId: 'POS-CVT-01',
  },
  // Store-02 — Previous closed sessions
  {
    id: 'SESS-S2-20260302-001', storeId: 'STORE-02', employeeId: 'EMP-004', employeeName: 'Pedro Bautista',
    openingBalance: 3000.00, openingTime: '2026-03-02T07:30:00', closingTime: '2026-03-02T20:00:00',
    cashSalesTotal: 980.00, expectedCash: 3980.00, actualCash: 3980.00, variance: 0.00,
    varianceStatus: 'Balanced', status: 'Closed', terminalId: 'POS-CVT-01',
  },
  {
    id: 'SESS-S2-20260301-001', storeId: 'STORE-02', employeeId: 'EMP-007', employeeName: 'Lisa Mendoza',
    openingBalance: 2500.00, openingTime: '2026-03-01T08:00:00', closingTime: '2026-03-01T19:00:00',
    cashSalesTotal: 0, expectedCash: 2500.00, actualCash: 2500.00, variance: 0.00,
    varianceStatus: 'Balanced', status: 'Closed', terminalId: 'POS-CVT-01',
  },
];

// ===================== INVENTORY HISTORY =====================
export const inventoryHistory: InventoryHistory[] = [
  { id: 'IH-S1-001', storeId: 'STORE-01', productId: 'PRD-S1-001', productName: 'Premium Rice 25kg', date: '2026-03-01', type: 'Restock', qtyChange: 50, qtyBefore: 0, qtyAfter: 50, employeeId: 'EMP-002', employeeName: 'Juan Dela Cruz', notes: 'Regular restocking from supplier' },
  { id: 'IH-S1-002', storeId: 'STORE-01', productId: 'PRD-S1-002', productName: 'Cooking Oil 1L', date: '2026-02-25', type: 'Sale', qtyChange: -12, qtyBefore: 15, qtyAfter: 3, employeeId: 'EMP-003', employeeName: 'Ana Reyes', notes: 'Sales deduction' },
  { id: 'IH-S1-003', storeId: 'STORE-01', productId: 'PRD-S1-005', productName: 'Canned Sardines 155g', date: '2026-02-20', type: 'Sale', qtyChange: -50, qtyBefore: 50, qtyAfter: 0, employeeId: 'EMP-003', employeeName: 'Ana Reyes', notes: 'Sold out' },
  { id: 'IH-S1-004', storeId: 'STORE-01', productId: 'PRD-S1-003', productName: 'White Sugar 1kg', date: '2026-03-01', type: 'Restock', qtyChange: 100, qtyBefore: 30, qtyAfter: 130, employeeId: 'EMP-002', employeeName: 'Juan Dela Cruz', notes: 'Supplier delivery' },
  { id: 'IH-S1-005', storeId: 'STORE-01', productId: 'PRD-S1-004', productName: 'Coffee 3in1 Box', date: '2026-02-28', type: 'Adjustment', qtyChange: -3, qtyBefore: 14, qtyAfter: 11, employeeId: 'EMP-001', employeeName: 'Maria Santos', notes: 'Damaged goods write-off' },
  { id: 'IH-S2-001', storeId: 'STORE-02', productId: 'PRD-S2-001', productName: 'Premium Rice 25kg', date: '2026-03-01', type: 'Restock', qtyChange: 30, qtyBefore: 5, qtyAfter: 35, employeeId: 'EMP-006', employeeName: 'Roberto Villanueva', notes: 'Weekly restocking' },
  { id: 'IH-S2-002', storeId: 'STORE-02', productId: 'PRD-S2-004', productName: 'Canned Tuna 155g', date: '2026-02-26', type: 'Sale', qtyChange: -25, qtyBefore: 25, qtyAfter: 0, employeeId: 'EMP-004', employeeName: 'Pedro Bautista', notes: 'Sold out' },
  { id: 'IH-S2-003', storeId: 'STORE-02', productId: 'PRD-S2-006', productName: 'Coffee 3in1 Box', date: '2026-03-02', type: 'Adjustment', qtyChange: -4, qtyBefore: 10, qtyAfter: 6, employeeId: 'EMP-006', employeeName: 'Roberto Villanueva', notes: 'Expiry write-off' },
];

// ===================== HELPER: Employee Credit Balances =====================
// Computed per store from creditLedger (initial state)
export function getEmployeeCreditBalance(employeeId: string, storeId: string, ledger: CreditLedgerEntry[]): number {
  const entries = ledger.filter(e => e.employeeId === employeeId && e.storeId === storeId);
  if (entries.length === 0) return 0;
  const last = entries[entries.length - 1];
  return last.runningBalance;
}

export const CREDIT_LIMIT = 1500;
