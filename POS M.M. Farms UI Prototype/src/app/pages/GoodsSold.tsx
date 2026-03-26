import { useState, useMemo } from 'react';
import { FileText, Search, Printer, RefreshCw, ChevronDown } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Transaction } from '../data/mockData';
import { WinModal } from '../components/WinModal';

const PH = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const FONT = "'Segoe UI', Arial, sans-serif";

export function GoodsSold() {
  const { transactions, employees, activeStore } = useApp();

  const sid = activeStore?.id || '';
  const storeTxns = transactions.filter(t => t.storeId === sid);
  const storeEmps = employees.filter(e => e.storeIds.includes(sid));
  const empNames = ['All', ...Array.from(new Set(storeEmps.map(e => e.fullName)))];

  const [dateFrom, setDateFrom] = useState('2026-03-01');
  const [dateTo, setDateTo] = useState('2026-03-05');
  const [typeFilter, setTypeFilter] = useState('All');
  const [empFilter, setEmpFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const filtered = useMemo(() => storeTxns.filter(t => {
    const inRange = t.date >= dateFrom && t.date <= dateTo;
    const matchType = typeFilter === 'All' || t.type === typeFilter;
    const matchEmp = empFilter === 'All' || t.employeeName === empFilter;
    const matchSearch = t.id.toLowerCase().includes(search.toLowerCase()) ||
      (t.creditEmployeeName || '').toLowerCase().includes(search.toLowerCase()) ||
      t.employeeName.toLowerCase().includes(search.toLowerCase());
    return inRange && matchType && matchEmp && matchSearch;
  }).sort((a, b) => b.id.localeCompare(a.id)), [storeTxns, dateFrom, dateTo, typeFilter, empFilter, search]);

  const totalSales = filtered.reduce((s, t) => s + t.total, 0);
  const cashSales = filtered.filter(t => t.type === 'Cash').reduce((s, t) => s + t.total, 0);
  const creditSales = filtered.filter(t => t.type === 'Credit').reduce((s, t) => s + t.total, 0);
  const avgTxn = filtered.length > 0 ? totalSales / filtered.length : 0;

  const reset = () => { setDateFrom('2026-03-01'); setDateTo('2026-03-05'); setTypeFilter('All'); setEmpFilter('All'); setSearch(''); };

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', height: '100%', fontFamily: FONT }}>

      {/* Header */}
      <div style={{ backgroundColor: '#1a3a5c', color: 'white', padding: '6px 12px', fontSize: '13px', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span><FileText size={14} style={{ display: 'inline', marginRight: '6px' }} />GOODS SOLD — {activeStore?.name.toUpperCase()} · TRANSACTION RECORDS</span>
        <button style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#37474f', color: 'white', border: '1px solid #263238', padding: '4px 10px', fontSize: '11px', cursor: 'pointer', fontFamily: FONT }}>
          <Printer size={12} /> Print Report
        </button>
      </div>

      {/* Filters */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #c4cdd6' }}>
        <div style={{ backgroundColor: '#2c4a6e', color: 'white', padding: '5px 10px', fontSize: '12px', fontWeight: 600 }}>Report Filters</div>
        <div style={{ padding: '10px 12px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: '#546e7a', fontWeight: 600 }}>Date From:</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding: '5px 8px', border: '1px solid #b0bec5', fontSize: '12px', outline: 'none', fontFamily: FONT }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: '#546e7a', fontWeight: 600 }}>To:</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding: '5px 8px', border: '1px solid #b0bec5', fontSize: '12px', outline: 'none', fontFamily: FONT }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: '#546e7a', fontWeight: 600 }}>Type:</label>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding: '5px 8px', border: '1px solid #b0bec5', fontSize: '12px', outline: 'none', fontFamily: FONT }}>
              {['All', 'Cash', 'Credit'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: '#546e7a', fontWeight: 600 }}>Employee:</label>
            <select value={empFilter} onChange={e => setEmpFilter(e.target.value)} style={{ padding: '5px 8px', border: '1px solid #b0bec5', fontSize: '12px', outline: 'none', fontFamily: FONT }}>
              {empNames.map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
          <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
            <Search size={12} style={{ position: 'absolute', left: '7px', top: '50%', transform: 'translateY(-50%)', color: '#90a4ae' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by ID, employee..." style={{ width: '100%', boxSizing: 'border-box', padding: '5px 6px 5px 24px', border: '1px solid #b0bec5', fontSize: '12px', outline: 'none', fontFamily: FONT }} />
          </div>
          <button onClick={reset} style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#dde2e7', border: '1px solid #9aabb8', padding: '5px 10px', fontSize: '12px', cursor: 'pointer', fontFamily: FONT }}>
            <RefreshCw size={12} /> Reset
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
        {[
          { label: 'Total Sales', value: PH(totalSales), color: '#1565c0', bg: '#e3f2fd' },
          { label: 'Cash Sales', value: PH(cashSales), color: '#2e7d32', bg: '#e8f5e9' },
          { label: 'Credit Sales', value: PH(creditSales), color: '#6a1b9a', bg: '#f3e5f5' },
          { label: `Avg. Transaction (${filtered.length})`, value: PH(avgTxn), color: '#37474f', bg: '#eceff1' },
        ].map(s => (
          <div key={s.label} style={{ backgroundColor: '#ffffff', border: `1px solid ${s.color}40`, padding: '8px 12px' }}>
            <div style={{ fontSize: '10px', color: '#78909c', textTransform: 'uppercase', marginBottom: '2px' }}>{s.label}</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* DataGrid */}
      <div style={{ flex: 1, backgroundColor: '#ffffff', border: '1px solid #c4cdd6', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr style={{ backgroundColor: '#1a3a5c', color: 'white' }}>
                {['Transaction ID', 'Date', 'Type', 'Items', 'Total Amount', 'Processed By', 'Credit Employee', 'Status', 'Details'].map(h => (
                  <th key={h} style={{ padding: '7px 8px', textAlign: ['Total Amount'].includes(h) ? 'right' : ['Items', 'Type', 'Status', 'Details'].includes(h) ? 'center' : 'left', border: '1px solid #4a6a8c', fontWeight: 600, whiteSpace: 'nowrap', fontSize: '11px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '48px', color: '#90a4ae' }}>No transactions found for the selected filters.</td></tr>
              ) : filtered.map((t, i) => (
                <tr key={t.id} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f2f5f8' }}>
                  <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', fontFamily: 'monospace', fontSize: '10px', color: '#37474f' }}>{t.id}</td>
                  <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', color: '#546e7a', whiteSpace: 'nowrap' }}>{t.date}</td>
                  <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', textAlign: 'center' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', backgroundColor: t.type === 'Cash' ? '#e3f2fd' : '#f3e5f5', color: t.type === 'Cash' ? '#1565c0' : '#6a1b9a', border: `1px solid ${t.type === 'Cash' ? '#90caf9' : '#ce93d8'}` }}>{t.type}</span>
                  </td>
                  <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', textAlign: 'center', color: '#546e7a' }}>{t.itemCount}</td>
                  <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', textAlign: 'right', fontWeight: 700 }}>{PH(t.total)}</td>
                  <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', color: '#37474f' }}>{t.employeeName}</td>
                  <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', color: t.creditEmployeeName ? '#6a1b9a' : '#b0bec5', fontSize: '11px' }}>{t.creditEmployeeName || '—'}</td>
                  <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', textAlign: 'center' }}>
                    <span style={{ fontSize: '10px', padding: '2px 7px', backgroundColor: '#e8f5e9', color: '#2e7d32', border: '1px solid #a5d6a7', fontWeight: 600 }}>✔ {t.status}</span>
                  </td>
                  <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', textAlign: 'center' }}>
                    <button onClick={() => { setSelectedTxn(t); setShowDetail(true); }} style={{ display: 'flex', alignItems: 'center', gap: '2px', backgroundColor: '#1a4a8a', color: 'white', border: 'none', padding: '3px 8px', fontSize: '10px', cursor: 'pointer', fontFamily: FONT, margin: '0 auto' }}>
                      <ChevronDown size={10} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr style={{ backgroundColor: '#1a3a5c', color: 'white' }}>
                  <td colSpan={4} style={{ padding: '6px 8px', border: '1px solid #4a6a8c', fontWeight: 700, fontSize: '12px' }}>TOTALS ({filtered.length} transactions)</td>
                  <td style={{ padding: '6px 8px', border: '1px solid #4a6a8c', textAlign: 'right', fontWeight: 800, fontSize: '13px' }}>{PH(totalSales)}</td>
                  <td colSpan={4} style={{ padding: '6px 8px', border: '1px solid #4a6a8c' }}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        <div style={{ padding: '6px 10px', borderTop: '1px solid #c4cdd6', backgroundColor: '#f5f7f9', fontSize: '11px', color: '#78909c', display: 'flex', gap: '20px' }}>
          <span>Results: {filtered.length}</span>
          <span>Cash: {filtered.filter(t => t.type === 'Cash').length} ({PH(cashSales)})</span>
          <span>Credit: {filtered.filter(t => t.type === 'Credit').length} ({PH(creditSales)})</span>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      <WinModal title={`Transaction Detail — ${selectedTxn?.id}`} isOpen={showDetail} onClose={() => setShowDetail(false)} width="580px">
        {selectedTxn && (
          <div style={{ padding: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px', fontSize: '12px' }}>
              {[
                ['Transaction ID', selectedTxn.id],
                ['Store', activeStore?.name || ''],
                ['Date', selectedTxn.date],
                ['Type', selectedTxn.type],
                ['Status', selectedTxn.status],
                ['Processed By', selectedTxn.employeeName],
                ['Credit Employee', selectedTxn.creditEmployeeName || 'N/A — Cash Sale'],
                ['Items Count', selectedTxn.itemCount.toString()],
              ].map(([l, v]) => (
                <div key={l} style={{ backgroundColor: '#f5f7f9', padding: '6px 8px', border: '1px solid #e0e4e8' }}>
                  <div style={{ fontSize: '10px', color: '#78909c' }}>{l}</div>
                  <div style={{ fontWeight: 600, color: '#1a2636', fontFamily: l === 'Transaction ID' ? 'monospace' : 'inherit', fontSize: l === 'Transaction ID' ? '11px' : '12px' }}>{v}</div>
                </div>
              ))}
            </div>

            <div style={{ backgroundColor: '#2c4a6e', color: 'white', padding: '5px 8px', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>Items Purchased</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#1a3a5c', color: 'white' }}>
                  {['#', 'Product ID', 'Product Name', 'Qty', 'Unit Price', 'Subtotal'].map(h => (
                    <th key={h} style={{ padding: '5px 8px', textAlign: ['Unit Price', 'Subtotal'].includes(h) ? 'right' : h === 'Qty' ? 'center' : 'left', border: '1px solid #4a6a8c' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selectedTxn.items.filter(i => i.qty > 0).map((item, i) => (
                  <tr key={item.productId} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f2f5f8' }}>
                    <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', textAlign: 'center', color: '#90a4ae', fontSize: '11px' }}>{i + 1}</td>
                    <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', fontFamily: 'monospace', fontSize: '10px', color: '#37474f' }}>{item.productId}</td>
                    <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', fontWeight: 600 }}>{item.productName}</td>
                    <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', textAlign: 'center' }}>{item.qty}</td>
                    <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', textAlign: 'right' }}>{PH(item.unitPrice)}</td>
                    <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', textAlign: 'right', fontWeight: 600 }}>{PH(item.unitPrice * item.qty)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: '#1a3a5c', color: 'white' }}>
                  <td colSpan={5} style={{ padding: '5px 8px', border: '1px solid #4a6a8c', fontWeight: 700 }}>GRAND TOTAL</td>
                  <td style={{ padding: '5px 8px', border: '1px solid #4a6a8c', textAlign: 'right', fontWeight: 800, fontSize: '14px' }}>{PH(selectedTxn.total)}</td>
                </tr>
              </tfoot>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#37474f', color: 'white', border: 'none', padding: '6px 14px', fontSize: '12px', cursor: 'pointer', fontFamily: FONT }}><Printer size={12} /> Print</button>
              <button onClick={() => setShowDetail(false)} style={{ backgroundColor: '#1a4a8a', color: 'white', border: '1px solid #0d3a7a', padding: '6px 20px', fontSize: '12px', cursor: 'pointer', fontFamily: FONT }}>Close</button>
            </div>
          </div>
        )}
      </WinModal>
    </div>
  );
}
