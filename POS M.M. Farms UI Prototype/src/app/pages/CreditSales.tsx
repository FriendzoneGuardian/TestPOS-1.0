import { useState, useMemo } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, AlertTriangle, CheckCircle, User } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { WinModal, WinAlert } from '../components/WinModal';
import { TransactionItem, CREDIT_LIMIT } from '../data/mockData';

const PH = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const TAX = 0.12;
const FONT = "'Segoe UI', Arial, sans-serif";

interface CartItem extends TransactionItem { maxQty: number; }

export function CreditSales() {
  const { products, employees, creditLedger, processCreditSale, activeStore, currentUser } = useApp();

  const storeProducts = products.filter(p => p.storeId === activeStore?.id && p.status === 'Active');
  const cats = ['All', ...Array.from(new Set(storeProducts.map(p => p.category)))];

  // Store employees (excluding current cashier if needed — actually all active store employees can buy on credit)
  const storeEmployees = useMemo(() =>
    employees.filter(e => e.storeIds.includes(activeStore?.id || '') && e.status === 'Active'),
    [employees, activeStore]
  );

  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('All');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastTxnId, setLastTxnId] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [alertTitle, setAlertTitle] = useState('');

  // Credit balance lookup
  const getBalance = (empId: string): number => {
    if (!activeStore) return 0;
    const entries = creditLedger.filter(e => e.employeeId === empId && e.storeId === activeStore.id);
    return entries.length === 0 ? 0 : entries[entries.length - 1].runningBalance;
  };

  const selectedEmployee = storeEmployees.find(e => e.id === selectedEmployeeId);
  const currentBalance = selectedEmployeeId ? getBalance(selectedEmployeeId) : 0;

  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const tax = subtotal * TAX;
  const grand = subtotal + tax;
  const newBalance = currentBalance + grand;

  const balanceExceeded = selectedEmployeeId && currentBalance >= CREDIT_LIMIT;
  const wouldExceed = selectedEmployeeId && !balanceExceeded && newBalance > CREDIT_LIMIT;
  const canProceed = !!selectedEmployeeId && !balanceExceeded && !wouldExceed;
  const canSave = canProceed && cart.length > 0;

  const filtered = useMemo(() => storeProducts.filter(p =>
    (cat === 'All' || p.category === cat) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase()))
  ), [search, cat, storeProducts]);

  const addToCart = (p: typeof storeProducts[0]) => {
    if (p.qty === 0) return;
    setCart(prev => {
      const ex = prev.find(i => i.productId === p.id);
      if (ex) {
        if (ex.qty >= ex.maxQty) { setAlertTitle('Stock Limit'); setAlertMsg(`Maximum available stock: ${ex.maxQty} unit(s).`); setShowAlert(true); return prev; }
        return prev.map(i => i.productId === p.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { productId: p.id, productName: p.name, unitPrice: p.unitPrice, costPrice: p.costPrice, qty: 1, maxQty: p.qty }];
    });
  };

  const changeQty = (id: string, delta: number) =>
    setCart(prev => prev.map(i => i.productId === id ? { ...i, qty: Math.max(1, Math.min(i.qty + delta, i.maxQty)) } : i));
  const removeItem = (id: string) => setCart(prev => prev.filter(i => i.productId !== id));

  const handleSave = () => {
    if (!canSave) return;
    if (balanceExceeded) {
      setAlertTitle('Credit Limit Reached');
      setAlertMsg(`${selectedEmployee?.fullName}'s credit balance (${PH(currentBalance)}) has reached the ₱1,500.00 limit. Further credit purchases are blocked until the balance is settled.`);
      setShowAlert(true); return;
    }
    if (wouldExceed) {
      setAlertTitle('Transaction Blocked — Limit Exceeded');
      setAlertMsg(`This transaction (${PH(grand)}) would push the balance to ${PH(newBalance)}, exceeding the ₱1,500.00 credit limit. Available credit: ${PH(CREDIT_LIMIT - currentBalance)}`);
      setShowAlert(true); return;
    }
    setShowConfirm(true);
  };

  const confirmSale = () => {
    const items: TransactionItem[] = cart.map(i => ({ productId: i.productId, productName: i.productName, unitPrice: i.unitPrice, costPrice: i.costPrice, qty: i.qty }));
    const result = processCreditSale(items, selectedEmployeeId);
    if (result.error) {
      setAlertTitle('Error'); setAlertMsg(result.error); setShowAlert(true);
      setShowConfirm(false); return;
    }
    setLastTxnId(result.txnId);
    setShowConfirm(false);
    setCart([]); setSelectedEmployeeId('');
    setShowSuccess(true);
  };

  const cancelSale = () => { setCart([]); setSelectedEmployeeId(''); };

  const availableCredit = CREDIT_LIMIT - currentBalance;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '12px', gap: '10px', fontFamily: FONT }}>

      {/* Title */}
      <div style={{ backgroundColor: '#4a148c', color: 'white', padding: '6px 12px', fontSize: '13px', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span><CreditCard size={14} style={{ display: 'inline', marginRight: '6px' }} />CREDIT SALES — EMPLOYEE CREDIT — {activeStore?.name.toUpperCase()}</span>
        <span style={{ fontSize: '11px', color: '#e1bee7', fontWeight: 400 }}>Credit Limit: ₱1,500.00 · No Cooldown Required</span>
      </div>

      {/* Employee selection */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #c4cdd6' }}>
        <div style={{ backgroundColor: '#6a1b9a', color: 'white', padding: '5px 10px', fontSize: '12px', fontWeight: 600 }}>
          <User size={12} style={{ display: 'inline', marginRight: '5px' }} />Employee Credit Account Selection
        </div>
        <div style={{ padding: '10px 12px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ minWidth: '280px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#546e7a', marginBottom: '3px', fontWeight: 600 }}>Select Employee:</label>
            <select value={selectedEmployeeId} onChange={e => setSelectedEmployeeId(e.target.value)}
              style={{ width: '100%', padding: '5px 8px', border: '1px solid #9c27b0', fontSize: '12px', outline: 'none', fontFamily: FONT, backgroundColor: '#fdf5ff' }}>
              <option value="">— Select an employee —</option>
              {storeEmployees.map(e => {
                const bal = getBalance(e.id);
                const blocked = bal >= CREDIT_LIMIT;
                return (
                  <option key={e.id} value={e.id}>
                    {e.id} — {e.fullName} ({e.role}) {blocked ? '⊘ LIMIT REACHED' : `· Balance: ₱${bal.toFixed(2)}`}
                  </option>
                );
              })}
            </select>
          </div>
          {selectedEmployee && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <InfoBox label="Employee" value={selectedEmployee.fullName} />
              <InfoBox label="Role" value={selectedEmployee.role} />
              <InfoBox label="Current Balance" value={PH(currentBalance)} color={currentBalance >= CREDIT_LIMIT ? '#c62828' : currentBalance > 1000 ? '#e65100' : '#1a2636'} />
              <InfoBox label="Credit Limit" value={PH(CREDIT_LIMIT)} />
              <InfoBox label="Available Credit" value={PH(Math.max(0, availableCredit))} color={availableCredit <= 0 ? '#c62828' : availableCredit < 300 ? '#e65100' : '#2e7d32'} />
            </div>
          )}
        </div>

        {/* Eligibility banner */}
        {selectedEmployee && (
          <div style={{ padding: '6px 12px', borderTop: '1px solid #e0e4e8', backgroundColor: balanceExceeded || wouldExceed ? '#fff3e0' : '#e8f5e9', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {balanceExceeded && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#c62828', fontWeight: 700 }}>
                <AlertTriangle size={13} /> BLOCKED: Credit limit of ₱1,500.00 reached. Balance must be settled before further credit purchases.
              </div>
            )}
            {!balanceExceeded && wouldExceed && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#c62828', fontWeight: 700 }}>
                <AlertTriangle size={13} /> BLOCKED: Transaction would exceed limit by {PH(newBalance - CREDIT_LIMIT)}. Max additional purchase: {PH(availableCredit)}
              </div>
            )}
            {canProceed && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#2e7d32', fontWeight: 700 }}>
                <CheckCircle size={13} /> ELIGIBLE: {selectedEmployee.fullName} may proceed. Available credit: {PH(availableCredit)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Three-column body */}
      <div style={{ flex: 1, display: 'flex', gap: '10px', overflow: 'hidden', minHeight: 0 }}>

        {/* LEFT: Products */}
        <div style={{ width: '255px', flexShrink: 0, display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', border: '1px solid #c4cdd6', overflow: 'hidden' }}>
          <div style={{ backgroundColor: '#6a1b9a', color: 'white', padding: '5px 10px', fontSize: '12px', fontWeight: 600 }}>Product Selection</div>
          <div style={{ padding: '8px', borderBottom: '1px solid #e0e4e8', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={12} style={{ position: 'absolute', left: '7px', top: '50%', transform: 'translateY(-50%)', color: '#90a4ae' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search product..." style={{ width: '100%', boxSizing: 'border-box', padding: '5px 6px 5px 24px', border: '1px solid #b0bec5', fontSize: '12px', outline: 'none', fontFamily: FONT }} />
            </div>
            <select value={cat} onChange={e => setCat(e.target.value)} style={{ width: '100%', padding: '4px 6px', border: '1px solid #b0bec5', fontSize: '12px', outline: 'none', fontFamily: FONT, backgroundColor: '#f5f7f9' }}>
              {cats.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.map((p, i) => {
              const out = p.qty === 0;
              return (
                <div key={p.id} onClick={() => !out && addToCart(p)} style={{ padding: '7px 10px', borderBottom: '1px solid #eef0f2', backgroundColor: out ? '#fff5f5' : i % 2 === 0 ? '#ffffff' : '#f8fafb', cursor: out ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: out ? '#c62828' : '#1a2636' }}>{p.name}</div>
                    <div style={{ fontSize: '10px', color: '#90a4ae' }}>{p.id} · {p.category}</div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: out ? '#c62828' : '#2e7d32' }}>{out ? '⊘ OUT OF STOCK' : `${PH(p.unitPrice)} · Qty: ${p.qty}`}</div>
                  </div>
                  {!out && <div style={{ backgroundColor: '#6a1b9a', color: 'white', padding: '4px 7px', flexShrink: 0 }}><Plus size={11} /></div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* CENTER: Cart */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #c4cdd6', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ backgroundColor: '#6a1b9a', color: 'white', padding: '5px 10px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <ShoppingCart size={13} /> Credit Cart Items ({cart.length} line{cart.length !== 1 ? 's' : ''})
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr style={{ backgroundColor: '#4a148c', color: 'white' }}>
                    {['#', 'Product Code', 'Product Name', 'Quantity', 'Unit Price', 'Subtotal', ''].map(h => (
                      <th key={h} style={{ padding: '6px 8px', textAlign: h === 'Unit Price' || h === 'Subtotal' ? 'right' : h === 'Quantity' || h === '' ? 'center' : 'left', border: '1px solid #7b1fa2', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cart.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: '#90a4ae', fontSize: '13px' }}>
                      {!selectedEmployeeId ? 'Select an employee account above, then add products.' : 'No items added. Click a product from the left panel.'}
                    </td></tr>
                  ) : cart.map((item, i) => (
                    <tr key={item.productId} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f5f0fa' }}>
                      <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', textAlign: 'center', color: '#90a4ae', fontSize: '11px' }}>{i + 1}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', fontFamily: 'monospace', fontSize: '11px', color: '#37474f' }}>{item.productId}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', fontWeight: 600 }}>{item.productName}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <button onClick={() => changeQty(item.productId, -1)} style={{ backgroundColor: '#546e7a', color: 'white', border: 'none', width: '22px', height: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={10} /></button>
                          <span style={{ minWidth: '32px', textAlign: 'center', fontWeight: 700, fontSize: '13px' }}>{item.qty}</span>
                          <button onClick={() => changeQty(item.productId, 1)} style={{ backgroundColor: '#6a1b9a', color: 'white', border: 'none', width: '22px', height: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={10} /></button>
                        </div>
                      </td>
                      <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', textAlign: 'right' }}>{PH(item.unitPrice)}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', textAlign: 'right', fontWeight: 700 }}>{PH(item.unitPrice * item.qty)}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', textAlign: 'center' }}>
                        <button onClick={() => removeItem(item.productId)} style={{ backgroundColor: '#c62828', color: 'white', border: 'none', padding: '3px 7px', cursor: 'pointer' }}><Trash2 size={11} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '8px 10px', borderTop: '1px solid #c4cdd6', backgroundColor: '#f5f7f9', display: 'flex', gap: '8px', justifyContent: 'flex-end', flexShrink: 0 }}>
              <button onClick={cancelSale} style={{ backgroundColor: '#dde2e7', color: '#374151', border: '1px solid #9aabb8', padding: '5px 16px', fontSize: '12px', cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
              <button onClick={handleSave} disabled={!canSave} style={{
                backgroundColor: !canSave ? '#9e9e9e' : '#6a1b9a', color: 'white',
                border: `1px solid ${!canSave ? '#757575' : '#4a148c'}`, padding: '5px 18px', fontSize: '12px',
                cursor: !canSave ? 'not-allowed' : 'pointer', fontWeight: 600, fontFamily: FONT,
              }}>
                {balanceExceeded || wouldExceed ? '⊘ Transaction Blocked' : 'Post Credit Sale'}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Credit Summary */}
        <div style={{ width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #c4cdd6' }}>
            <div style={{ backgroundColor: '#6a1b9a', color: 'white', padding: '5px 10px', fontSize: '12px', fontWeight: 600 }}>Transaction Summary</div>
            <div style={{ padding: '10px', fontSize: '12px' }}>
              <RowItem label="Subtotal:" value={PH(subtotal)} />
              <RowItem label="VAT (12%):" value={PH(tax)} />
              <div style={{ borderTop: '2px solid #4a148c', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#4a148c' }}>TOTAL:</span>
                <span style={{ fontSize: '16px', fontWeight: 800, color: '#4a148c' }}>{PH(grand)}</span>
              </div>
            </div>
          </div>

          {selectedEmployee && (
            <div style={{ backgroundColor: '#ffffff', border: `1px solid ${balanceExceeded || wouldExceed ? '#ef5350' : '#a5d6a7'}`, overflow: 'hidden' }}>
              <div style={{ backgroundColor: balanceExceeded || wouldExceed ? '#c62828' : '#2e7d32', color: 'white', padding: '5px 10px', fontSize: '12px', fontWeight: 600 }}>
                {balanceExceeded || wouldExceed ? '⚠ Account Blocked' : '✔ Account Eligible'}
              </div>
              <div style={{ padding: '10px', fontSize: '11px' }}>
                <RowItem label="Employee:" value={selectedEmployee.fullName} />
                <RowItem label="Role:" value={selectedEmployee.role} />
                <div style={{ borderTop: '1px dashed #ccc', marginTop: '6px', paddingTop: '6px' }} />
                <RowItem label="Current Balance:" value={PH(currentBalance)} color={currentBalance >= CREDIT_LIMIT ? '#c62828' : '#1a2636'} />
                <RowItem label="This Transaction:" value={PH(grand)} />
                <RowItem label="New Balance:" value={PH(newBalance)} color={newBalance > CREDIT_LIMIT ? '#c62828' : '#1a2636'} />
                <div style={{ borderTop: '1px dashed #ccc', marginTop: '6px', paddingTop: '6px' }} />
                <RowItem label="Credit Limit:" value={PH(CREDIT_LIMIT)} />
                <RowItem label="Available Credit:" value={PH(Math.max(0, availableCredit))} color={availableCredit <= 0 ? '#c62828' : availableCredit < 300 ? '#e65100' : '#2e7d32'} />
                <div style={{ marginTop: '6px', fontSize: '10px', color: '#90a4ae', fontStyle: 'italic' }}>
                  No cooldown period applies. Credit assessed per 15-day payroll cycle.
                </div>
              </div>
            </div>
          )}

          {/* All employee balances for this store */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #c4cdd6', overflow: 'hidden' }}>
            <div style={{ backgroundColor: '#37474f', color: 'white', padding: '5px 10px', fontSize: '11px', fontWeight: 600 }}>Store Credit Summary</div>
            <div style={{ padding: '8px', fontSize: '11px' }}>
              {storeEmployees.filter(e => getBalance(e.id) > 0).map(e => {
                const bal = getBalance(e.id);
                return (
                  <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', padding: '3px 0', borderBottom: '1px dotted #eee' }}>
                    <span style={{ color: '#546e7a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '110px' }}>{e.fullName}</span>
                    <span style={{ fontWeight: 700, color: bal >= CREDIT_LIMIT ? '#c62828' : bal > 1000 ? '#e65100' : '#1a2636', fontFamily: 'monospace' }}>₱{bal.toFixed(2)}</span>
                  </div>
                );
              })}
              {storeEmployees.filter(e => getBalance(e.id) > 0).length === 0 && (
                <div style={{ color: '#90a4ae', textAlign: 'center', padding: '8px' }}>No outstanding balances</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      <WinModal title="Confirm Credit Transaction" isOpen={showConfirm} onClose={() => setShowConfirm(false)} width="420px">
        <div style={{ padding: '16px' }}>
          <p style={{ fontSize: '13px', marginBottom: '12px', color: '#1a2636' }}>
            Post this credit sale to <strong>{selectedEmployee?.fullName}</strong> ({selectedEmployee?.id})?
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', border: '1px solid #c4cdd6', marginBottom: '14px' }}>
            <tbody>
              {[
                ['Store', activeStore?.name || ''],
                ['Employee', `${selectedEmployee?.fullName} (${selectedEmployee?.role})`],
                ['Transaction Total', PH(grand)],
                ['Previous Balance', PH(currentBalance)],
                ['New Balance', PH(newBalance)],
                ['Credit Limit', PH(CREDIT_LIMIT)],
                ['Remaining Credit', PH(CREDIT_LIMIT - newBalance)],
              ].map(([l, v], i) => (
                <tr key={l} style={{ backgroundColor: i % 2 === 0 ? '#f5f7f9' : '#ffffff' }}>
                  <td style={{ padding: '6px 10px', borderBottom: '1px solid #e0e4e8', color: '#546e7a', fontWeight: 600 }}>{l}:</td>
                  <td style={{ padding: '6px 10px', borderBottom: '1px solid #e0e4e8', textAlign: 'right', fontWeight: l === 'New Balance' ? 800 : 400, color: l === 'New Balance' ? '#6a1b9a' : '#1a2636' }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button onClick={() => setShowConfirm(false)} style={{ backgroundColor: '#dde2e7', border: '1px solid #9aabb8', padding: '6px 18px', fontSize: '12px', cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
            <button onClick={confirmSale} style={{ backgroundColor: '#6a1b9a', color: 'white', border: '1px solid #4a148c', padding: '6px 18px', fontSize: '12px', cursor: 'pointer', fontWeight: 600, fontFamily: FONT }}>✔ Confirm &amp; Post</button>
          </div>
        </div>
      </WinModal>

      {/* Success Modal */}
      <WinModal title="Credit Sale Posted" isOpen={showSuccess} onClose={() => setShowSuccess(false)} width="360px">
        <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f3e5f5' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>✔</div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#6a1b9a', marginBottom: '4px' }}>Credit Sale Recorded Successfully</div>
          <div style={{ fontSize: '12px', color: '#546e7a', marginBottom: '4px' }}>Transaction ID: <strong style={{ fontFamily: 'monospace' }}>{lastTxnId}</strong></div>
          <div style={{ fontSize: '12px', color: '#546e7a', marginBottom: '16px' }}>Employee credit balance has been updated.</div>
          <button onClick={() => setShowSuccess(false)} style={{ backgroundColor: '#6a1b9a', color: 'white', border: '1px solid #4a148c', padding: '6px 24px', fontSize: '12px', cursor: 'pointer', fontFamily: FONT }}>OK</button>
        </div>
      </WinModal>

      <WinAlert type="error" message={alertMsg} isOpen={showAlert} onClose={() => setShowAlert(false)} title={alertTitle || 'Transaction Blocked'} />
    </div>
  );
}

function InfoBox({ label, value, color = '#1a2636' }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ backgroundColor: '#f5f7f9', border: '1px solid #e0e4e8', padding: '6px 10px', minWidth: '100px' }}>
      <div style={{ fontSize: '10px', color: '#78909c', marginBottom: '1px' }}>{label}</div>
      <div style={{ fontSize: '12px', fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function RowItem({ label, value, color = '#1a2636' }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
      <span style={{ color: '#546e7a' }}>{label}</span>
      <span style={{ fontWeight: 600, color }}>{value}</span>
    </div>
  );
}
