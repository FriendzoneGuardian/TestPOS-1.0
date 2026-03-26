import { useState, useMemo } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, Printer, X } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { WinModal, WinAlert } from '../components/WinModal';
import { TransactionItem } from '../data/mockData';

const PH = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const TAX = 0.12;
const FONT = "'Segoe UI', Arial, sans-serif";

interface CartItem extends TransactionItem { maxQty: number; }

export function CashSales() {
  const { products, processCashSale, activeStore, currentUser, activeSession } = useApp();

  const storeProducts = products.filter(p => p.storeId === activeStore?.id);
  const cats = ['All', ...Array.from(new Set(storeProducts.map(p => p.category)))];

  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payment, setPayment] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastTxnId, setLastTxnId] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');

  const filtered = useMemo(() => storeProducts.filter(p =>
    p.status === 'Active' &&
    (cat === 'All' || p.category === cat) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase()))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [search, cat, storeProducts]);

  const addToCart = (p: typeof storeProducts[0]) => {
    if (p.qty === 0) return;
    setCart(prev => {
      const ex = prev.find(i => i.productId === p.id);
      if (ex) {
        if (ex.qty >= ex.maxQty) { setAlertMsg(`Cannot add more. Max stock: ${ex.maxQty} unit(s).`); setShowAlert(true); return prev; }
        return prev.map(i => i.productId === p.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { productId: p.id, productName: p.name, unitPrice: p.unitPrice, costPrice: p.costPrice, qty: 1, maxQty: p.qty }];
    });
  };

  const changeQty = (id: string, delta: number) =>
    setCart(prev => prev.map(i => i.productId === id ? { ...i, qty: Math.max(1, Math.min(i.qty + delta, i.maxQty)) } : i));
  const removeItem = (id: string) => setCart(prev => prev.filter(i => i.productId !== id));

  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const tax = subtotal * TAX;
  const grand = subtotal + tax;
  const paid = parseFloat(payment) || 0;
  const change = paid - grand;
  const canSave = cart.length > 0 && paid >= grand;

  const handleSave = () => {
    if (!activeSession) { setAlertMsg('No active cash session. Please open a session in Cash Valuting before processing sales.'); setShowAlert(true); return; }
    if (!canSave) return;
    setShowConfirm(true);
  };

  const confirmSale = () => {
    const items: TransactionItem[] = cart.map(i => ({ productId: i.productId, productName: i.productName, unitPrice: i.unitPrice, costPrice: i.costPrice, qty: i.qty }));
    const id = processCashSale(items);
    setLastTxnId(id);
    setShowConfirm(false);
    setCart([]); setPayment('');
    setShowSuccess(true);
  };

  const cancelSale = () => { setCart([]); setPayment(''); };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '12px', gap: '10px', fontFamily: FONT }}>
      {/* Title bar */}
      <div style={{ backgroundColor: '#1a3a5c', color: 'white', padding: '6px 12px', fontSize: '13px', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>■ CASH SALES — {activeStore?.name.toUpperCase()}</span>
        <span style={{ fontSize: '11px', color: '#90caf9', fontWeight: 400 }}>Cashier: {currentUser?.fullName} · {new Date().toLocaleDateString('en-PH')}</span>
      </div>

      {/* Session warning */}
      {!activeSession && (
        <div style={{ backgroundColor: '#fff3e0', border: '1px solid #ffa726', padding: '7px 12px', fontSize: '12px', color: '#e65100', display: 'flex', alignItems: 'center', gap: '7px' }}>
          ⚠ No active cash session. Open a session in <strong>Cash Valuting</strong> before processing transactions.
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', gap: '10px', overflow: 'hidden', minHeight: 0 }}>

        {/* LEFT: product panel */}
        <div style={{ width: '255px', flexShrink: 0, display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', border: '1px solid #c4cdd6', overflow: 'hidden' }}>
          <div style={{ backgroundColor: '#2c4a6e', color: 'white', padding: '5px 10px', fontSize: '12px', fontWeight: 600 }}>Product Selection</div>
          <div style={{ padding: '8px', borderBottom: '1px solid #e0e4e8', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={12} style={{ position: 'absolute', left: '7px', top: '50%', transform: 'translateY(-50%)', color: '#90a4ae' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search product name / code..." style={{ width: '100%', boxSizing: 'border-box', paddingLeft: '24px', padding: '5px 6px 5px 24px', border: '1px solid #b0bec5', fontSize: '12px', outline: 'none', fontFamily: FONT }} />
            </div>
            <select value={cat} onChange={e => setCat(e.target.value)} style={{ width: '100%', padding: '4px 6px', border: '1px solid #b0bec5', fontSize: '12px', outline: 'none', fontFamily: FONT, backgroundColor: '#f5f7f9' }}>
              {cats.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.map((p, i) => {
              const outOfStock = p.qty === 0;
              return (
                <div key={p.id} onClick={() => addToCart(p)} style={{ padding: '7px 10px', borderBottom: '1px solid #eef0f2', backgroundColor: outOfStock ? '#fff5f5' : i % 2 === 0 ? '#ffffff' : '#f8fafb', cursor: outOfStock ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: outOfStock ? '#c62828' : '#1a2636' }}>{p.name}</div>
                    <div style={{ fontSize: '10px', color: '#90a4ae' }}>{p.id} · {p.category}</div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: outOfStock ? '#c62828' : '#2e7d32' }}>
                      {outOfStock ? '⊘ OUT OF STOCK' : `${PH(p.unitPrice)}  ·  Qty: ${p.qty}`}
                    </div>
                  </div>
                  {!outOfStock && (
                    <div style={{ backgroundColor: '#1a4a8a', color: 'white', padding: '4px 7px', fontSize: '10px', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                      <Plus size={11} />
                    </div>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && <div style={{ padding: '24px', textAlign: 'center', color: '#90a4ae', fontSize: '12px' }}>No products found.</div>}
          </div>
        </div>

        {/* CENTER: Cart */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #c4cdd6', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ backgroundColor: '#2c4a6e', color: 'white', padding: '5px 10px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <ShoppingCart size={13} /> Cart Items ({cart.length} line{cart.length !== 1 ? 's' : ''})
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr style={{ backgroundColor: '#1a3a5c', color: 'white' }}>
                    {['#', 'Product Code', 'Product Name', 'Quantity', 'Unit Price', 'Subtotal', ''].map(h => (
                      <th key={h} style={{ padding: '6px 8px', textAlign: h === 'Unit Price' || h === 'Subtotal' ? 'right' : h === 'Quantity' || h === '' ? 'center' : 'left', border: '1px solid #4a6a8c', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cart.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: '#90a4ae', fontSize: '13px' }}>
                      No items added. Click a product from the left panel to add to cart.
                    </td></tr>
                  ) : cart.map((item, i) => (
                    <tr key={item.productId} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f2f5f8' }}>
                      <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', textAlign: 'center', color: '#90a4ae', fontSize: '11px' }}>{i + 1}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', fontFamily: 'monospace', fontSize: '11px', color: '#37474f' }}>{item.productId}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', fontWeight: 600 }}>{item.productName}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <button onClick={() => changeQty(item.productId, -1)} style={{ backgroundColor: '#546e7a', color: 'white', border: 'none', width: '22px', height: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={10} /></button>
                          <span style={{ minWidth: '32px', textAlign: 'center', fontWeight: 700, fontSize: '13px' }}>{item.qty}</span>
                          <button onClick={() => changeQty(item.productId, 1)} style={{ backgroundColor: '#1a4a8a', color: 'white', border: 'none', width: '22px', height: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={10} /></button>
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
              <button onClick={cancelSale} style={{ backgroundColor: '#dde2e7', color: '#374151', border: '1px solid #9aabb8', padding: '5px 16px', fontSize: '12px', cursor: 'pointer', fontFamily: FONT }}>
                <X size={12} style={{ display: 'inline', marginRight: '4px' }} />Cancel
              </button>
              <button style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#37474f', color: 'white', border: '1px solid #263238', padding: '5px 16px', fontSize: '12px', cursor: 'pointer', fontFamily: FONT }}>
                <Printer size={12} /> Print Receipt
              </button>
              <button onClick={handleSave} disabled={!canSave} style={{ backgroundColor: canSave ? '#2e7d32' : '#9e9e9e', color: 'white', border: `1px solid ${canSave ? '#1b5e20' : '#757575'}`, padding: '5px 18px', fontSize: '12px', cursor: canSave ? 'pointer' : 'not-allowed', fontFamily: FONT, fontWeight: 600 }}>
                Save Transaction
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Summary + Payment */}
        <div style={{ width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #c4cdd6' }}>
            <div style={{ backgroundColor: '#2c4a6e', color: 'white', padding: '5px 10px', fontSize: '12px', fontWeight: 600 }}>Order Summary</div>
            <div style={{ padding: '10px' }}>
              <Row label="Items:" value={cart.reduce((s, i) => s + i.qty, 0).toString()} />
              <Row label="Subtotal:" value={PH(subtotal)} />
              <Row label="VAT (12%):" value={PH(tax)} />
              <div style={{ borderTop: '2px solid #1a3a5c', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#1a2636' }}>GRAND TOTAL:</span>
                <span style={{ fontSize: '17px', fontWeight: 800, color: '#1a3a5c' }}>{PH(grand)}</span>
              </div>
            </div>
          </div>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #c4cdd6' }}>
            <div style={{ backgroundColor: '#2c4a6e', color: 'white', padding: '5px 10px', fontSize: '12px', fontWeight: 600 }}>Payment</div>
            <div style={{ padding: '10px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#546e7a', marginBottom: '3px' }}>Amount Tendered (₱):</label>
              <input type="number" min="0" step="0.01" value={payment} onChange={e => setPayment(e.target.value)} placeholder="0.00" style={{ width: '100%', boxSizing: 'border-box', padding: '7px 8px', border: '2px solid #1a4a8a', fontSize: '16px', fontWeight: 700, outline: 'none', textAlign: 'right', fontFamily: 'monospace' }} />
              <div style={{ marginTop: '8px', padding: '8px', backgroundColor: change >= 0 && payment ? '#e8f5e9' : '#f5f5f5', border: `1px solid ${change >= 0 && payment ? '#4caf50' : '#e0e0e0'}` }}>
                <div style={{ fontSize: '10px', color: '#546e7a', marginBottom: '2px' }}>CHANGE DUE:</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: change >= 0 && payment ? '#2e7d32' : '#9e9e9e', fontFamily: 'monospace' }}>
                  {payment && change >= 0 ? PH(change) : '₱0.00'}
                </div>
              </div>
              {payment && change < 0 && (
                <div style={{ marginTop: '6px', padding: '6px 8px', backgroundColor: '#ffebee', border: '1px solid #ef5350', fontSize: '11px', color: '#c62828' }}>
                  ⚠ Short by {PH(Math.abs(change))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      <WinModal title="Confirm Cash Transaction" isOpen={showConfirm} onClose={() => setShowConfirm(false)} width="390px">
        <div style={{ padding: '16px' }}>
          <p style={{ fontSize: '13px', marginBottom: '12px', color: '#1a2636' }}>Please verify the transaction details before confirming:</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', border: '1px solid #c4cdd6', marginBottom: '14px' }}>
            <tbody>
              {[['Store', activeStore?.name || ''], ['Transaction Type', 'Cash Sale'], ['Items in Cart', `${cart.reduce((s, i) => s + i.qty, 0)} unit(s)`], ['Subtotal', PH(subtotal)], ['VAT (12%)', PH(tax)], ['Grand Total', PH(grand)], ['Amount Tendered', PH(paid)], ['Change', PH(Math.max(0, change))]].map(([l, v], i) => (
                <tr key={l} style={{ backgroundColor: i % 2 === 0 ? '#f5f7f9' : '#ffffff' }}>
                  <td style={{ padding: '6px 10px', borderBottom: '1px solid #e0e4e8', color: '#546e7a', fontWeight: 600 }}>{l}:</td>
                  <td style={{ padding: '6px 10px', borderBottom: '1px solid #e0e4e8', textAlign: 'right', fontWeight: l === 'Grand Total' ? 800 : 400 }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button onClick={() => setShowConfirm(false)} style={{ backgroundColor: '#dde2e7', border: '1px solid #9aabb8', padding: '6px 18px', fontSize: '12px', cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
            <button onClick={confirmSale} style={{ backgroundColor: '#2e7d32', color: 'white', border: '1px solid #1b5e20', padding: '6px 18px', fontSize: '12px', cursor: 'pointer', fontWeight: 600, fontFamily: FONT }}>✔ Confirm &amp; Save</button>
          </div>
        </div>
      </WinModal>

      {/* Success Modal */}
      <WinModal title="Transaction Recorded" isOpen={showSuccess} onClose={() => setShowSuccess(false)} width="360px">
        <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#e8f5e9' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>✔</div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#2e7d32', marginBottom: '4px' }}>Cash Sale Saved Successfully</div>
          <div style={{ fontSize: '12px', color: '#546e7a', marginBottom: '4px' }}>Transaction ID: <strong style={{ fontFamily: 'monospace' }}>{lastTxnId}</strong></div>
          <div style={{ fontSize: '12px', color: '#546e7a', marginBottom: '16px' }}>Inventory has been updated accordingly.</div>
          <button onClick={() => setShowSuccess(false)} style={{ backgroundColor: '#1a4a8a', color: 'white', border: '1px solid #0d3a7a', padding: '6px 24px', fontSize: '12px', cursor: 'pointer', fontFamily: FONT }}>OK</button>
        </div>
      </WinModal>

      <WinAlert type="warning" message={alertMsg} isOpen={showAlert} onClose={() => setShowAlert(false)} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '12px' }}>
      <span style={{ color: '#546e7a' }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}
