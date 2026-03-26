import { useState } from 'react';
import { BarChart2, TrendingUp, DollarSign, AlertCircle, Printer } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '../contexts/AppContext';
import { CREDIT_LIMIT } from '../data/mockData';

const PH = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const FONT = "'Segoe UI', Arial, sans-serif";

export function FinancialStatements() {
  const { transactions, products, creditLedger, employees, activeStore } = useApp();
  const [period, setPeriod] = useState('2026-03');

  if (!activeStore) return null;
  const sid = activeStore.id;

  // Filter by store and period
  const periodTxns = transactions.filter(t => t.storeId === sid && t.date.startsWith(period) && t.status === 'Completed');
  const allStoreTxns = transactions.filter(t => t.storeId === sid && t.status === 'Completed');
  const storeProducts = products.filter(p => p.storeId === sid);

  // Income Statement
  const revenue = periodTxns.reduce((s, t) => s + t.total, 0);
  const cogs = periodTxns.reduce((s, t) =>
    s + t.items.reduce((is, i) => is + i.qty * i.costPrice, 0), 0
  );
  const grossProfit = revenue - cogs;
  const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

  // Cash vs Credit breakdown
  const cashRevenue = periodTxns.filter(t => t.type === 'Cash').reduce((s, t) => s + t.total, 0);
  const creditRevenue = periodTxns.filter(t => t.type === 'Credit').reduce((s, t) => s + t.total, 0);

  // Balance Snapshot (current state)
  const cashFromSales = allStoreTxns.filter(t => t.type === 'Cash').reduce((s, t) => s + t.total, 0);

  // Credit outstanding per employee in this store
  const storeLedger = creditLedger.filter(e => e.storeId === sid);
  const empBalances = new Map<string, number>();
  storeLedger.forEach(e => empBalances.set(e.employeeId, e.runningBalance));
  const accountsReceivable = Array.from(empBalances.values()).reduce((s, b) => s + b, 0);
  const inventoryValue = storeProducts.reduce((s, p) => s + p.qty * p.costPrice, 0);

  // Aging analysis of credit (based on ledger entry dates)
  const today = new Date('2026-03-05');
  const agingBuckets = { '0-15': 0, '16-30': 0, '31+': 0 };
  storeLedger.forEach(e => {
    if (e.type !== 'Purchase') return;
    const days = Math.floor((today.getTime() - new Date(e.date).getTime()) / 86400000);
    if (days <= 15) agingBuckets['0-15'] += e.amount;
    else if (days <= 30) agingBuckets['16-30'] += e.amount;
    else agingBuckets['31+'] += e.amount;
  });

  // Monthly chart data (last 6 months)
  const months = ['2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03'];
  const monthlyData = months.map(m => {
    const mTxns = allStoreTxns.filter(t => t.date.startsWith(m));
    const rev = mTxns.reduce((s, t) => s + t.total, 0);
    const cg = mTxns.reduce((s, t) => s + t.items.reduce((is, i) => is + i.qty * i.costPrice, 0), 0);
    return { month: m.slice(5) + '/' + m.slice(2, 4), revenue: rev, cogs: cg, grossProfit: rev - cg };
  });

  // Employee credit breakdown
  const storeEmps = employees.filter(e => e.storeIds.includes(sid));
  const empCreditData = storeEmps
    .map(e => ({ emp: e, balance: empBalances.get(e.id) || 0 }))
    .filter(ec => ec.balance > 0)
    .sort((a, b) => b.balance - a.balance);

  const periods = ['2026-03', '2026-02', '2026-01', '2025-12', '2025-11', '2025-10'];

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', height: '100%', fontFamily: FONT, overflowY: 'auto' }}>

      {/* Header */}
      <div style={{ backgroundColor: '#1a3a5c', color: 'white', padding: '6px 12px', fontSize: '13px', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <span><BarChart2 size={14} style={{ display: 'inline', marginRight: '6px' }} />FINANCIAL STATEMENTS — {activeStore.name.toUpperCase()} · {activeStore.location.toUpperCase()}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '11px', color: '#90caf9', fontWeight: 600 }}>Period:</label>
            <select value={period} onChange={e => setPeriod(e.target.value)} style={{ padding: '3px 8px', border: '1px solid #4a6a8c', fontSize: '11px', outline: 'none', fontFamily: FONT, backgroundColor: '#1a3a5c', color: 'white' }}>
              {periods.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#37474f', color: 'white', border: '1px solid #263238', padding: '4px 10px', fontSize: '11px', cursor: 'pointer', fontFamily: FONT }}>
            <Printer size={12} /> Print
          </button>
        </div>
      </div>

      {/* Top row: Income Statement + Balance Snapshot */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', flexShrink: 0 }}>

        {/* Income Statement */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #c4cdd6', overflow: 'hidden' }}>
          <div style={{ backgroundColor: '#2c4a6e', color: 'white', padding: '5px 12px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={13} /> Income Statement — {period}
          </div>
          <div style={{ padding: '12px' }}>
            {/* Revenue breakdown */}
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '10px', color: '#546e7a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>REVENUE</div>
              <LineItem label="Cash Sales" value={cashRevenue} indent />
              <LineItem label="Credit Sales" value={creditRevenue} indent />
              <LineItem label="Total Revenue" value={revenue} bold />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '10px', color: '#546e7a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>COST OF GOODS SOLD</div>
              <LineItem label="Total COGS" value={cogs} bold negative />
            </div>
            <div style={{ borderTop: '2px solid #1a3a5c', paddingTop: '10px' }}>
              <div style={{ fontSize: '10px', color: '#546e7a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>GROSS PROFIT</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '8px 12px', backgroundColor: grossProfit >= 0 ? '#e8f5e9' : '#ffebee', border: `1px solid ${grossProfit >= 0 ? '#a5d6a7' : '#ef5350'}` }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: grossProfit >= 0 ? '#2e7d32' : '#c62828' }}>Gross Profit</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: grossProfit >= 0 ? '#2e7d32' : '#c62828' }}>{PH(grossProfit)}</div>
                  <div style={{ fontSize: '11px', color: '#78909c' }}>Margin: {grossMargin.toFixed(1)}%</div>
                </div>
              </div>
            </div>
            {/* Transaction count */}
            <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1, backgroundColor: '#e3f2fd', border: '1px solid #90caf9', padding: '7px 10px' }}>
                <div style={{ fontSize: '10px', color: '#546e7a' }}>Cash Transactions</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#1565c0' }}>{periodTxns.filter(t => t.type === 'Cash').length}</div>
              </div>
              <div style={{ flex: 1, backgroundColor: '#f3e5f5', border: '1px solid #ce93d8', padding: '7px 10px' }}>
                <div style={{ fontSize: '10px', color: '#546e7a' }}>Credit Transactions</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#6a1b9a' }}>{periodTxns.filter(t => t.type === 'Credit').length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Balance Snapshot */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #c4cdd6', overflow: 'hidden' }}>
          <div style={{ backgroundColor: '#2c4a6e', color: 'white', padding: '5px 12px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <DollarSign size={13} /> Balance Snapshot — Current
          </div>
          <div style={{ padding: '12px' }}>
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '10px', color: '#546e7a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>ASSETS</div>
              <LineItem label="Cash from Cash Sales" value={cashFromSales} indent />
              <LineItem label="Accounts Receivable (Credit)" value={accountsReceivable} indent />
              <LineItem label="Inventory at Cost" value={inventoryValue} indent />
              <LineItem label="Total Assets" value={cashFromSales + accountsReceivable + inventoryValue} bold />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '10px', color: '#546e7a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>LIABILITIES</div>
              <LineItem label="Outstanding Credit Balances" value={accountsReceivable} indent negative />
              <LineItem label="Total Liabilities" value={accountsReceivable} bold negative />
            </div>
            <div style={{ borderTop: '2px solid #1a3a5c', paddingTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '8px 12px', backgroundColor: '#e3f2fd', border: '1px solid #90caf9' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#1565c0' }}>Net Position</span>
                <span style={{ fontSize: '20px', fontWeight: 900, color: '#1565c0' }}>{PH(cashFromSales + inventoryValue)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '10px', flexShrink: 0 }}>

        {/* Monthly Performance Chart */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #c4cdd6', overflow: 'hidden' }}>
          <div style={{ backgroundColor: '#2c4a6e', color: 'white', padding: '5px 12px', fontSize: '12px', fontWeight: 600 }}>
            6-Month Revenue vs COGS vs Gross Profit — {activeStore.name}
          </div>
          <div style={{ padding: '12px 8px 8px' }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e4e8" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#546e7a' }} />
                <YAxis tick={{ fontSize: 10, fill: '#546e7a' }} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ fontSize: '11px', border: '1px solid #c4cdd6', fontFamily: FONT }} formatter={(v: number) => [`₱${v.toLocaleString()}`, '']} />
                <Bar dataKey="revenue" name="Revenue" fill="#1565c0" maxBarSize={28} />
                <Bar dataKey="cogs" name="COGS" fill="#78909c" maxBarSize={28} />
                <Bar dataKey="grossProfit" name="Gross Profit" fill="#2e7d32" maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Credit Aging + Outstanding */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #c4cdd6', overflow: 'hidden' }}>
          <div style={{ backgroundColor: '#6a1b9a', color: 'white', padding: '5px 12px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircle size={13} /> Employee Credit Outstanding
          </div>
          <div style={{ padding: '10px 12px' }}>
            {/* Aging buckets */}
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '10px', color: '#546e7a', fontWeight: 700, marginBottom: '5px', textTransform: 'uppercase' }}>AGING ANALYSIS</div>
              {[['0–15 days', agingBuckets['0-15'], '#e8f5e9', '#2e7d32'], ['16–30 days', agingBuckets['16-30'], '#fff3e0', '#e65100'], ['31+ days', agingBuckets['31+'], '#ffebee', '#c62828']].map(([label, val, bg, color]) => (
                <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px', backgroundColor: bg as string, border: `1px solid ${color}40`, marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#546e7a' }}>{label as string}</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: color as string, fontFamily: 'monospace' }}>{PH(val as number)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 8px', backgroundColor: '#1a3a5c', marginTop: '4px' }}>
                <span style={{ fontSize: '11px', color: '#90caf9' }}>TOTAL OUTSTANDING</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#64b5f6', fontFamily: 'monospace' }}>{PH(accountsReceivable)}</span>
              </div>
            </div>

            {/* Per-employee breakdown */}
            {empCreditData.length > 0 && (
              <>
                <div style={{ fontSize: '10px', color: '#546e7a', fontWeight: 700, marginBottom: '5px', textTransform: 'uppercase' }}>BY EMPLOYEE</div>
                {empCreditData.map(({ emp, balance }) => (
                  <div key={emp.id} style={{ marginBottom: '5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '2px' }}>
                      <span style={{ color: '#37474f', fontWeight: 600 }}>{emp.fullName} <span style={{ color: '#90a4ae', fontWeight: 400 }}>({emp.role})</span></span>
                      <span style={{ fontWeight: 700, color: balance >= CREDIT_LIMIT ? '#c62828' : '#6a1b9a', fontFamily: 'monospace' }}>{PH(balance)}</span>
                    </div>
                    {/* Progress bar */}
                    <div style={{ height: '6px', backgroundColor: '#e0e0e0', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min((balance / CREDIT_LIMIT) * 100, 100)}%`, backgroundColor: balance >= CREDIT_LIMIT ? '#c62828' : balance > 1000 ? '#e65100' : '#6a1b9a', transition: 'width 0.3s' }} />
                    </div>
                    <div style={{ fontSize: '10px', color: '#90a4ae', textAlign: 'right', marginTop: '1px' }}>{((balance / CREDIT_LIMIT) * 100).toFixed(0)}% of ₱1,500 limit</div>
                  </div>
                ))}
              </>
            )}
            {empCreditData.length === 0 && (
              <div style={{ textAlign: 'center', padding: '16px', color: '#78909c', fontSize: '12px' }}>✔ No outstanding credit balances</div>
            )}
          </div>
        </div>
      </div>

      {/* Inventory Value by Category */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #c4cdd6', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ backgroundColor: '#2c4a6e', color: 'white', padding: '5px 12px', fontSize: '12px', fontWeight: 600 }}>Inventory Summary by Category — {activeStore.name}</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: '#1a3a5c', color: 'white' }}>
                {['Category', 'Products', 'Total Qty', 'Avg Unit Price', 'Inventory Value (Cost)', 'Inventory Value (Retail)', 'Potential Margin'].map(h => (
                  <th key={h} style={{ padding: '6px 10px', textAlign: ['Total Qty', 'Avg Unit Price', 'Inventory Value (Cost)', 'Inventory Value (Retail)', 'Potential Margin', 'Products'].includes(h) ? 'right' : 'left', border: '1px solid #4a6a8c', fontWeight: 600, whiteSpace: 'nowrap', fontSize: '11px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(() => {
                const byCategory = new Map<string, { count: number; qty: number; costVal: number; retailVal: number }>();
                storeProducts.forEach(p => {
                  const cur = byCategory.get(p.category) || { count: 0, qty: 0, costVal: 0, retailVal: 0 };
                  byCategory.set(p.category, {
                    count: cur.count + 1, qty: cur.qty + p.qty,
                    costVal: cur.costVal + p.qty * p.costPrice, retailVal: cur.retailVal + p.qty * p.unitPrice,
                  });
                });
                return Array.from(byCategory.entries()).map(([cat, data], i) => {
                  const margin = data.retailVal > 0 ? ((data.retailVal - data.costVal) / data.retailVal) * 100 : 0;
                  const avgPrice = data.count > 0 ? (storeProducts.filter(p => p.category === cat).reduce((s, p) => s + p.unitPrice, 0) / data.count) : 0;
                  return (
                    <tr key={cat} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f2f5f8' }}>
                      <td style={{ padding: '5px 10px', border: '1px solid #dde2e7', fontWeight: 600 }}>{cat}</td>
                      <td style={{ padding: '5px 10px', border: '1px solid #dde2e7', textAlign: 'right' }}>{data.count}</td>
                      <td style={{ padding: '5px 10px', border: '1px solid #dde2e7', textAlign: 'right' }}>{data.qty}</td>
                      <td style={{ padding: '5px 10px', border: '1px solid #dde2e7', textAlign: 'right', color: '#546e7a' }}>{PH(avgPrice)}</td>
                      <td style={{ padding: '5px 10px', border: '1px solid #dde2e7', textAlign: 'right' }}>{PH(data.costVal)}</td>
                      <td style={{ padding: '5px 10px', border: '1px solid #dde2e7', textAlign: 'right', color: '#1565c0' }}>{PH(data.retailVal)}</td>
                      <td style={{ padding: '5px 10px', border: '1px solid #dde2e7', textAlign: 'right', fontWeight: 700, color: margin > 20 ? '#2e7d32' : '#e65100' }}>{margin.toFixed(1)}%</td>
                    </tr>
                  );
                });
              })()}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: '#1a3a5c', color: 'white' }}>
                <td style={{ padding: '5px 10px', border: '1px solid #4a6a8c', fontWeight: 700 }}>TOTAL</td>
                <td style={{ padding: '5px 10px', border: '1px solid #4a6a8c', textAlign: 'right', fontWeight: 700 }}>{storeProducts.length}</td>
                <td style={{ padding: '5px 10px', border: '1px solid #4a6a8c', textAlign: 'right', fontWeight: 700 }}>{storeProducts.reduce((s, p) => s + p.qty, 0)}</td>
                <td style={{ padding: '5px 10px', border: '1px solid #4a6a8c' }}></td>
                <td style={{ padding: '5px 10px', border: '1px solid #4a6a8c', textAlign: 'right', fontWeight: 800 }}>{PH(inventoryValue)}</td>
                <td style={{ padding: '5px 10px', border: '1px solid #4a6a8c', textAlign: 'right', fontWeight: 800 }}>{PH(storeProducts.reduce((s, p) => s + p.qty * p.unitPrice, 0))}</td>
                <td style={{ padding: '5px 10px', border: '1px solid #4a6a8c' }}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

function LineItem({ label, value, indent = false, bold = false, negative = false }: { label: string; value: number; indent?: boolean; bold?: boolean; negative?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: `${bold ? '6px' : '3px'} ${indent ? '12px' : '0'}`, marginBottom: bold ? '4px' : '2px', fontWeight: bold ? 700 : 400, backgroundColor: bold ? '#f5f7f9' : 'transparent', borderBottom: bold ? '1px solid #e0e4e8' : 'none' }}>
      <span style={{ fontSize: '12px', color: bold ? '#1a2636' : '#546e7a' }}>{label}</span>
      <span style={{ fontSize: '12px', color: negative ? '#c62828' : bold ? '#1a3a5c' : '#546e7a', fontFamily: 'monospace' }}>{negative ? `(${PH(value)})` : PH(value)}</span>
    </div>
  );
}
