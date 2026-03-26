import { useState, useMemo } from 'react';
import { Package, Plus, Edit2, BarChart2, Search, TrendingDown } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Product } from '../data/mockData';
import { WinModal, WinAlert } from '../components/WinModal';

const PH = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const FONT = "'Segoe UI', Arial, sans-serif";
const IS: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '6px 8px', border: '1px solid #b0bec5', fontSize: '12px', outline: 'none', fontFamily: FONT };
function FL({ children }: { children: React.ReactNode }) {
  return <label style={{ display: 'block', fontSize: '11px', color: '#546e7a', fontWeight: 600, marginBottom: '3px' }}>{children}</label>;
}

const emptyForm = { name: '', category: '', unitPrice: '', costPrice: '', qty: '', reorderLevel: '', status: 'Active' as 'Active' | 'Inactive' };

export function Inventory() {
  const { products, adjustInventory, saveProduct, inventoryHistory, activeStore, currentUser } = useApp();

  const storeProducts = products.filter(p => p.storeId === activeStore?.id);
  const cats = ['All', ...Array.from(new Set(storeProducts.map(p => p.category)))];

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustType, setAdjustType] = useState<'in' | 'out' | 'set'>('in');
  const [adjustNote, setAdjustNote] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning'>('success');

  const filtered = useMemo(() => storeProducts.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'All' || p.category === catFilter;
    const matchStatus = statusFilter === 'All' || p.status === statusFilter;
    const matchStock = stockFilter === 'All' || (stockFilter === 'Low' && p.qty > 0 && p.qty <= p.reorderLevel) || (stockFilter === 'Out' && p.qty === 0) || (stockFilter === 'OK' && p.qty > p.reorderLevel);
    return matchSearch && matchCat && matchStatus && matchStock;
  }), [storeProducts, search, catFilter, statusFilter, stockFilter]);

  const openAdd = () => { setEditingProduct(null); setForm(emptyForm); setShowAddModal(true); };
  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setForm({ name: p.name, category: p.category, unitPrice: p.unitPrice.toString(), costPrice: p.costPrice.toString(), qty: p.qty.toString(), reorderLevel: p.reorderLevel.toString(), status: p.status });
    setShowAddModal(true);
  };

  const handleSaveProduct = () => {
    if (!form.name.trim() || !form.category.trim()) { setAlertMsg('Product name and category are required.'); setAlertType('error'); setShowAlert(true); return; }
    const data: Partial<Product> & { id?: string } = {
      ...(editingProduct ? { id: editingProduct.id } : {}),
      name: form.name, category: form.category,
      unitPrice: parseFloat(form.unitPrice) || 0, costPrice: parseFloat(form.costPrice) || 0,
      qty: parseInt(form.qty) || 0, reorderLevel: parseInt(form.reorderLevel) || 0,
      status: form.status, storeId: activeStore?.id || '',
    };
    const id = saveProduct(data);
    setAlertMsg(editingProduct ? `Product ${id} updated.` : `New product ${id} added.`);
    setAlertType('success'); setShowAlert(true); setShowAddModal(false);
  };

  const openAdjust = (p: Product) => { setAdjustProduct(p); setAdjustQty(''); setAdjustType('in'); setAdjustNote(''); setShowAdjust(true); };
  const handleAdjust = () => {
    if (!adjustProduct || !adjustQty) { setAlertMsg('Please enter a quantity.'); setAlertType('error'); setShowAlert(true); return; }
    const qty = parseInt(adjustQty) || 0;
    if (qty < 0) { setAlertMsg('Quantity cannot be negative.'); setAlertType('error'); setShowAlert(true); return; }
    adjustInventory(adjustProduct.id, adjustType, qty, adjustNote || 'Manual adjustment');
    setAlertMsg(`Stock adjusted for ${adjustProduct.name}.`); setAlertType('success'); setShowAlert(true); setShowAdjust(false);
  };

  const getStockStatus = (p: Product) => {
    if (p.qty === 0) return { label: 'OUT', bg: '#ffebee', color: '#c62828', border: '#ef5350' };
    if (p.qty <= p.reorderLevel) return { label: 'LOW', bg: '#fff3e0', color: '#e65100', border: '#ffa726' };
    return { label: 'OK', bg: '#e8f5e9', color: '#2e7d32', border: '#a5d6a7' };
  };

  const totalValue = storeProducts.reduce((s, p) => s + p.qty * p.costPrice, 0);
  const lowCount = storeProducts.filter(p => p.qty > 0 && p.qty <= p.reorderLevel).length;
  const outCount = storeProducts.filter(p => p.qty === 0).length;

  const productHistory = historyProduct
    ? inventoryHistory.filter(h => h.productId === historyProduct.id && h.storeId === activeStore?.id)
    : [];

  const isManager = currentUser?.role === 'Manager';

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', height: '100%', fontFamily: FONT }}>

      {/* Header */}
      <div style={{ backgroundColor: '#1a3a5c', color: 'white', padding: '6px 12px', fontSize: '13px', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span><Package size={14} style={{ display: 'inline', marginRight: '6px' }} />INVENTORY MANAGEMENT — {activeStore?.name.toUpperCase()} · {activeStore?.location.toUpperCase()}</span>
        {!isManager && (
          <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#2e7d32', color: 'white', border: '1px solid #1b5e20', padding: '4px 12px', fontSize: '11px', cursor: 'pointer', fontFamily: FONT }}>
            <Plus size={12} /> Add New Product
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
        {[
          { label: 'Total Products', value: storeProducts.length.toString(), color: '#1565c0', bg: '#e3f2fd' },
          { label: 'Total Stock Value', value: PH(totalValue), color: '#2e7d32', bg: '#e8f5e9' },
          { label: 'Low Stock Items', value: lowCount.toString(), color: '#e65100', bg: '#fff3e0' },
          { label: 'Out of Stock', value: outCount.toString(), color: '#c62828', bg: '#ffebee' },
        ].map(s => (
          <div key={s.label} style={{ backgroundColor: '#ffffff', border: `1px solid ${s.color}30`, padding: '8px 12px' }}>
            <div style={{ fontSize: '10px', color: '#78909c', textTransform: 'uppercase' }}>{s.label}</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #c4cdd6', padding: '8px 12px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={12} style={{ position: 'absolute', left: '7px', top: '50%', transform: 'translateY(-50%)', color: '#90a4ae' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, ID, or category..." style={{ width: '100%', boxSizing: 'border-box', padding: '5px 6px 5px 24px', border: '1px solid #b0bec5', fontSize: '12px', outline: 'none', fontFamily: FONT }} />
        </div>
        {[['Category', catFilter, setCatFilter, cats], ['Status', statusFilter, setStatusFilter, ['All', 'Active', 'Inactive']], ['Stock Level', stockFilter, setStockFilter, ['All', 'OK', 'Low', 'Out']]].map(([label, val, setter, opts]) => (
          <div key={label as string} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <label style={{ fontSize: '12px', color: '#546e7a', fontWeight: 600, whiteSpace: 'nowrap' }}>{label as string}:</label>
            <select value={val as string} onChange={e => (setter as (v: string) => void)(e.target.value)} style={{ padding: '5px 8px', border: '1px solid #b0bec5', fontSize: '12px', outline: 'none', fontFamily: FONT }}>
              {(opts as string[]).map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <span style={{ fontSize: '11px', color: '#78909c', marginLeft: 'auto' }}>Showing {filtered.length} of {storeProducts.length}</span>
      </div>

      {/* Table */}
      <div style={{ flex: 1, backgroundColor: '#ffffff', border: '1px solid #c4cdd6', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr style={{ backgroundColor: '#1a3a5c', color: 'white' }}>
                {['Product ID', 'Product Name', 'Category', 'Unit Price', 'Cost Price', 'Qty on Hand', 'Reorder Lvl', 'Stock Status', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '7px 8px', textAlign: ['Unit Price', 'Cost Price', 'Qty on Hand', 'Reorder Lvl'].includes(h) ? 'right' : ['Stock Status', 'Status', 'Actions'].includes(h) ? 'center' : 'left', border: '1px solid #4a6a8c', fontWeight: 600, whiteSpace: 'nowrap', fontSize: '11px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: '#90a4ae' }}>No products match the filter criteria.</td></tr>
              ) : filtered.map((p, i) => {
                const ss = getStockStatus(p);
                const rowBg = p.qty === 0 ? '#fff5f5' : p.qty <= p.reorderLevel ? '#fffbf0' : i % 2 === 0 ? '#ffffff' : '#f2f5f8';
                return (
                  <tr key={p.id} style={{ backgroundColor: rowBg }}>
                    <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', fontFamily: 'monospace', fontSize: '11px', color: '#37474f' }}>{p.id}</td>
                    <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', fontWeight: 600, color: p.qty === 0 ? '#c62828' : '#1a2636' }}>{p.name}</td>
                    <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', color: '#546e7a' }}>{p.category}</td>
                    <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', textAlign: 'right' }}>{PH(p.unitPrice)}</td>
                    <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', textAlign: 'right', color: '#546e7a' }}>{PH(p.costPrice)}</td>
                    <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', textAlign: 'right', fontWeight: 700, color: p.qty === 0 ? '#c62828' : p.qty <= p.reorderLevel ? '#e65100' : '#1a2636' }}>{p.qty}</td>
                    <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', textAlign: 'right', color: '#546e7a' }}>{p.reorderLevel}</td>
                    <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', textAlign: 'center' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', backgroundColor: ss.bg, color: ss.color, border: `1px solid ${ss.border}` }}>{ss.label}</span>
                    </td>
                    <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', textAlign: 'center' }}>
                      <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 7px', backgroundColor: p.status === 'Active' ? '#e8f5e9' : '#fafafa', color: p.status === 'Active' ? '#2e7d32' : '#9e9e9e', border: `1px solid ${p.status === 'Active' ? '#a5d6a7' : '#e0e0e0'}` }}>{p.status}</span>
                    </td>
                    <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '3px', justifyContent: 'center' }}>
                        {!isManager && <button onClick={() => openEdit(p)} style={{ display: 'flex', alignItems: 'center', gap: '2px', backgroundColor: '#1a4a8a', color: 'white', border: 'none', padding: '3px 7px', fontSize: '10px', cursor: 'pointer', fontFamily: FONT }}><Edit2 size={10} /> Edit</button>}
                        <button onClick={() => openAdjust(p)} style={{ display: 'flex', alignItems: 'center', gap: '2px', backgroundColor: '#37474f', color: 'white', border: 'none', padding: '3px 7px', fontSize: '10px', cursor: 'pointer', fontFamily: FONT }}><TrendingDown size={10} /> Adjust</button>
                        <button onClick={() => { setHistoryProduct(p); setShowHistory(true); }} style={{ display: 'flex', alignItems: 'center', gap: '2px', backgroundColor: '#546e7a', color: 'white', border: 'none', padding: '3px 7px', fontSize: '10px', cursor: 'pointer', fontFamily: FONT }}><BarChart2 size={10} /> Log</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '6px 10px', borderTop: '1px solid #c4cdd6', backgroundColor: '#f5f7f9', fontSize: '11px', color: '#78909c', display: 'flex', gap: '20px' }}>
          <span>Products: {storeProducts.length}</span>
          <span>Active: {storeProducts.filter(p => p.status === 'Active').length}</span>
          <span>Low Stock: {lowCount}</span>
          <span>Out of Stock: {outCount}</span>
          <span style={{ marginLeft: 'auto', fontWeight: 600, color: '#1a2636' }}>Inventory Value: {PH(totalValue)}</span>
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      <WinModal title={editingProduct ? `Edit Product — ${editingProduct.id}` : 'Add New Product'} isOpen={showAddModal} onClose={() => setShowAddModal(false)} width="500px">
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div style={{ gridColumn: '1 / -1' }}><FL>Product Name *</FL><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={IS} placeholder="e.g. Premium Rice 25kg" /></div>
            <div><FL>Category *</FL><input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={IS} placeholder="e.g. Grains" /></div>
            <div><FL>Status</FL><select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as 'Active' | 'Inactive' }))} style={{ ...IS, backgroundColor: '#f5f7f9' }}><option>Active</option><option>Inactive</option></select></div>
            <div><FL>Unit Price (₱)</FL><input type="number" value={form.unitPrice} onChange={e => setForm(f => ({ ...f, unitPrice: e.target.value }))} style={{ ...IS, textAlign: 'right' }} placeholder="0.00" /></div>
            <div><FL>Cost Price (₱)</FL><input type="number" value={form.costPrice} onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))} style={{ ...IS, textAlign: 'right' }} placeholder="0.00" /></div>
            <div><FL>Quantity on Hand</FL><input type="number" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} style={{ ...IS, textAlign: 'right' }} placeholder="0" /></div>
            <div><FL>Reorder Level</FL><input type="number" value={form.reorderLevel} onChange={e => setForm(f => ({ ...f, reorderLevel: e.target.value }))} style={{ ...IS, textAlign: 'right' }} placeholder="0" /></div>
          </div>
          {form.unitPrice && form.costPrice && (
            <div style={{ backgroundColor: '#e3f2fd', border: '1px solid #90caf9', padding: '8px 10px', fontSize: '11px', color: '#1565c0', marginBottom: '12px' }}>
              Gross Margin: {PH(parseFloat(form.unitPrice) - parseFloat(form.costPrice))} ({((parseFloat(form.unitPrice) - parseFloat(form.costPrice)) / parseFloat(form.unitPrice) * 100).toFixed(1)}%)
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button onClick={() => setShowAddModal(false)} style={{ backgroundColor: '#dde2e7', border: '1px solid #9aabb8', padding: '6px 18px', fontSize: '12px', cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
            <button onClick={handleSaveProduct} style={{ backgroundColor: '#1a4a8a', color: 'white', border: '1px solid #0d3a7a', padding: '6px 18px', fontSize: '12px', cursor: 'pointer', fontWeight: 600, fontFamily: FONT }}>
              {editingProduct ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </div>
      </WinModal>

      {/* Adjust Stock Modal */}
      <WinModal title={`Adjust Stock — ${adjustProduct?.name}`} isOpen={showAdjust} onClose={() => setShowAdjust(false)} width="400px">
        <div style={{ padding: '16px' }}>
          {adjustProduct && (
            <div style={{ backgroundColor: '#f5f7f9', border: '1px solid #c4cdd6', padding: '8px 10px', marginBottom: '12px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#546e7a' }}>Product:</span><strong>{adjustProduct.name}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#546e7a' }}>Current Stock:</span><strong style={{ color: adjustProduct.qty === 0 ? '#c62828' : '#1a2636' }}>{adjustProduct.qty} units</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#546e7a' }}>Reorder Level:</span><span>{adjustProduct.reorderLevel} units</span></div>
            </div>
          )}
          <div style={{ marginBottom: '10px' }}>
            <FL>Adjustment Type</FL>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[['in', 'Stock In (+)', '#2e7d32'], ['out', 'Stock Out (−)', '#c62828'], ['set', 'Set Exact', '#1565c0']].map(([v, l, c]) => (
                <button key={v} onClick={() => setAdjustType(v as 'in' | 'out' | 'set')} style={{ flex: 1, padding: '5px', fontSize: '11px', cursor: 'pointer', fontWeight: adjustType === v ? 700 : 400, backgroundColor: adjustType === v ? c : '#f5f7f9', color: adjustType === v ? 'white' : '#374151', border: `1px solid ${adjustType === v ? c : '#c4cdd6'}`, fontFamily: FONT }}>
                  {l as string}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <FL>Quantity *</FL>
            <input type="number" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} style={{ ...IS, textAlign: 'right', fontSize: '14px', fontWeight: 700 }} placeholder="Enter quantity..." />
          </div>
          <div style={{ marginBottom: '14px' }}>
            <FL>Reason / Notes</FL>
            <input value={adjustNote} onChange={e => setAdjustNote(e.target.value)} style={IS} placeholder="e.g. Supplier delivery, Spoilage, Correction..." />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button onClick={() => setShowAdjust(false)} style={{ backgroundColor: '#dde2e7', border: '1px solid #9aabb8', padding: '6px 18px', fontSize: '12px', cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
            <button onClick={handleAdjust} style={{ backgroundColor: '#37474f', color: 'white', border: '1px solid #263238', padding: '6px 18px', fontSize: '12px', cursor: 'pointer', fontWeight: 600, fontFamily: FONT }}>Apply Adjustment</button>
          </div>
        </div>
      </WinModal>

      {/* Stock History */}
      <WinModal title={`Stock Movement Log — ${historyProduct?.name}`} isOpen={showHistory} onClose={() => setShowHistory(false)} width="600px">
        <div style={{ padding: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: '#1a3a5c', color: 'white' }}>
                {['Date', 'Type', 'Qty Change', 'Before', 'After', 'By', 'Notes'].map(h => (
                  <th key={h} style={{ padding: '6px 8px', textAlign: ['Qty Change', 'Before', 'After'].includes(h) ? 'right' : 'left', border: '1px solid #4a6a8c', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {productHistory.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#90a4ae' }}>No movement history recorded.</td></tr>
              ) : productHistory.map((h, i) => (
                <tr key={h.id} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f2f5f8' }}>
                  <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', color: '#546e7a' }}>{h.date}</td>
                  <td style={{ padding: '5px 8px', border: '1px solid #dde2e7' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 6px', backgroundColor: h.type === 'Restock' ? '#e8f5e9' : h.type === 'Sale' ? '#ffebee' : '#fff3e0', color: h.type === 'Restock' ? '#2e7d32' : h.type === 'Sale' ? '#c62828' : '#e65100', border: '1px solid #ccc' }}>{h.type}</span>
                  </td>
                  <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', textAlign: 'right', fontWeight: 700, color: h.qtyChange >= 0 ? '#2e7d32' : '#c62828' }}>{h.qtyChange >= 0 ? '+' : ''}{h.qtyChange}</td>
                  <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', textAlign: 'right', color: '#546e7a' }}>{h.qtyBefore}</td>
                  <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', textAlign: 'right', fontWeight: 700 }}>{h.qtyAfter}</td>
                  <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', color: '#37474f' }}>{h.employeeName}</td>
                  <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', color: '#546e7a', fontSize: '11px' }}>{h.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowHistory(false)} style={{ backgroundColor: '#1a4a8a', color: 'white', border: '1px solid #0d3a7a', padding: '6px 20px', fontSize: '12px', cursor: 'pointer', fontFamily: FONT }}>Close</button>
          </div>
        </div>
      </WinModal>

      <WinAlert type={alertType} message={alertMsg} isOpen={showAlert} onClose={() => setShowAlert(false)} />
    </div>
  );
}
