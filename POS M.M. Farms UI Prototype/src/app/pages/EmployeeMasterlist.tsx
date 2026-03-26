import { useState } from 'react';
import { UserPlus, Edit2, UserX, UserCheck, Search, Users, Store } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Employee } from '../data/mockData';
import { WinModal, WinAlert } from '../components/WinModal';

const FONT = "'Segoe UI', Arial, sans-serif";
const IS: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '6px 8px', border: '1px solid #b0bec5', fontSize: '12px', outline: 'none', fontFamily: FONT };

const roleBadge: Record<string, { bg: string; color: string; border: string }> = {
  Admin:   { bg: '#e3f2fd', color: '#0d47a1', border: '#90caf9' },
  Manager: { bg: '#fff3e0', color: '#bf360c', border: '#ffb74d' },
  Cashier: { bg: '#e8f5e9', color: '#1b5e20', border: '#a5d6a7' },
};

const emptyForm = {
  fullName: '', username: '', role: 'Cashier' as Employee['role'],
  status: 'Active' as Employee['status'], password: '', storeIds: [] as string[],
};

function FL({ children }: { children: React.ReactNode }) {
  return <label style={{ display: 'block', fontSize: '11px', color: '#546e7a', fontWeight: 600, marginBottom: '3px' }}>{children}</label>;
}

export function EmployeeMasterlist() {
  const { employees, stores, saveEmployee, toggleEmployeeStatus, creditLedger, activeStore } = useApp();

  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterStore, setFilterStore] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning' | 'info'>('success');
  const [showConfirmToggle, setShowConfirmToggle] = useState(false);
  const [toggleId, setToggleId] = useState('');
  const [showPw, setShowPw] = useState(false);

  const filtered = employees.filter(e =>
    (filterRole === 'All' || e.role === filterRole) &&
    (filterStatus === 'All' || e.status === filterStatus) &&
    (filterStore === 'All' || e.storeIds.includes(filterStore)) &&
    (e.fullName.toLowerCase().includes(search.toLowerCase()) || e.username.toLowerCase().includes(search.toLowerCase()) || e.id.toLowerCase().includes(search.toLowerCase()))
  );

  const getEmpBalance = (empId: string) => {
    if (!activeStore) return 0;
    const entries = creditLedger.filter(e => e.employeeId === empId && e.storeId === activeStore.id);
    return entries.length === 0 ? 0 : entries[entries.length - 1].runningBalance;
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm, storeIds: activeStore ? [activeStore.id] : [] });
    setShowPw(false); setShowModal(true);
  };

  const openEdit = (e: Employee) => {
    setEditingId(e.id);
    setForm({ fullName: e.fullName, username: e.username, role: e.role, status: e.status, password: '', storeIds: [...e.storeIds] });
    setShowPw(false); setShowModal(true);
  };

  const handleSave = () => {
    if (!form.fullName.trim()) { setAlertMsg('Full name is required.'); setAlertType('error'); setShowAlert(true); return; }
    if (!form.username.trim()) { setAlertMsg('Username is required.'); setAlertType('error'); setShowAlert(true); return; }
    if (!editingId && !form.password.trim()) { setAlertMsg('Password is required for new employees.'); setAlertType('error'); setShowAlert(true); return; }
    if (form.storeIds.length === 0) { setAlertMsg('At least one store assignment is required.'); setAlertType('error'); setShowAlert(true); return; }

    const result = saveEmployee({ ...form, ...(editingId ? { id: editingId } : {}) });
    if (result.error) { setAlertMsg(result.error); setAlertType('error'); setShowAlert(true); return; }
    setAlertMsg(editingId ? `Employee ${result.id} updated successfully.` : `New employee account created: ${result.id}`);
    setAlertType('success'); setShowAlert(true); setShowModal(false);
  };

  const toggleStore = (storeId: string) => {
    setForm(f => ({
      ...f,
      storeIds: f.storeIds.includes(storeId) ? f.storeIds.filter(s => s !== storeId) : [...f.storeIds, storeId],
    }));
  };

  const confirmToggle = (id: string) => { setToggleId(id); setShowConfirmToggle(true); };
  const doToggle = () => {
    const emp = employees.find(e => e.id === toggleId);
    toggleEmployeeStatus(toggleId);
    setShowConfirmToggle(false);
    setAlertMsg(`Employee account has been ${emp?.status === 'Active' ? 'deactivated' : 'activated'}.`);
    setAlertType(emp?.status === 'Active' ? 'warning' : 'success');
    setShowAlert(true);
  };

  const toggleEmp = employees.find(e => e.id === toggleId);

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', height: '100%', fontFamily: FONT }}>

      {/* Header */}
      <div style={{ backgroundColor: '#1a3a5c', color: 'white', padding: '6px 12px', fontSize: '13px', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span><Users size={14} style={{ display: 'inline', marginRight: '6px' }} />EMPLOYEE MASTERLIST — ROLE-BASED ACCESS MANAGEMENT</span>
        <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#2e7d32', color: 'white', border: '1px solid #1b5e20', padding: '4px 12px', fontSize: '11px', cursor: 'pointer', fontFamily: FONT }}>
          <UserPlus size={12} /> Add New Employee
        </button>
      </div>

      {/* Filters */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #c4cdd6', padding: '8px 12px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={12} style={{ position: 'absolute', left: '7px', top: '50%', transform: 'translateY(-50%)', color: '#90a4ae' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, username or ID..." style={{ width: '100%', boxSizing: 'border-box', padding: '5px 6px 5px 24px', border: '1px solid #b0bec5', fontSize: '12px', outline: 'none', fontFamily: FONT }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <label style={{ fontSize: '12px', color: '#546e7a', fontWeight: 600 }}>Role:</label>
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ padding: '5px 8px', border: '1px solid #b0bec5', fontSize: '12px', outline: 'none', fontFamily: FONT }}>
            {['All', 'Admin', 'Manager', 'Cashier'].map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <label style={{ fontSize: '12px', color: '#546e7a', fontWeight: 600 }}>Status:</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '5px 8px', border: '1px solid #b0bec5', fontSize: '12px', outline: 'none', fontFamily: FONT }}>
            {['All', 'Active', 'Inactive'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <label style={{ fontSize: '12px', color: '#546e7a', fontWeight: 600 }}>Store:</label>
          <select value={filterStore} onChange={e => setFilterStore(e.target.value)} style={{ padding: '5px 8px', border: '1px solid #b0bec5', fontSize: '12px', outline: 'none', fontFamily: FONT }}>
            <option value="All">All Stores</option>
            {stores.map(s => <option key={s.id} value={s.id}>{s.name} — {s.location}</option>)}
          </select>
        </div>
        <span style={{ fontSize: '11px', color: '#78909c', marginLeft: 'auto' }}>Showing {filtered.length} of {employees.length}</span>
      </div>

      {/* DataGrid */}
      <div style={{ flex: 1, backgroundColor: '#ffffff', border: '1px solid #c4cdd6', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr style={{ backgroundColor: '#1a3a5c', color: 'white' }}>
                {['Employee ID', 'Full Name', 'Username', 'Role', 'Store Assignments', 'Credit Balance', 'Status', 'Created', 'Actions'].map((h, i) => (
                  <th key={h} style={{ padding: '7px 10px', textAlign: ['Credit Balance'].includes(h) ? 'right' : ['Status', 'Actions'].includes(h) ? 'center' : 'left', border: '1px solid #4a6a8c', fontWeight: 600, whiteSpace: 'nowrap', fontSize: '11px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#90a4ae' }}>No records found matching the search criteria.</td></tr>
              ) : filtered.map((emp, i) => {
                const bal = getEmpBalance(emp.id);
                return (
                  <tr key={emp.id} style={{ backgroundColor: emp.status === 'Inactive' ? '#fafafa' : i % 2 === 0 ? '#ffffff' : '#f2f5f8', opacity: emp.status === 'Inactive' ? 0.75 : 1 }}>
                    <td style={{ padding: '6px 10px', border: '1px solid #dde2e7', fontFamily: 'monospace', fontSize: '11px', color: '#37474f' }}>{emp.id}</td>
                    <td style={{ padding: '6px 10px', border: '1px solid #dde2e7', fontWeight: 600, color: '#1a2636' }}>{emp.fullName}</td>
                    <td style={{ padding: '6px 10px', border: '1px solid #dde2e7', color: '#546e7a', fontFamily: 'monospace', fontSize: '11px' }}>{emp.username}</td>
                    <td style={{ padding: '6px 10px', border: '1px solid #dde2e7' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', backgroundColor: roleBadge[emp.role].bg, color: roleBadge[emp.role].color, border: `1px solid ${roleBadge[emp.role].border}` }}>{emp.role}</span>
                    </td>
                    <td style={{ padding: '6px 10px', border: '1px solid #dde2e7' }}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {stores.map(s => emp.storeIds.includes(s.id) ? (
                          <span key={s.id} style={{ fontSize: '10px', padding: '1px 6px', backgroundColor: '#e3f2fd', color: '#1565c0', border: '1px solid #90caf9', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Store size={9} />{s.name}
                          </span>
                        ) : null)}
                      </div>
                    </td>
                    <td style={{ padding: '6px 10px', border: '1px solid #dde2e7', textAlign: 'right', fontFamily: 'monospace', fontSize: '11px', color: bal >= 1500 ? '#c62828' : bal > 0 ? '#e65100' : '#2e7d32', fontWeight: bal > 0 ? 700 : 400 }}>
                      {activeStore ? `₱${bal.toFixed(2)}` : '—'}
                    </td>
                    <td style={{ padding: '6px 10px', border: '1px solid #dde2e7', textAlign: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', backgroundColor: emp.status === 'Active' ? '#e8f5e9' : '#fafafa', color: emp.status === 'Active' ? '#2e7d32' : '#9e9e9e', border: `1px solid ${emp.status === 'Active' ? '#a5d6a7' : '#e0e0e0'}` }}>
                        {emp.status === 'Active' ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '6px 10px', border: '1px solid #dde2e7', textAlign: 'center', color: '#546e7a', fontSize: '11px' }}>{emp.createdAt}</td>
                    <td style={{ padding: '6px 10px', border: '1px solid #dde2e7', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <button onClick={() => openEdit(emp)} style={{ display: 'flex', alignItems: 'center', gap: '3px', backgroundColor: '#1a4a8a', color: 'white', border: '1px solid #0d3a7a', padding: '3px 9px', fontSize: '11px', cursor: 'pointer', fontFamily: FONT }}>
                          <Edit2 size={11} /> Edit
                        </button>
                        <button onClick={() => confirmToggle(emp.id)} style={{ display: 'flex', alignItems: 'center', gap: '3px', backgroundColor: emp.status === 'Active' ? '#e65100' : '#2e7d32', color: 'white', border: `1px solid ${emp.status === 'Active' ? '#bf360c' : '#1b5e20'}`, padding: '3px 9px', fontSize: '11px', cursor: 'pointer', fontFamily: FONT }}>
                          {emp.status === 'Active' ? <><UserX size={11} /> Deactivate</> : <><UserCheck size={11} /> Activate</>}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '6px 10px', borderTop: '1px solid #c4cdd6', backgroundColor: '#f5f7f9', fontSize: '11px', color: '#78909c', display: 'flex', gap: '20px' }}>
          <span>Total: {employees.length}</span>
          <span>Active: {employees.filter(e => e.status === 'Active').length}</span>
          <span>Inactive: {employees.filter(e => e.status === 'Inactive').length}</span>
          <span>Admins: {employees.filter(e => e.role === 'Admin').length}</span>
          <span>Managers: {employees.filter(e => e.role === 'Manager').length}</span>
          <span>Cashiers: {employees.filter(e => e.role === 'Cashier').length}</span>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <WinModal title={editingId ? `Edit Employee — ${editingId}` : 'Add New Employee Account'} isOpen={showModal} onClose={() => setShowModal(false)} width="500px">
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <FL>Full Name *</FL>
              <input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} style={IS} placeholder="e.g. Juan Dela Cruz" />
            </div>
            <div>
              <FL>Username *</FL>
              <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/\s/g, '') }))} style={IS} placeholder="e.g. jdelacruz" />
            </div>
            <div>
              <FL>Role *</FL>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as Employee['role'] }))} style={{ ...IS, backgroundColor: '#f5f7f9' }}>
                {['Admin', 'Manager', 'Cashier'].map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <FL>{editingId ? 'New Password (leave blank to keep)' : 'Password *'}</FL>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} style={{ ...IS, paddingRight: '60px' }} placeholder="••••••••" />
                <button type="button" onClick={() => setShowPw(s => !s)} style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', backgroundColor: '#dde2e7', border: '1px solid #9aabb8', padding: '1px 8px', fontSize: '10px', cursor: 'pointer', fontFamily: FONT }}>
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <div>
              <FL>Account Status</FL>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                {['Active', 'Inactive'].map(s => (
                  <label key={s} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', cursor: 'pointer' }}>
                    <input type="radio" name="status" value={s} checked={form.status === s} onChange={() => setForm(f => ({ ...f, status: s as Employee['status'] }))} />
                    <span style={{ color: s === 'Active' ? '#2e7d32' : '#9e9e9e', fontWeight: 600 }}>{s}</span>
                  </label>
                ))}
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <FL>Store Assignments * (select one or more)</FL>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                {stores.map(s => (
                  <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', border: `2px solid ${form.storeIds.includes(s.id) ? '#1565c0' : '#c4cdd6'}`, backgroundColor: form.storeIds.includes(s.id) ? '#e3f2fd' : '#f5f7f9', cursor: 'pointer', fontSize: '12px', fontWeight: form.storeIds.includes(s.id) ? 700 : 400 }}>
                    <input type="checkbox" checked={form.storeIds.includes(s.id)} onChange={() => toggleStore(s.id)} style={{ marginRight: '2px' }} />
                    <Store size={12} style={{ color: form.storeIds.includes(s.id) ? '#1565c0' : '#90a4ae' }} />
                    <span>{s.name} — {s.location}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div style={{ backgroundColor: '#fff8e1', border: '1px solid #ffcc02', padding: '8px 10px', fontSize: '11px', color: '#5d4037', marginBottom: '14px' }}>
            ⚠ Role determines system access. Admins have full access. Managers can manage inventory. Cashiers can only process sales. Store assignments determine which stores the employee can log into.
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button onClick={() => setShowModal(false)} style={{ backgroundColor: '#dde2e7', border: '1px solid #9aabb8', padding: '6px 18px', fontSize: '12px', cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
            <button onClick={handleSave} style={{ backgroundColor: '#1a4a8a', color: 'white', border: '1px solid #0d3a7a', padding: '6px 18px', fontSize: '12px', cursor: 'pointer', fontWeight: 600, fontFamily: FONT }}>
              {editingId ? 'Update Employee' : 'Create Account'}
            </button>
          </div>
        </div>
      </WinModal>

      {/* Toggle Status Confirm */}
      <WinModal title="Confirm Account Status Change" isOpen={showConfirmToggle} onClose={() => setShowConfirmToggle(false)} width="380px">
        <div style={{ padding: '16px' }}>
          <p style={{ fontSize: '13px', color: '#1a2636', marginBottom: '12px' }}>
            {toggleEmp?.status === 'Active' ? 'Deactivate' : 'Activate'} account for <strong>{toggleEmp?.fullName}</strong> ({toggleEmp?.id})?
          </p>
          <p style={{ fontSize: '12px', color: '#546e7a', marginBottom: '14px' }}>
            {toggleEmp?.status === 'Active' ? 'A deactivated account cannot log in to the system.' : 'The employee will regain access to the system.'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button onClick={() => setShowConfirmToggle(false)} style={{ backgroundColor: '#dde2e7', border: '1px solid #9aabb8', padding: '6px 18px', fontSize: '12px', cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
            <button onClick={doToggle} style={{ backgroundColor: toggleEmp?.status === 'Active' ? '#e65100' : '#2e7d32', color: 'white', border: '1px solid #ccc', padding: '6px 18px', fontSize: '12px', cursor: 'pointer', fontFamily: FONT }}>Confirm</button>
          </div>
        </div>
      </WinModal>

      <WinAlert type={alertType} message={alertMsg} isOpen={showAlert} onClose={() => setShowAlert(false)} />
    </div>
  );
}
