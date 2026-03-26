import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  Store, Employee, Product, Transaction, TransactionItem, CreditLedgerEntry,
  CashSession, InventoryHistory,
  stores as initialStores,
  employees as initialEmployees,
  products as initialProducts,
  transactions as initialTransactions,
  creditLedger as initialCreditLedger,
  cashSessions as initialCashSessions,
  inventoryHistory as initialInventoryHistory,
  CREDIT_LIMIT,
} from '../data/mockData';

// ── Types ──────────────────────────────────────────────────────────────────
interface AppContextValue {
  // Auth state
  currentUser: Employee | null;
  activeStore: Store | null;
  activeSession: CashSession | null;
  isAuthenticated: boolean;

  // Mutable data
  employees: Employee[];
  products: Product[];
  transactions: Transaction[];
  creditLedger: CreditLedgerEntry[];
  cashSessions: CashSession[];
  inventoryHistory: InventoryHistory[];

  // Store data (read-only reference)
  stores: Store[];

  // Auth actions
  login: (username: string, password: string) => Employee | null;
  selectStore: (storeId: string) => void;
  logout: () => void;

  // Session actions
  openSession: (openingBalance: number) => void;
  closeSession: (actualCash: number) => CashSession | null;

  // Transaction actions
  processCashSale: (items: TransactionItem[]) => string;
  processCreditSale: (items: TransactionItem[], creditEmployeeId: string) => { txnId: string; error?: string };

  // Inventory actions
  adjustInventory: (productId: string, type: 'in' | 'out' | 'set', qty: number, note: string) => void;
  saveProduct: (product: Partial<Product> & { id?: string }) => string;

  // Employee actions
  saveEmployee: (employee: Partial<Employee> & { id?: string }) => { id: string; error?: string };
  toggleEmployeeStatus: (id: string) => void;

  // Credit ledger helper
  getEmployeeBalance: (employeeId: string) => number;
  getStoreEmployees: () => Employee[];
}

// ── Context ────────────────────────────────────────────────────────────────
const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [activeStore, setActiveStore] = useState<Store | null>(null);
  const [activeSession, setActiveSession] = useState<CashSession | null>(null);

  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [creditLedger, setCreditLedger] = useState<CreditLedgerEntry[]>(initialCreditLedger);
  const [cashSessions, setCashSessions] = useState<CashSession[]>(initialCashSessions);
  const [inventoryHistory, setInventoryHistory] = useState<InventoryHistory[]>(initialInventoryHistory);

  // ── Auth ────────────────────────────────────────────────────────────────
  const login = useCallback((username: string, password: string): Employee | null => {
    const emp = employees.find(
      e => e.username === username && e.password === password && e.status === 'Active'
    );
    if (emp) setCurrentUser(emp);
    return emp ?? null;
  }, [employees]);

  const selectStore = useCallback((storeId: string) => {
    const store = initialStores.find(s => s.id === storeId);
    if (!store) return;
    setActiveStore(store);
    // Find active session for this store
    const sess = cashSessions.find(s => s.storeId === storeId && s.status === 'Active');
    setActiveSession(sess ?? null);
  }, [cashSessions]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setActiveStore(null);
    setActiveSession(null);
  }, []);

  // ── Session ─────────────────────────────────────────────────────────────
  const openSession = useCallback((openingBalance: number) => {
    if (!currentUser || !activeStore) return;
    const now = new Date().toISOString();
    const id = `SESS-${activeStore.id}-${now.slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-4)}`;
    const sess: CashSession = {
      id, storeId: activeStore.id, employeeId: currentUser.id, employeeName: currentUser.fullName,
      openingBalance, openingTime: now, cashSalesTotal: 0, status: 'Active', terminalId: activeStore.terminalId,
    };
    setCashSessions(prev => [...prev, sess]);
    setActiveSession(sess);
  }, [currentUser, activeStore]);

  const closeSession = useCallback((actualCash: number): CashSession | null => {
    if (!activeSession) return null;
    const now = new Date().toISOString();
    // Compute cash sales total since session opened
    const storeCashSales = transactions
      .filter(t => t.storeId === activeSession.storeId && t.type === 'Cash' && t.status === 'Completed')
      .reduce((s, t) => s + t.total, 0);
    const expectedCash = activeSession.openingBalance + storeCashSales;
    const variance = actualCash - expectedCash;
    const varianceStatus: CashSession['varianceStatus'] =
      Math.abs(variance) < 0.01 ? 'Balanced' : variance < 0 ? 'Shortage' : 'Overage';
    const closed: CashSession = {
      ...activeSession,
      closingTime: now, cashSalesTotal: storeCashSales, expectedCash, actualCash, variance, varianceStatus, status: 'Closed',
    };
    setCashSessions(prev => prev.map(s => s.id === activeSession.id ? closed : s));
    setActiveSession(null);
    return closed;
  }, [activeSession, transactions]);

  // ── Transactions ─────────────────────────────────────────────────────────
  const nextTxnId = (storeId: string, type: string) => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = transactions.filter(t => t.storeId === storeId && t.date.replace(/-/g, '') === dateStr).length + 1;
    return `TXN-${storeId === 'STORE-01' ? 'S1' : 'S2'}-${dateStr}-${type}${String(count).padStart(3, '0')}`;
  };

  const processCashSale = useCallback((items: TransactionItem[]): string => {
    if (!currentUser || !activeStore) return '';
    const total = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
    const id = nextTxnId(activeStore.id, 'C');
    const today = new Date().toISOString().slice(0, 10);
    const txn: Transaction = {
      id, storeId: activeStore.id, date: today, type: 'Cash', total,
      employeeId: currentUser.id, employeeName: currentUser.fullName,
      items, itemCount: items.reduce((s, i) => s + i.qty, 0), status: 'Completed',
    };
    setTransactions(prev => [txn, ...prev]);
    // Deduct inventory
    setProducts(prev => prev.map(p => {
      const item = items.find(i => i.productId === p.id);
      return item ? { ...p, qty: Math.max(0, p.qty - item.qty) } : p;
    }));
    // Update session cash total
    if (activeSession) {
      const updated = { ...activeSession, cashSalesTotal: activeSession.cashSalesTotal + total };
      setActiveSession(updated);
      setCashSessions(prev => prev.map(s => s.id === activeSession.id ? updated : s));
    }
    return id;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, activeStore, activeSession, transactions]);

  const processCreditSale = useCallback((items: TransactionItem[], creditEmployeeId: string): { txnId: string; error?: string } => {
    if (!currentUser || !activeStore) return { txnId: '', error: 'No active store.' };
    const creditEmployee = employees.find(e => e.id === creditEmployeeId);
    if (!creditEmployee) return { txnId: '', error: 'Employee not found.' };
    const total = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
    // Check credit balance
    const currentBalance = getEmpBalance(creditEmployeeId, activeStore.id, creditLedger);
    if (currentBalance >= CREDIT_LIMIT) return { txnId: '', error: `Credit limit reached. Current balance: ₱${currentBalance.toFixed(2)}` };
    if (currentBalance + total > CREDIT_LIMIT) return { txnId: '', error: `Transaction would exceed ₱1,500 limit. Available credit: ₱${(CREDIT_LIMIT - currentBalance).toFixed(2)}` };
    const id = nextTxnId(activeStore.id, 'CR');
    const today = new Date().toISOString().slice(0, 10);
    const txn: Transaction = {
      id, storeId: activeStore.id, date: today, type: 'Credit', total,
      employeeId: currentUser.id, employeeName: currentUser.fullName,
      creditEmployeeId, creditEmployeeName: creditEmployee.fullName,
      items, itemCount: items.reduce((s, i) => s + i.qty, 0), status: 'Completed',
    };
    setTransactions(prev => [txn, ...prev]);
    setProducts(prev => prev.map(p => {
      const item = items.find(i => i.productId === p.id);
      return item ? { ...p, qty: Math.max(0, p.qty - item.qty) } : p;
    }));
    const newBalance = currentBalance + total;
    const entry: CreditLedgerEntry = {
      id: `CL-${activeStore.id}-${Date.now()}`, storeId: activeStore.id,
      employeeId: creditEmployeeId, employeeName: creditEmployee.fullName,
      date: today, transactionId: id, amount: total, type: 'Purchase',
      runningBalance: newBalance,
      payrollPeriod: getPayrollPeriod(today), dueDate: getPayrollDue(today),
      status: 'Current', notes: `Credit purchase — ${today}`,
    };
    setCreditLedger(prev => [...prev, entry]);
    return { txnId: id };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, activeStore, creditLedger, employees, transactions]);

  // ── Inventory ────────────────────────────────────────────────────────────
  const adjustInventory = useCallback((productId: string, type: 'in' | 'out' | 'set', qty: number, note: string) => {
    if (!currentUser || !activeStore) return;
    setProducts(prev => prev.map(p => {
      if (p.id !== productId) return p;
      const before = p.qty;
      const after = type === 'in' ? before + qty : type === 'out' ? Math.max(0, before - qty) : qty;
      const histEntry: InventoryHistory = {
        id: `IH-${Date.now()}`, storeId: activeStore.id, productId, productName: p.name,
        date: new Date().toISOString().slice(0, 10),
        type: type === 'in' ? 'Restock' : type === 'out' ? 'Sale' : 'Adjustment',
        qtyChange: after - before, qtyBefore: before, qtyAfter: after,
        employeeId: currentUser.id, employeeName: currentUser.fullName, notes: note,
      };
      setInventoryHistory(prev2 => [histEntry, ...prev2]);
      return { ...p, qty: after };
    }));
  }, [currentUser, activeStore]);

  const saveProduct = useCallback((productData: Partial<Product> & { id?: string }): string => {
    if (!activeStore) return '';
    if (productData.id) {
      setProducts(prev => prev.map(p => p.id === productData.id ? { ...p, ...productData } : p));
      return productData.id;
    } else {
      const storePrefix = activeStore.id === 'STORE-01' ? 'S1' : 'S2';
      const storeProds = products.filter(p => p.storeId === activeStore.id);
      const newId = `PRD-${storePrefix}-${String(storeProds.length + 1).padStart(3, '0')}`;
      const newProd: Product = {
        id: newId, storeId: activeStore.id,
        name: productData.name || '', category: productData.category || '',
        unitPrice: productData.unitPrice || 0, costPrice: productData.costPrice || 0,
        qty: productData.qty || 0, reorderLevel: productData.reorderLevel || 0,
        status: productData.status || 'Active',
      };
      setProducts(prev => [...prev, newProd]);
      return newId;
    }
  }, [activeStore, products]);

  // ── Employee ─────────────────────────────────────────────────────────────
  const saveEmployee = useCallback((data: Partial<Employee> & { id?: string }): { id: string; error?: string } => {
    if (data.id) {
      if (employees.some(e => e.username === data.username && e.id !== data.id)) {
        return { id: data.id, error: 'Username already exists.' };
      }
      setEmployees(prev => prev.map(e => e.id === data.id ? { ...e, ...data } : e));
      return { id: data.id };
    } else {
      if (employees.some(e => e.username === data.username)) {
        return { id: '', error: 'Username already exists.' };
      }
      const newId = `EMP-${String(employees.length + 1).padStart(3, '0')}`;
      const newEmp: Employee = {
        id: newId, fullName: data.fullName || '', username: data.username || '',
        password: data.password || '', role: data.role || 'Cashier',
        status: data.status || 'Active', storeIds: data.storeIds || [],
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setEmployees(prev => [...prev, newEmp]);
      return { id: newId };
    }
  }, [employees]);

  const toggleEmployeeStatus = useCallback((id: string) => {
    setEmployees(prev => prev.map(e =>
      e.id === id ? { ...e, status: e.status === 'Active' ? 'Inactive' : 'Active' } : e
    ));
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const getEmployeeBalance = useCallback((employeeId: string): number => {
    if (!activeStore) return 0;
    return getEmpBalance(employeeId, activeStore.id, creditLedger);
  }, [activeStore, creditLedger]);

  const getStoreEmployees = useCallback((): Employee[] => {
    if (!activeStore) return [];
    return employees.filter(e => e.storeIds.includes(activeStore.id) && e.status === 'Active');
  }, [activeStore, employees]);

  return (
    <AppContext.Provider value={{
      currentUser, activeStore, activeSession, isAuthenticated: !!currentUser && !!activeStore,
      employees, products, transactions, creditLedger, cashSessions, inventoryHistory, stores: initialStores,
      login, selectStore, logout,
      openSession, closeSession,
      processCashSale, processCreditSale,
      adjustInventory, saveProduct,
      saveEmployee, toggleEmployeeStatus,
      getEmployeeBalance, getStoreEmployees,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// ── Pure helpers ─────────────────────────────────────────────────────────
function getEmpBalance(employeeId: string, storeId: string, ledger: CreditLedgerEntry[]): number {
  const entries = ledger.filter(e => e.employeeId === employeeId && e.storeId === storeId);
  if (entries.length === 0) return 0;
  return entries[entries.length - 1].runningBalance;
}

function getPayrollPeriod(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDate();
  const y = d.getFullYear();
  const m = d.toLocaleString('en-PH', { month: 'long' });
  return day <= 15 ? `${m} 1–15, ${y}` : `${m} 16–${new Date(y, d.getMonth() + 1, 0).getDate()}, ${y}`;
}

function getPayrollDue(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();
  const due = day <= 15 ? new Date(y, month, 15) : new Date(y, month + 1, 0);
  return due.toISOString().slice(0, 10);
}
