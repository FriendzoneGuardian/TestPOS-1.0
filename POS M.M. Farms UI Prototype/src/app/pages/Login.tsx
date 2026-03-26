import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { LogIn, Eye, EyeOff, Store, ChevronRight, AlertCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const FONT = "'Segoe UI', Tahoma, Arial, sans-serif";

export function Login() {
  const { login, selectStore, stores, currentUser, activeStore } = useApp();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (currentUser && activeStore) navigate('/', { replace: true });
  }, [currentUser, activeStore, navigate]);

  const [step, setStep] = useState<'credentials' | 'store'>('credentials');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loggedInUser, setLoggedInUser] = useState(currentUser);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Please enter your username and password.');
      return;
    }
    const emp = login(username.trim(), password.trim());
    if (!emp) {
      setError('Invalid credentials or account is inactive. Please try again.');
      return;
    }
    setLoggedInUser(emp);
    // If only one store, auto-select
    if (emp.storeIds.length === 1) {
      selectStore(emp.storeIds[0]);
      navigate('/', { replace: true });
    } else {
      setStep('store');
    }
  };

  const handleSelectStore = (storeId: string) => {
    selectStore(storeId);
    navigate('/', { replace: true });
  };

  const assignedStores = stores.filter(s => loggedInUser?.storeIds.includes(s.id));

  return (
    <div style={{
      fontFamily: FONT,
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(135deg, #0a1628 0%, #0f1921 40%, #1a2636 100%)',
    }}>
      {/* Top bar */}
      <div style={{ backgroundColor: '#0a1628', borderBottom: '2px solid #1565c0', padding: '8px 24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ color: '#64b5f6', fontSize: '11px', fontWeight: 700, letterSpacing: '2px' }}>■ RETAILPOS ENTERPRISE</span>
        <span style={{ color: '#4a6a8c', fontSize: '11px' }}>|</span>
        <span style={{ color: '#546e7a', fontSize: '10px' }}>Point of Sale Management System v2.1</span>
        <span style={{ marginLeft: 'auto', color: '#37474f', fontSize: '10px', fontFamily: 'monospace' }}>
          {new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: '2-digit' })}
        </span>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
        <div style={{ display: 'flex', gap: '48px', alignItems: 'flex-start', maxWidth: '900px', width: '100%' }}>

          {/* Left branding panel */}
          <div style={{ flex: 1, color: 'white' }}>
            <div style={{ fontSize: '10px', color: '#4a90c4', letterSpacing: '3px', fontWeight: 700, marginBottom: '12px' }}>ENTERPRISE EDITION</div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#ffffff', lineHeight: 1.1, marginBottom: '8px' }}>RetailPOS</div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#64b5f6', lineHeight: 1.1, marginBottom: '20px' }}>Pro System</div>
            <div style={{ width: '40px', height: '3px', backgroundColor: '#1565c0', marginBottom: '20px' }} />
            <p style={{ fontSize: '13px', color: '#78909c', lineHeight: 1.7, marginBottom: '24px', maxWidth: '320px' }}>
              A comprehensive point-of-sale system with multi-store support, cash session management, employee credit tracking, and real-time inventory control.
            </p>

            {/* Feature list */}
            {[
              'Multi-store operation with data isolation',
              'Cash Valuting & session management',
              'Employee credit purchasing (₱1,500 limit)',
              'Role-based access: Admin · Manager · Cashier',
              'Real-time inventory & financial reports',
            ].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                <ChevronRight size={12} style={{ color: '#1565c0', marginTop: '2px', flexShrink: 0 }} />
                <span style={{ fontSize: '12px', color: '#90a4ae' }}>{f}</span>
              </div>
            ))}

            {/* Demo credentials hint */}
            <div style={{ marginTop: '28px', backgroundColor: '#0f1921', border: '1px solid #1a3a5c', padding: '12px 14px' }}>
              <div style={{ fontSize: '10px', color: '#546e7a', fontWeight: 700, letterSpacing: '1px', marginBottom: '8px' }}>DEMO ACCOUNTS</div>
              {[
                { label: 'Admin (2 stores)', user: 'msantos', pass: 'admin123' },
                { label: 'Manager (Laguna)', user: 'jdelacruz', pass: 'jdc2026' },
                { label: 'Cashier (Laguna)', user: 'areyes', pass: 'ana2026' },
                { label: 'Cashier (Cavite)', user: 'pbautista', pass: 'pedro2026' },
              ].map(d => (
                <div key={d.user} style={{ fontSize: '11px', color: '#64b5f6', marginBottom: '4px', fontFamily: 'monospace' }}>
                  <span style={{ color: '#78909c' }}>{d.label}: </span>
                  {d.user} / <span style={{ color: '#90caf9' }}>{d.pass}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Login form */}
          <div style={{ width: '360px', flexShrink: 0 }}>
            {step === 'credentials' ? (
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #2a3a4a', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                {/* Form header */}
                <div style={{ backgroundColor: '#1a3a5c', padding: '12px 16px', borderBottom: '2px solid #1565c0' }}>
                  <div style={{ color: '#90caf9', fontSize: '10px', letterSpacing: '1.5px', fontWeight: 700 }}>EMPLOYEE LOGIN</div>
                  <div style={{ color: '#ffffff', fontSize: '15px', fontWeight: 700, marginTop: '2px' }}>
                    <LogIn size={14} style={{ display: 'inline', marginRight: '7px', verticalAlign: 'middle' }} />
                    Sign In to RetailPOS
                  </div>
                </div>
                <form onSubmit={handleLogin} style={{ padding: '20px' }}>
                  {/* Error */}
                  {error && (
                    <div style={{ backgroundColor: '#ffebee', border: '1px solid #ef5350', padding: '8px 10px', marginBottom: '14px', display: 'flex', alignItems: 'flex-start', gap: '7px' }}>
                      <AlertCircle size={13} style={{ color: '#c62828', marginTop: '1px', flexShrink: 0 }} />
                      <span style={{ fontSize: '12px', color: '#c62828' }}>{error}</span>
                    </div>
                  )}

                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '11px', color: '#546e7a', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Username
                    </label>
                    <input
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="Enter your username"
                      autoFocus
                      style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '2px solid #b0bec5', fontSize: '13px', outline: 'none', fontFamily: FONT, transition: 'border-color 0.15s' }}
                      onFocus={e => (e.target.style.borderColor = '#1565c0')}
                      onBlur={e => (e.target.style.borderColor = '#b0bec5')}
                    />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '11px', color: '#546e7a', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        style={{ width: '100%', boxSizing: 'border-box', padding: '8px 50px 8px 10px', border: '2px solid #b0bec5', fontSize: '13px', outline: 'none', fontFamily: FONT }}
                        onFocus={e => (e.target.style.borderColor = '#1565c0')}
                        onBlur={e => (e.target.style.borderColor = '#b0bec5')}
                      />
                      <button type="button" onClick={() => setShowPw(s => !s)}
                        style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#90a4ae', padding: '2px' }}>
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" style={{
                    width: '100%', backgroundColor: '#1565c0', color: 'white',
                    border: '1px solid #0d47a1', padding: '10px', fontSize: '13px',
                    fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    letterSpacing: '0.5px',
                  }}>
                    <LogIn size={15} /> LOG IN TO SYSTEM
                  </button>
                </form>
                <div style={{ backgroundColor: '#f5f7f9', padding: '8px 20px', borderTop: '1px solid #e0e4e8', fontSize: '10px', color: '#90a4ae', textAlign: 'center' }}>
                  Unauthorized access is prohibited. All activities are logged.
                </div>
              </div>
            ) : (
              /* Store selection */
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #2a3a4a', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                <div style={{ backgroundColor: '#1a3a5c', padding: '12px 16px', borderBottom: '2px solid #1565c0' }}>
                  <div style={{ color: '#90caf9', fontSize: '10px', letterSpacing: '1.5px', fontWeight: 700 }}>STORE SELECTION</div>
                  <div style={{ color: '#ffffff', fontSize: '14px', fontWeight: 700, marginTop: '2px' }}>
                    <Store size={13} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                    Select Active Store
                  </div>
                </div>
                <div style={{ padding: '16px' }}>
                  <div style={{ backgroundColor: '#e3f2fd', border: '1px solid #90caf9', padding: '8px 10px', marginBottom: '14px', fontSize: '12px', color: '#1565c0' }}>
                    Welcome, <strong>{loggedInUser?.fullName}</strong>! Select the store for this session:
                  </div>
                  {assignedStores.map(store => (
                    <button key={store.id} onClick={() => handleSelectStore(store.id)} style={{
                      width: '100%', backgroundColor: '#f5f7f9', border: '2px solid #c4cdd6',
                      padding: '14px 16px', marginBottom: '10px', cursor: 'pointer',
                      textAlign: 'left', fontFamily: FONT, display: 'flex', alignItems: 'center', gap: '12px',
                      transition: 'all 0.1s',
                    }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#1565c0'; (e.currentTarget as HTMLElement).style.backgroundColor = '#e3f2fd'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#c4cdd6'; (e.currentTarget as HTMLElement).style.backgroundColor = '#f5f7f9'; }}
                    >
                      <div style={{ width: '40px', height: '40px', backgroundColor: '#1a3a5c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Store size={20} style={{ color: '#64b5f6' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#1a2636' }}>{store.name}</div>
                        <div style={{ fontSize: '11px', color: '#546e7a', marginTop: '2px' }}>{store.location} · Terminal: {store.terminalId}</div>
                        <div style={{ fontSize: '10px', color: '#90a4ae', marginTop: '1px' }}>{store.id}</div>
                      </div>
                      <ChevronRight size={16} style={{ color: '#90a4ae' }} />
                    </button>
                  ))}
                  <button onClick={() => { setStep('credentials'); setLoggedInUser(null); }} style={{
                    width: '100%', backgroundColor: '#dde2e7', color: '#374151', border: '1px solid #9aabb8',
                    padding: '7px', fontSize: '12px', cursor: 'pointer', fontFamily: FONT, marginTop: '4px',
                  }}>
                    ← Back to Login
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ backgroundColor: '#0a1628', borderTop: '1px solid #1a2636', padding: '6px 24px', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '10px', color: '#37474f' }}>RetailPOS Enterprise Edition — Licensed to: ACME Retail Corp.</span>
        <span style={{ fontSize: '10px', color: '#37474f', fontFamily: 'monospace' }}>v2.1.0 · DB: Connected · {new Date().getFullYear()}</span>
      </div>
    </div>
  );
}