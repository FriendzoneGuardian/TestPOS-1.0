import { useState } from 'react';
import { Vault, CheckCircle, AlertTriangle, Clock, DollarSign, X } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { WinModal, WinAlert } from '../components/WinModal';
import { CashSession } from '../data/mockData';

const PH = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const FONT = "'Segoe UI', Arial, sans-serif";

export function CashValuting() {
  const { activeStore, activeSession, cashSessions, currentUser, openSession, closeSession, transactions } = useApp();

  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [openingBalance, setOpeningBalance] = useState('');
  const [actualCash, setActualCash] = useState('');
  const [closedSession, setClosedSession] = useState<CashSession | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');

  if (!activeStore) return null;

  const sid = activeStore.id;
  const storeSessions = cashSessions.filter(s => s.storeId === sid).sort((a, b) => b.openingTime.localeCompare(a.openingTime));
  const currentActiveSession = cashSessions.find(s => s.storeId === sid && s.status === 'Active');

  // Compute expected cash for the active session
  const sessionCashSales = transactions
    .filter(t => t.storeId === sid && t.type === 'Cash' && t.status === 'Completed')
    .reduce((s, t) => s + t.total, 0);
  const expectedCash = currentActiveSession ? currentActiveSession.openingBalance + sessionCashSales : 0;

  const handleOpenSession = () => {
    const bal = parseFloat(openingBalance);
    if (isNaN(bal) || bal < 0) { setAlertMsg('Please enter a valid opening balance (₱0.00 or greater).'); setShowAlert(true); return; }
    if (currentActiveSession) { setAlertMsg('A cash session is already active for this store. Close it before opening a new one.'); setShowAlert(true); return; }
    openSession(bal);
    setShowOpenModal(false);
    setOpeningBalance('');
  };

  const handleCloseSession = () => {
    const actual = parseFloat(actualCash);
    if (isNaN(actual) || actual < 0) { setAlertMsg('Please enter a valid actual cash amount.'); setShowAlert(true); return; }
    const result = closeSession(actual);
    setClosedSession(result);
    setShowCloseModal(false);
    setActualCash('');
    if (result) setShowResult(true);
  };

  const getVarianceColor = (s?: CashSession) => {
    if (!s?.varianceStatus) return '#546e7a';
    if (s.varianceStatus === 'Balanced') return '#2e7d32';
    if (s.varianceStatus === 'Shortage') return '#c62828';
    return '#e65100';
  };

  const getVarianceBg = (s?: CashSession) => {
    if (!s?.varianceStatus) return '#f5f7f9';
    if (s.varianceStatus === 'Balanced') return '#e8f5e9';
    if (s.varianceStatus === 'Shortage') return '#ffebee';
    return '#fff3e0';
  };

  const formatDateTime = (iso: string) => new Date(iso).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', height: '100%', fontFamily: FONT }}>

      {/* Header */}
      <div style={{ backgroundColor: '#1a3a5c', color: 'white', padding: '6px 12px', fontSize: '13px', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span><Vault size={14} style={{ display: 'inline', marginRight: '6px' }} />CASH VALUTING — {activeStore.name.toUpperCase()} · {activeStore.location.toUpperCase()}</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowOpenModal(true)} disabled={!!currentActiveSession}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: currentActiveSession ? '#546e7a' : '#2e7d32', color: 'white', border: 'none', padding: '4px 14px', fontSize: '11px', cursor: currentActiveSession ? 'not-allowed' : 'pointer', fontFamily: FONT }}>
            <DollarSign size={12} /> Open Session
          </button>
          <button onClick={() => setShowCloseModal(true)} disabled={!currentActiveSession}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: !currentActiveSession ? '#546e7a' : '#c62828', color: 'white', border: 'none', padding: '4px 14px', fontSize: '11px', cursor: !currentActiveSession ? 'not-allowed' : 'pointer', fontFamily: FONT }}>
            <X size={12} /> Close Session
          </button>
        </div>
      </div>

      {/* Current session status */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>

        {/* Active session card */}
        <div style={{ backgroundColor: '#ffffff', border: `2px solid ${currentActiveSession ? '#4caf50' : '#e0e0e0'}`, overflow: 'hidden' }}>
          <div style={{ backgroundColor: currentActiveSession ? '#2e7d32' : '#546e7a', color: 'white', padding: '7px 12px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            {currentActiveSession ? <CheckCircle size={13} /> : <Clock size={13} />}
            {currentActiveSession ? 'Active Cash Session' : 'No Active Session'}
          </div>
          <div style={{ padding: '12px', fontSize: '12px' }}>
            {currentActiveSession ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <InfoCard label="Session ID" value={currentActiveSession.id} mono />
                <InfoCard label="Terminal" value={currentActiveSession.terminalId} />
                <InfoCard label="Opened By" value={currentActiveSession.employeeName} />
                <InfoCard label="Opened At" value={formatDateTime(currentActiveSession.openingTime)} />
                <InfoCard label="Opening Balance" value={PH(currentActiveSession.openingBalance)} valueColor="#2e7d32" />
                <InfoCard label="Cash Sales (Session)" value={PH(sessionCashSales)} valueColor="#1565c0" />
                <InfoCard label="Expected Cash" value={PH(expectedCash)} valueColor="#1a3a5c" />
                <InfoCard label="Store" value={`${activeStore.name} — ${activeStore.location}`} />
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px', color: '#78909c' }}>
                <Clock size={36} style={{ color: '#b0bec5', marginBottom: '8px' }} />
                <div style={{ fontSize: '13px', color: '#546e7a', marginBottom: '4px' }}>No cash session is currently open.</div>
                <div style={{ fontSize: '12px', color: '#90a4ae' }}>Click "Open Session" to begin the register shift and record the beginning balance.</div>
              </div>
            )}
          </div>
        </div>

        {/* Cash formula reference */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #c4cdd6', overflow: 'hidden' }}>
          <div style={{ backgroundColor: '#2c4a6e', color: 'white', padding: '7px 12px', fontSize: '12px', fontWeight: 600 }}>Cash Accountability Formula</div>
          <div style={{ padding: '14px', fontSize: '12px' }}>
            <div style={{ backgroundColor: '#e3f2fd', border: '1px solid #90caf9', padding: '10px 12px', marginBottom: '10px' }}>
              <div style={{ fontWeight: 700, color: '#1565c0', marginBottom: '4px', fontSize: '11px' }}>EXPECTED CASH FORMULA:</div>
              <div style={{ fontFamily: 'monospace', color: '#1a2636' }}>Expected = Opening Balance + Cash Sales</div>
            </div>
            <div style={{ backgroundColor: '#f5f7f9', border: '1px solid #c4cdd6', padding: '10px 12px', marginBottom: '10px' }}>
              <div style={{ fontWeight: 700, color: '#37474f', marginBottom: '4px', fontSize: '11px' }}>VARIANCE FORMULA:</div>
              <div style={{ fontFamily: 'monospace', color: '#1a2636' }}>Variance = Actual Cash − Expected Cash</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 8px', backgroundColor: '#e8f5e9', border: '1px solid #a5d6a7' }}>
                <CheckCircle size={13} style={{ color: '#2e7d32' }} />
                <span style={{ color: '#2e7d32', fontWeight: 600, fontSize: '11px' }}>Balanced — Variance = ₱0.00</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 8px', backgroundColor: '#ffebee', border: '1px solid #ef5350' }}>
                <AlertTriangle size={13} style={{ color: '#c62828' }} />
                <span style={{ color: '#c62828', fontWeight: 600, fontSize: '11px' }}>Shortage — Actual &lt; Expected</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 8px', backgroundColor: '#fff3e0', border: '1px solid #ffa726' }}>
                <AlertTriangle size={13} style={{ color: '#e65100' }} />
                <span style={{ color: '#e65100', fontWeight: 600, fontSize: '11px' }}>Overage — Actual &gt; Expected</span>
              </div>
            </div>
            {currentActiveSession && (
              <div style={{ marginTop: '12px', backgroundColor: '#1a3a5c', color: 'white', padding: '10px 12px' }}>
                <div style={{ fontSize: '10px', color: '#90caf9', marginBottom: '4px' }}>LIVE CALCULATION</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}><span style={{ color: '#90caf9' }}>Opening:</span><span style={{ fontFamily: 'monospace' }}>{PH(currentActiveSession.openingBalance)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}><span style={{ color: '#90caf9' }}>+ Cash Sales:</span><span style={{ fontFamily: 'monospace' }}>{PH(sessionCashSales)}</span></div>
                <div style={{ borderTop: '1px solid #4a6a8c', paddingTop: '4px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}><span style={{ color: '#64b5f6' }}>= Expected:</span><span style={{ fontFamily: 'monospace', color: '#64b5f6' }}>{PH(expectedCash)}</span></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Session History */}
      <div style={{ flex: 1, backgroundColor: '#ffffff', border: '1px solid #c4cdd6', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ backgroundColor: '#2c4a6e', color: 'white', padding: '5px 12px', fontSize: '12px', fontWeight: 600 }}>
          Cash Session History — {activeStore.name}
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr style={{ backgroundColor: '#1a3a5c', color: 'white' }}>
                {['Session ID', 'Opened By', 'Opened At', 'Closed At', 'Opening Bal.', 'Cash Sales', 'Expected', 'Actual', 'Variance', 'Result', 'Status'].map(h => (
                  <th key={h} style={{ padding: '6px 8px', textAlign: ['Opening Bal.', 'Cash Sales', 'Expected', 'Actual', 'Variance'].includes(h) ? 'right' : ['Result', 'Status'].includes(h) ? 'center' : 'left', border: '1px solid #4a6a8c', fontWeight: 600, whiteSpace: 'nowrap', fontSize: '11px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {storeSessions.length === 0 ? (
                <tr><td colSpan={11} style={{ textAlign: 'center', padding: '40px', color: '#90a4ae' }}>No sessions recorded for this store.</td></tr>
              ) : storeSessions.map((sess, i) => (
                <tr key={sess.id} style={{ backgroundColor: sess.status === 'Active' ? '#f0fff4' : i % 2 === 0 ? '#ffffff' : '#f2f5f8' }}>
                  <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', fontFamily: 'monospace', fontSize: '10px', color: '#37474f' }}>{sess.id}</td>
                  <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', color: '#37474f' }}>{sess.employeeName}</td>
                  <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', color: '#546e7a', fontSize: '11px', whiteSpace: 'nowrap' }}>{formatDateTime(sess.openingTime)}</td>
                  <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', color: '#546e7a', fontSize: '11px', whiteSpace: 'nowrap' }}>{sess.closingTime ? formatDateTime(sess.closingTime) : '—'}</td>
                  <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', textAlign: 'right', fontFamily: 'monospace', fontSize: '11px' }}>{PH(sess.openingBalance)}</td>
                  <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', textAlign: 'right', fontFamily: 'monospace', fontSize: '11px', color: '#1565c0' }}>{PH(sess.cashSalesTotal)}</td>
                  <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', textAlign: 'right', fontFamily: 'monospace', fontSize: '11px' }}>{sess.expectedCash !== undefined ? PH(sess.expectedCash) : '—'}</td>
                  <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', textAlign: 'right', fontFamily: 'monospace', fontSize: '11px' }}>{sess.actualCash !== undefined ? PH(sess.actualCash) : '—'}</td>
                  <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', textAlign: 'right', fontFamily: 'monospace', fontSize: '11px', color: getVarianceColor(sess), fontWeight: 600 }}>
                    {sess.variance !== undefined ? (sess.variance >= 0 ? '+' : '') + PH(sess.variance) : '—'}
                  </td>
                  <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', textAlign: 'center' }}>
                    {sess.varianceStatus ? (
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', backgroundColor: getVarianceBg(sess), color: getVarianceColor(sess), border: `1px solid ${getVarianceColor(sess)}` }}>
                        {sess.varianceStatus}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '5px 8px', border: '1px solid #dde2e7', textAlign: 'center' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', backgroundColor: sess.status === 'Active' ? '#e8f5e9' : '#f5f7f9', color: sess.status === 'Active' ? '#2e7d32' : '#546e7a', border: `1px solid ${sess.status === 'Active' ? '#a5d6a7' : '#c4cdd6'}` }}>
                      {sess.status === 'Active' ? '● Active' : '○ Closed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '5px 10px', borderTop: '1px solid #c4cdd6', backgroundColor: '#f5f7f9', fontSize: '11px', color: '#78909c', display: 'flex', gap: '20px' }}>
          <span>Total Sessions: {storeSessions.length}</span>
          <span>Closed: {storeSessions.filter(s => s.status === 'Closed').length}</span>
          <span>Active: {storeSessions.filter(s => s.status === 'Active').length}</span>
          <span>Shortages: {storeSessions.filter(s => s.varianceStatus === 'Shortage').length}</span>
          <span>Overages: {storeSessions.filter(s => s.varianceStatus === 'Overage').length}</span>
        </div>
      </div>

      {/* Open Session Modal */}
      <WinModal title="Open Cash Session — Beginning Balance" isOpen={showOpenModal} onClose={() => setShowOpenModal(false)} width="420px">
        <div style={{ padding: '16px' }}>
          <div style={{ backgroundColor: '#e3f2fd', border: '1px solid #90caf9', padding: '8px 10px', marginBottom: '14px', fontSize: '12px', color: '#1565c0' }}>
            Count the physical cash in the register drawer and enter the total amount below to begin the shift.
          </div>
          <div style={{ backgroundColor: '#f5f7f9', border: '1px solid #c4cdd6', padding: '8px 12px', marginBottom: '14px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span style={{ color: '#546e7a' }}>Cashier:</span><strong>{currentUser?.fullName}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span style={{ color: '#546e7a' }}>Store:</span><strong>{activeStore.name} — {activeStore.location}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#546e7a' }}>Terminal:</span><strong>{activeStore.terminalId}</strong></div>
          </div>
          <label style={{ display: 'block', fontSize: '11px', color: '#546e7a', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase' }}>OPENING CASH AMOUNT (₱) *</label>
          <input type="number" min="0" step="0.01" value={openingBalance} onChange={e => setOpeningBalance(e.target.value)} placeholder="0.00" autoFocus
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px', border: '2px solid #1a4a8a', fontSize: '22px', fontWeight: 700, outline: 'none', textAlign: 'right', fontFamily: 'monospace', marginBottom: '14px' }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button onClick={() => setShowOpenModal(false)} style={{ backgroundColor: '#dde2e7', border: '1px solid #9aabb8', padding: '6px 18px', fontSize: '12px', cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
            <button onClick={handleOpenSession} style={{ backgroundColor: '#2e7d32', color: 'white', border: '1px solid #1b5e20', padding: '6px 18px', fontSize: '12px', cursor: 'pointer', fontWeight: 700, fontFamily: FONT }}>✔ Open Cash Session</button>
          </div>
        </div>
      </WinModal>

      {/* Close Session Modal */}
      <WinModal title="Close Cash Session — Cash Valuting" isOpen={showCloseModal} onClose={() => setShowCloseModal(false)} width="460px">
        <div style={{ padding: '16px' }}>
          <div style={{ backgroundColor: '#fff8e1', border: '1px solid #ffcc02', padding: '8px 10px', marginBottom: '14px', fontSize: '12px', color: '#5d4037', display: 'flex', gap: '7px' }}>
            <AlertTriangle size={13} style={{ color: '#f57c00', marginTop: '1px', flexShrink: 0 }} />
            <span>Physically count all cash in the drawer and enter the total below. This will be compared against the system's expected amount.</span>
          </div>

          {currentActiveSession && (
            <div style={{ backgroundColor: '#1a3a5c', color: 'white', padding: '10px 12px', marginBottom: '14px', fontSize: '12px' }}>
              <div style={{ fontSize: '10px', color: '#90caf9', fontWeight: 700, marginBottom: '6px', letterSpacing: '1px' }}>EXPECTED CASH BREAKDOWN</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}><span style={{ color: '#90caf9' }}>Opening Balance:</span><span style={{ fontFamily: 'monospace' }}>{PH(currentActiveSession.openingBalance)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}><span style={{ color: '#90caf9' }}>+ Cash Sales:</span><span style={{ fontFamily: 'monospace' }}>{PH(sessionCashSales)}</span></div>
              <div style={{ borderTop: '1px solid #4a6a8c', paddingTop: '5px', marginTop: '5px', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '14px' }}><span style={{ color: '#64b5f6' }}>= Expected:</span><span style={{ fontFamily: 'monospace', color: '#64b5f6' }}>{PH(expectedCash)}</span></div>
            </div>
          )}

          <label style={{ display: 'block', fontSize: '11px', color: '#546e7a', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase' }}>ACTUAL CASH IN DRAWER (₱) *</label>
          <input type="number" min="0" step="0.01" value={actualCash} onChange={e => setActualCash(e.target.value)} placeholder="0.00" autoFocus
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px', border: '2px solid #c62828', fontSize: '22px', fontWeight: 700, outline: 'none', textAlign: 'right', fontFamily: 'monospace', marginBottom: '8px' }} />

          {actualCash && (
            <div style={{
              padding: '8px 12px', marginBottom: '14px', fontSize: '13px', fontWeight: 700,
              backgroundColor: Math.abs(parseFloat(actualCash) - expectedCash) < 0.01 ? '#e8f5e9' : parseFloat(actualCash) < expectedCash ? '#ffebee' : '#fff3e0',
              border: `1px solid ${Math.abs(parseFloat(actualCash) - expectedCash) < 0.01 ? '#4caf50' : parseFloat(actualCash) < expectedCash ? '#ef5350' : '#ffa726'}`,
            }}>
              {(() => {
                const actual = parseFloat(actualCash);
                const variance = actual - expectedCash;
                const status = Math.abs(variance) < 0.01 ? 'Balanced' : variance < 0 ? 'Shortage' : 'Overage';
                const color = status === 'Balanced' ? '#2e7d32' : status === 'Shortage' ? '#c62828' : '#e65100';
                return (
                  <div style={{ color }}>
                    {status === 'Balanced' && <CheckCircle size={14} style={{ display: 'inline', marginRight: '5px' }} />}
                    {status !== 'Balanced' && <AlertTriangle size={14} style={{ display: 'inline', marginRight: '5px' }} />}
                    {status} — Variance: {variance >= 0 ? '+' : ''}{PH(variance)}
                  </div>
                );
              })()}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button onClick={() => setShowCloseModal(false)} style={{ backgroundColor: '#dde2e7', border: '1px solid #9aabb8', padding: '6px 18px', fontSize: '12px', cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
            <button onClick={handleCloseSession} style={{ backgroundColor: '#c62828', color: 'white', border: '1px solid #8b1010', padding: '6px 18px', fontSize: '12px', cursor: 'pointer', fontWeight: 700, fontFamily: FONT }}>Close & Vault Session</button>
          </div>
        </div>
      </WinModal>

      {/* Session Close Result Modal */}
      <WinModal title="Session Closed — Valuting Report" isOpen={showResult} onClose={() => setShowResult(false)} width="440px">
        {closedSession && (
          <div style={{ padding: '16px' }}>
            <div style={{ backgroundColor: getVarianceBg(closedSession), border: `2px solid ${getVarianceColor(closedSession)}`, padding: '14px', marginBottom: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>
                {closedSession.varianceStatus === 'Balanced' ? '✔' : '⚠'}
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: getVarianceColor(closedSession) }}>
                Session {closedSession.varianceStatus}
              </div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: getVarianceColor(closedSession), fontFamily: 'monospace', marginTop: '4px' }}>
                {closedSession.variance !== undefined && ((closedSession.variance >= 0 ? '+' : '') + PH(closedSession.variance))}
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', border: '1px solid #c4cdd6' }}>
              <tbody>
                {[
                  ['Session ID', closedSession.id],
                  ['Store', `${activeStore.name} — ${activeStore.location}`],
                  ['Cashier', closedSession.employeeName],
                  ['Opened At', formatDateTime(closedSession.openingTime)],
                  ['Closed At', closedSession.closingTime ? formatDateTime(closedSession.closingTime) : ''],
                  ['Opening Balance', PH(closedSession.openingBalance)],
                  ['Cash Sales Total', PH(closedSession.cashSalesTotal)],
                  ['Expected Cash', PH(closedSession.expectedCash || 0)],
                  ['Actual Cash (Counted)', PH(closedSession.actualCash || 0)],
                  ['Variance', `${(closedSession.variance || 0) >= 0 ? '+' : ''}${PH(closedSession.variance || 0)}`],
                  ['Result', closedSession.varianceStatus || ''],
                ].map(([l, v], i) => (
                  <tr key={l} style={{ backgroundColor: i % 2 === 0 ? '#f5f7f9' : '#ffffff' }}>
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid #e0e4e8', color: '#546e7a', fontWeight: 600, fontSize: '11px' }}>{l}:</td>
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid #e0e4e8', textAlign: 'right', fontFamily: ['Session ID'].includes(l) ? 'monospace' : 'inherit', fontSize: l === 'Session ID' ? '10px' : '12px', fontWeight: ['Expected Cash', 'Actual Cash (Counted)', 'Variance', 'Result'].includes(l) ? 700 : 400, color: l === 'Variance' ? getVarianceColor(closedSession) : l === 'Result' ? getVarianceColor(closedSession) : '#1a2636' }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setShowResult(false)} style={{ backgroundColor: '#1a4a8a', color: 'white', border: '1px solid #0d3a7a', padding: '6px 20px', fontSize: '12px', cursor: 'pointer', fontFamily: FONT }}>OK</button>
            </div>
          </div>
        )}
      </WinModal>

      <WinAlert type="error" message={alertMsg} isOpen={showAlert} onClose={() => setShowAlert(false)} />
    </div>
  );
}

function InfoCard({ label, value, mono = false, valueColor = '#1a2636' }: { label: string; value: string; mono?: boolean; valueColor?: string }) {
  return (
    <div style={{ backgroundColor: '#f5f7f9', border: '1px solid #e0e4e8', padding: '7px 10px' }}>
      <div style={{ fontSize: '10px', color: '#78909c', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '12px', fontWeight: 700, color: valueColor, fontFamily: mono ? 'monospace' : 'inherit', wordBreak: 'break-all' }}>{value}</div>
    </div>
  );
}
