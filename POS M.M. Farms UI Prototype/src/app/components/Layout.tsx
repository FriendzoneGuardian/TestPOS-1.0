import { Outlet, NavLink, useNavigate, useLocation } from 'react-router';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, ShoppingCart, CreditCard, Users, Package,
  FileText, BarChart2, LogOut, ChevronRight, Vault, Store, AlertTriangle, Lock
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { WinModal } from './WinModal';

const FONT = "'Segoe UI', Tahoma, Arial, sans-serif";

const allNavSections = [
  {
    label: 'POINT OF SALE',
    items: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true, roles: ['Admin', 'Manager', 'Cashier'] },
      { path: '/cash-sales', label: 'Cash Sales', icon: ShoppingCart, roles: ['Admin', 'Cashier'] },
      { path: '/credit-sales', label: 'Credit Sales', icon: CreditCard, roles: ['Admin', 'Cashier', 'Manager'] },
      { path: '/cash-valuting', label: 'Cash Valuting', icon: Vault, roles: ['Admin', 'Cashier', 'Manager'] },
    ],
  },
  {
    label: 'MANAGEMENT',
    items: [
      { path: '/employees', label: 'Employee Masterlist', icon: Users, roles: ['Admin'] },
      { path: '/inventory', label: 'Inventory', icon: Package, roles: ['Admin', 'Manager'] },
    ],
  },
  {
    label: 'REPORTS',
    items: [
      { path: '/goods-sold', label: 'Goods Sold', icon: FileText, roles: ['Admin', 'Manager'] },
      { path: '/financial-statements', label: 'Financial Statements', icon: BarChart2, roles: ['Admin', 'Manager'] },
    ],
  },
];

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/cash-sales': 'Cash Sales',
  '/credit-sales': 'Credit Sales',
  '/cash-valuting': 'Cash Valuting & Beginning Balance',
  '/employees': 'Employee Masterlist',
  '/inventory': 'Inventory Management',
  '/goods-sold': 'Goods Sold — Transaction Records',
  '/financial-statements': 'Financial Statements',
};

export function Layout() {
  const { currentUser, activeStore, activeSession, isAuthenticated, logout, openSession, cashSessions } = useApp();
  const [time, setTime] = useState(new Date());
  const navigate = useNavigate();
  const location = useLocation();

  // Session opener modal
  const [showOpenSession, setShowOpenSession] = useState(false);
  const [openingBalance, setOpeningBalance] = useState('');
  const [sessionError, setSessionError] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) navigate('/login', { replace: true });
  }, [isAuthenticated, navigate]);

  // Show open-session modal for Cashiers with no active session
  useEffect(() => {
    if (isAuthenticated && currentUser?.role === 'Cashier' && !activeSession && activeStore) {
      setShowOpenSession(true);
    } else {
      setShowOpenSession(false);
    }
  }, [isAuthenticated, currentUser, activeSession, activeStore]);

  if (!isAuthenticated || !currentUser || !activeStore) return null;

  const role = currentUser.role;
  const navSections = allNavSections.map(s => ({
    ...s,
    items: s.items.filter(i => i.roles.includes(role)),
  })).filter(s => s.items.length > 0);

  const initials = currentUser.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const formatDate = (d: Date) => d.toLocaleDateString('en-PH', { weekday: 'short', year: 'numeric', month: 'short', day: '2-digit' });
  const formatTime = (d: Date) => d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const pageTitle = pageTitles[location.pathname] || 'RetailPOS';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleOpenSession = () => {
    setSessionError('');
    const bal = parseFloat(openingBalance);
    if (isNaN(bal) || bal < 0) { setSessionError('Please enter a valid opening balance amount.'); return; }
    openSession(bal);
    setShowOpenSession(false);
    setOpeningBalance('');
  };

  // Check if current path is accessible by role
  const currentNavItem = allNavSections.flatMap(s => s.items).find(i =>
    i.exact ? location.pathname === i.path : location.pathname.startsWith(i.path) && i.path !== '/'
  ) || allNavSections[0].items[0];
  const accessDenied = currentNavItem && !currentNavItem.roles.includes(role);

  const activeSessCount = cashSessions.filter(s => s.storeId === activeStore.id && s.status === 'Active').length;

  return (
    <div style={{ fontFamily: FONT, display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#1a2636' }}>

      {/* ── Sidebar ── */}
      <div style={{ width: '232px', backgroundColor: '#1a2636', display: 'flex', flexDirection: 'column', flexShrink: 0, borderRight: '1px solid #0f1921' }}>
        {/* Brand */}
        <div style={{ backgroundColor: '#0f1921', padding: '12px 14px 10px', borderBottom: '2px solid #1565c0' }}>
          <div style={{ color: '#64b5f6', fontSize: '10px', letterSpacing: '1.5px', fontWeight: 700, marginBottom: '3px' }}>RETAILPOS ENTERPRISE</div>
          <div style={{ color: '#ffffff', fontSize: '15px', fontWeight: 700 }}>■ RetailPOS Pro</div>
          <div style={{ color: '#546e7a', fontSize: '10px', marginTop: '1px' }}>Point of Sale Management v2.1</div>
        </div>

        {/* Active store badge */}
        <div style={{ backgroundColor: '#12233a', padding: '7px 14px', borderBottom: '1px solid #1a3050', display: 'flex', alignItems: 'center', gap: '7px' }}>
          <Store size={11} style={{ color: '#64b5f6', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '10px', color: '#4a7a9b', fontWeight: 700, letterSpacing: '0.5px' }}>ACTIVE STORE</div>
            <div style={{ fontSize: '11px', color: '#90caf9', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeStore.name}</div>
            <div style={{ fontSize: '10px', color: '#546e7a' }}>{activeStore.location} · {activeStore.id}</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', paddingTop: '6px', paddingBottom: '6px' }}>
          {navSections.map(section => (
            <div key={section.label}>
              <div style={{ color: '#4a7a9b', fontSize: '9px', fontWeight: 700, letterSpacing: '1.2px', padding: '10px 14px 3px', textTransform: 'uppercase' }}>
                {section.label}
              </div>
              {section.items.map(item => (
                <NavLink key={item.path} to={item.path} end={item.exact} style={{ textDecoration: 'none' }}>
                  {({ isActive }) => (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '9px', padding: '7px 14px 7px 12px', fontSize: '12px', cursor: 'pointer',
                      backgroundColor: isActive ? '#1565c0' : 'transparent', color: isActive ? '#ffffff' : '#a8c0d4',
                      borderLeft: isActive ? '3px solid #64b5f6' : '3px solid transparent',
                      marginBottom: '1px', transition: 'background-color 0.1s',
                    }}>
                      <item.icon size={14} style={{ flexShrink: 0 }} />
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {isActive && <ChevronRight size={11} style={{ opacity: 0.6 }} />}
                    </div>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Session status */}
        <div style={{ padding: '7px 14px', backgroundColor: activeSession ? '#0d2a10' : '#2a0a0a', borderTop: `1px solid ${activeSession ? '#1b5e20' : '#5c1a1a'}` }}>
          <div style={{ fontSize: '10px', color: activeSession ? '#4caf50' : '#ef5350', fontWeight: 700, marginBottom: '2px' }}>
            {activeSession ? '● SESSION ACTIVE' : '○ NO ACTIVE SESSION'}
          </div>
          {activeSession ? (
            <div style={{ fontSize: '10px', color: '#81c784' }}>
              Opening: ₱{activeSession.openingBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </div>
          ) : (
            <div style={{ fontSize: '10px', color: '#ef9a9a' }}>Open a cash session to accept payments</div>
          )}
        </div>

        {/* Sidebar footer */}
        <div style={{ padding: '10px 14px', borderTop: '1px solid #2a3a4a', backgroundColor: '#0f1921' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '30px', height: '30px', backgroundColor: '#1565c0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#e0eaf3', fontSize: '11px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.fullName}</div>
              <div style={{ color: '#64b5f6', fontSize: '10px' }}>{currentUser.role} · {currentUser.id}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top header */}
        <div style={{
          backgroundColor: '#eceff1', borderBottom: '1px solid #c4cdd6', padding: '0 14px', height: '42px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '10px', color: '#90a4ae', letterSpacing: '0.5px' }}>HOME</span>
            <ChevronRight size={10} style={{ color: '#90a4ae' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#1a2636' }}>{pageTitle}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#37474f' }}>
                <span style={{ fontWeight: 600 }}>{currentUser.fullName}</span>
                <span style={{ color: '#90a4ae', margin: '0 4px' }}>·</span>
                <span style={{ color: '#1565c0', fontWeight: 600 }}>{currentUser.role}</span>
                <span style={{ color: '#90a4ae', margin: '0 4px' }}>·</span>
                <span style={{ color: '#2e7d32', fontWeight: 600 }}>{activeStore.name}</span>
              </div>
              <div style={{ fontSize: '10px', color: '#78909c', fontFamily: 'monospace' }}>
                {formatDate(time)}&nbsp;&nbsp;{formatTime(time)}
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#c62828', color: 'white', border: '1px solid #8b1010', padding: '4px 12px', fontSize: '11px', cursor: 'pointer', fontFamily: FONT }}
            >
              <LogOut size={12} /> Logout
            </button>
          </div>
        </div>

        {/* Status bar */}
        <div style={{ backgroundColor: '#dce1e7', borderBottom: '1px solid #c4cdd6', padding: '2px 14px', fontSize: '10px', color: '#78909c', flexShrink: 0, display: 'flex', gap: '20px' }}>
          <span>● System Ready</span>
          <span>{activeStore.name} — {activeStore.location}</span>
          <span>Terminal: {activeStore.terminalId}</span>
          <span>Session: {activeSession ? activeSession.id : 'No Active Session'}</span>
          <span style={{ marginLeft: 'auto' }}>Fiscal Year: 2026</span>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#dce1e7' }}>
          {accessDenied ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px' }}>
              <Lock size={48} style={{ color: '#90a4ae' }} />
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#37474f' }}>Access Denied</div>
              <div style={{ fontSize: '13px', color: '#78909c' }}>Your role ({currentUser.role}) does not have permission to access this module.</div>
            </div>
          ) : (
            <Outlet />
          )}
        </div>

        {/* Bottom status bar */}
        <div style={{ backgroundColor: '#1a3a5c', padding: '2px 14px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', color: '#7aabcc' }}>RetailPOS Enterprise Edition — Licensed to: ACME Retail Corp.</span>
          <span style={{ fontSize: '10px', color: '#546e7a', fontFamily: 'monospace' }}>DB: Connected ● {activeStore.terminalId}</span>
        </div>
      </div>

      {/* ── Open Cash Session Modal (required for Cashiers) ── */}
      <WinModal
        title="Open Cash Session — Beginning Balance"
        isOpen={showOpenSession}
        onClose={() => {}} // Cannot dismiss — required for cashiers
        width="420px"
      >
        <div style={{ padding: '16px' }}>
          <div style={{ backgroundColor: '#fff8e1', border: '1px solid #ffcc02', padding: '8px 10px', marginBottom: '14px', fontSize: '12px', color: '#5d4037', display: 'flex', alignItems: 'flex-start', gap: '7px' }}>
            <AlertTriangle size={13} style={{ color: '#f57c00', marginTop: '1px', flexShrink: 0 }} />
            <span>A cash session must be opened before accepting transactions. Count the physical cash in the drawer and enter the opening amount below.</span>
          </div>

          <div style={{ backgroundColor: '#f5f7f9', border: '1px solid #c4cdd6', padding: '10px 12px', marginBottom: '14px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span style={{ color: '#546e7a' }}>Cashier:</span><strong>{currentUser.fullName}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span style={{ color: '#546e7a' }}>Store:</span><strong>{activeStore.name} — {activeStore.location}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#546e7a' }}>Terminal:</span><strong>{activeStore.terminalId}</strong></div>
          </div>

          <label style={{ display: 'block', fontSize: '11px', color: '#546e7a', fontWeight: 700, marginBottom: '4px' }}>OPENING CASH AMOUNT (₱) *</label>
          <input
            type="number" min="0" step="0.01"
            value={openingBalance}
            onChange={e => setOpeningBalance(e.target.value)}
            placeholder="0.00"
            autoFocus
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px', border: '2px solid #1a4a8a', fontSize: '20px', fontWeight: 700, outline: 'none', textAlign: 'right', fontFamily: 'monospace', marginBottom: '8px' }}
          />
          {sessionError && (
            <div style={{ color: '#c62828', fontSize: '11px', marginBottom: '8px', backgroundColor: '#ffebee', padding: '5px 8px', border: '1px solid #ef5350' }}>{sessionError}</div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
            <button onClick={handleOpenSession} style={{ backgroundColor: '#2e7d32', color: 'white', border: '1px solid #1b5e20', padding: '8px 24px', fontSize: '12px', cursor: 'pointer', fontWeight: 700, fontFamily: FONT }}>
              ✔ Open Cash Session
            </button>
          </div>
        </div>
      </WinModal>
    </div>
  );
}
