import { useNavigate } from 'react-router';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ShoppingCart, CreditCard, AlertTriangle, Receipt, TrendingUp, ArrowRight, Vault } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const PH = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const TODAY = '2026-03-05';

export function Dashboard() {
  const navigate = useNavigate();
  const { products, transactions, creditLedger, cashSessions, employees, activeStore, currentUser, activeSession } = useApp();

  if (!activeStore) return null;

  const sid = activeStore.id;

  // Filtered data for active store
  const storeProducts = products.filter(p => p.storeId === sid);
  const storeTxns = transactions.filter(t => t.storeId === sid);
  const todayTxns = storeTxns.filter(t => t.date === TODAY);
  const todayCash = todayTxns.filter(t => t.type === 'Cash').reduce((s, t) => s + t.total, 0);
  const todayCredit = todayTxns.filter(t => t.type === 'Credit').reduce((s, t) => s + t.total, 0);
  const todaySales = todayCash + todayCredit;
  const lowStockItems = storeProducts.filter(p => p.qty <= p.reorderLevel && p.status === 'Active');

  // Credit outstanding (unique employees with balance > 0)
  const storeLedger = creditLedger.filter(e => e.storeId === sid);
  const employeeBalances = new Map<string, number>();
  storeLedger.forEach(e => employeeBalances.set(e.employeeId, e.runningBalance));
  const creditOutstanding = Array.from(employeeBalances.values()).reduce((s, b) => s + b, 0);
  const creditCount = Array.from(employeeBalances.values()).filter(b => b > 0).length;

  // Build weekly chart (last 7 days up to today)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date('2026-03-05');
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
  const weeklySales = days.map(date => {
    const dayTxns = storeTxns.filter(t => t.date === date);
    return {
      day: new Date(date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }),
      cash: dayTxns.filter(t => t.type === 'Cash').reduce((s, t) => s + t.total, 0),
      credit: dayTxns.filter(t => t.type === 'Credit').reduce((s, t) => s + t.total, 0),
    };
  });

  const kpis = [
    { label: "Today's Sales", value: PH(todaySales), sub: `${todayTxns.length} transaction(s)`, icon: TrendingUp, color: '#1565c0', bg: '#e3f2fd', bdr: '#90caf9' },
    { label: 'Credit Outstanding', value: PH(creditOutstanding), sub: `${creditCount} employee account(s)`, icon: CreditCard, color: '#6a1b9a', bg: '#f3e5f5', bdr: '#ce93d8' },
    { label: 'Low Stock Items', value: lowStockItems.length.toString(), sub: 'require restocking', icon: AlertTriangle, color: '#bf360c', bg: '#fbe9e7', bdr: '#ffab91' },
    { label: 'Transactions Today', value: todayTxns.length.toString(), sub: `Cash: ${PH(todayCash)} · Credit: ${PH(todayCredit)}`, icon: Receipt, color: '#2e7d32', bg: '#e8f5e9', bdr: '#a5d6a7' },
  ];

  const storeEmployees = employees.filter(e => e.storeIds.includes(sid) && e.status === 'Active');
  const activeSessionForStore = cashSessions.find(s => s.storeId === sid && s.status === 'Active');

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', fontFamily: "'Segoe UI', Arial, sans-serif" }}>

      {/* Page header */}
      <div style={{ backgroundColor: '#1a3a5c', color: 'white', padding: '7px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '13px', fontWeight: 700 }}>■ DASHBOARD — {activeStore.name.toUpperCase()} · {activeStore.location.toUpperCase()}</span>
        <span style={{ fontSize: '11px', color: '#90caf9' }}>Thursday, March 5, 2026</span>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
        {kpis.map(kpi => (
          <div key={kpi.label} style={{ backgroundColor: '#ffffff', border: `1px solid ${kpi.bdr}`, overflow: 'hidden' }}>
            <div style={{ backgroundColor: kpi.color, height: '4px' }} />
            <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ backgroundColor: kpi.bg, padding: '8px', border: `1px solid ${kpi.bdr}` }}>
                <kpi.icon size={20} style={{ color: kpi.color }} />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#546e7a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{kpi.label}</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#1a2636', lineHeight: 1.2 }}>{kpi.value}</div>
                <div style={{ fontSize: '10px', color: '#78909c', marginTop: '2px' }}>{kpi.sub}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Session status + Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '10px' }}>
        {/* Quick actions */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #c4cdd6' }}>
          <div style={{ backgroundColor: '#2c4a6e', color: 'white', padding: '5px 12px', fontSize: '12px', fontWeight: 600 }}>Quick Actions</div>
          <div style={{ padding: '10px 12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(currentUser?.role === 'Admin' || currentUser?.role === 'Cashier') && (
              <button onClick={() => navigate('/cash-sales')} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#1a4a8a', color: 'white', border: '1px solid #0d3a7a', padding: '7px 18px', fontSize: '12px', cursor: 'pointer', fontFamily: "'Segoe UI', Arial, sans-serif" }}>
                <ShoppingCart size={14} /> New Cash Sale
              </button>
            )}
            {(currentUser?.role === 'Admin' || currentUser?.role === 'Cashier') && (
              <button onClick={() => navigate('/credit-sales')} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#4a148c', color: 'white', border: '1px solid #311b92', padding: '7px 18px', fontSize: '12px', cursor: 'pointer', fontFamily: "'Segoe UI', Arial, sans-serif" }}>
                <CreditCard size={14} /> New Credit Sale
              </button>
            )}
            <button onClick={() => navigate('/cash-valuting')} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#37474f', color: 'white', border: '1px solid #263238', padding: '7px 18px', fontSize: '12px', cursor: 'pointer', fontFamily: "'Segoe UI', Arial, sans-serif" }}>
              <Vault size={14} /> Cash Valuting
            </button>
            {(currentUser?.role === 'Admin' || currentUser?.role === 'Manager') && (
              <button onClick={() => navigate('/inventory')} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#bf360c', color: 'white', border: '1px solid #8b1010', padding: '7px 18px', fontSize: '12px', cursor: 'pointer', fontFamily: "'Segoe UI', Arial, sans-serif" }}>
                <AlertTriangle size={14} /> Low Stock ({lowStockItems.length})
              </button>
            )}
          </div>
        </div>

        {/* Cash session status card */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #c4cdd6' }}>
          <div style={{ backgroundColor: activeSessionForStore ? '#2e7d32' : '#c62828', color: 'white', padding: '5px 12px', fontSize: '12px', fontWeight: 600 }}>
            {activeSessionForStore ? '● Active Cash Session' : '○ No Active Session'}
          </div>
          <div style={{ padding: '10px 12px', fontSize: '12px' }}>
            {activeSessionForStore ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span style={{ color: '#546e7a' }}>Session ID:</span><span style={{ fontFamily: 'monospace', fontSize: '11px' }}>{activeSessionForStore.id}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span style={{ color: '#546e7a' }}>Cashier:</span><strong>{activeSessionForStore.employeeName}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span style={{ color: '#546e7a' }}>Opening Balance:</span><strong style={{ color: '#2e7d32' }}>₱{activeSessionForStore.openingBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#546e7a' }}>Cash Sales Total:</span><strong style={{ color: '#1565c0' }}>₱{activeSessionForStore.cashSalesTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong></div>
              </>
            ) : (
              <div style={{ color: '#c62828', fontSize: '12px' }}>No cashier has opened a session for this store today. Open a session to begin processing transactions.</div>
            )}
          </div>
        </div>
      </div>

      {/* Chart + Low Stock row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '10px' }}>

        {/* Weekly Sales Chart */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #c4cdd6', overflow: 'hidden' }}>
          <div style={{ backgroundColor: '#2c4a6e', color: 'white', padding: '5px 12px', fontSize: '12px', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>7-Day Sales Performance — {activeStore.name}</span>
            <span style={{ fontSize: '10px', color: '#90caf9' }}>Cash vs Credit</span>
          </div>
          <div style={{ padding: '12px 8px 8px' }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklySales} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e4e8" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#546e7a' }} />
                <YAxis tick={{ fontSize: 10, fill: '#546e7a' }} tickFormatter={(v) => `₱${(v / 1000).toFixed(1)}k`} />
                <Tooltip contentStyle={{ fontSize: '11px', border: '1px solid #c4cdd6', fontFamily: "'Segoe UI', Arial, sans-serif" }} formatter={(v: number) => [`₱${v.toLocaleString()}`, '']} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="cash" name="Cash Sales" fill="#1565c0" maxBarSize={32} />
                <Bar dataKey="credit" name="Credit Sales" fill="#6a1b9a" maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #c4cdd6', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ backgroundColor: '#bf360c', color: 'white', padding: '5px 12px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={13} /> Low Stock Alert ({lowStockItems.length} items)
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {lowStockItems.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#78909c', fontSize: '12px' }}>✔ All stock levels are adequate.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#fbe9e7' }}>
                    <th style={{ padding: '5px 8px', textAlign: 'left', borderBottom: '2px solid #ffab91', color: '#bf360c', fontWeight: 700 }}>Product</th>
                    <th style={{ padding: '5px 8px', textAlign: 'center', borderBottom: '2px solid #ffab91', color: '#bf360c', fontWeight: 700 }}>Stock</th>
                    <th style={{ padding: '5px 8px', textAlign: 'center', borderBottom: '2px solid #ffab91', color: '#bf360c', fontWeight: 700 }}>Min</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.map((p, i) => (
                    <tr key={p.id} style={{ backgroundColor: i % 2 === 0 ? '#fff8f7' : '#ffffff' }}>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid #ffe0db', color: '#1a2636' }}>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        <div style={{ fontSize: '10px', color: '#90a4ae' }}>{p.id}</div>
                      </td>
                      <td style={{ padding: '5px 8px', textAlign: 'center', borderBottom: '1px solid #ffe0db' }}>
                        <span style={{ fontWeight: 700, color: p.qty === 0 ? '#c62828' : '#e65100', backgroundColor: p.qty === 0 ? '#ffebee' : '#fff3e0', padding: '1px 6px', border: `1px solid ${p.qty === 0 ? '#ef5350' : '#ffa726'}`, fontSize: '11px' }}>
                          {p.qty === 0 ? 'OUT' : p.qty}
                        </span>
                      </td>
                      <td style={{ padding: '5px 8px', textAlign: 'center', borderBottom: '1px solid #ffe0db', color: '#546e7a' }}>{p.reorderLevel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {(currentUser?.role === 'Admin' || currentUser?.role === 'Manager') && (
            <div style={{ padding: '8px 10px', borderTop: '1px solid #ffd5cc', backgroundColor: '#fbe9e7' }}>
              <button onClick={() => navigate('/inventory')} style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#bf360c', color: 'white', border: 'none', padding: '4px 12px', fontSize: '11px', cursor: 'pointer', fontFamily: "'Segoe UI', Arial, sans-serif" }}>
                Manage Inventory <ArrowRight size={11} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #c4cdd6', overflow: 'hidden' }}>
        <div style={{ backgroundColor: '#2c4a6e', color: 'white', padding: '5px 12px', fontSize: '12px', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Recent Transactions — {activeStore.name}</span>
          {(currentUser?.role === 'Admin' || currentUser?.role === 'Manager') && (
            <button onClick={() => navigate('/goods-sold')} style={{ fontSize: '10px', color: '#90caf9', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontFamily: "'Segoe UI', Arial, sans-serif" }}>View All <ArrowRight size={10} /></button>
          )}
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ backgroundColor: '#1a3a5c', color: 'white' }}>
              {['Transaction ID', 'Date', 'Type', 'Total Amount', 'Processed By', 'Credit Employee', 'Status'].map(h => (
                <th key={h} style={{ padding: '5px 10px', textAlign: h === 'Total Amount' ? 'right' : ['Type', 'Status'].includes(h) ? 'center' : 'left', border: '1px solid #4a6a8c', fontWeight: 600, fontSize: '11px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {storeTxns.slice(0, 8).map((t, i) => (
              <tr key={t.id} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f2f5f8' }}>
                <td style={{ padding: '5px 10px', border: '1px solid #dde2e7', fontFamily: 'monospace', color: '#37474f', fontSize: '11px' }}>{t.id}</td>
                <td style={{ padding: '5px 10px', border: '1px solid #dde2e7', color: '#546e7a' }}>{t.date}</td>
                <td style={{ padding: '5px 10px', border: '1px solid #dde2e7', textAlign: 'center' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', border: '1px solid', backgroundColor: t.type === 'Cash' ? '#e3f2fd' : '#f3e5f5', color: t.type === 'Cash' ? '#1565c0' : '#6a1b9a', borderColor: t.type === 'Cash' ? '#90caf9' : '#ce93d8' }}>
                    {t.type}
                  </span>
                </td>
                <td style={{ padding: '5px 10px', border: '1px solid #dde2e7', textAlign: 'right', fontWeight: 700 }}>{PH(t.total)}</td>
                <td style={{ padding: '5px 10px', border: '1px solid #dde2e7', color: '#37474f' }}>{t.employeeName}</td>
                <td style={{ padding: '5px 10px', border: '1px solid #dde2e7', color: t.creditEmployeeName ? '#6a1b9a' : '#b0bec5', fontSize: '11px' }}>{t.creditEmployeeName || '—'}</td>
                <td style={{ padding: '5px 10px', border: '1px solid #dde2e7', textAlign: 'center' }}>
                  <span style={{ fontSize: '10px', padding: '2px 8px', backgroundColor: '#e8f5e9', color: '#2e7d32', border: '1px solid #a5d6a7', fontWeight: 600 }}>✔ {t.status}</span>
                </td>
              </tr>
            ))}
            {storeTxns.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#90a4ae' }}>No transactions recorded yet for {activeStore.name}.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
