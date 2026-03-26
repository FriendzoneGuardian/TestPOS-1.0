import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface WinModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: string;
  icon?: ReactNode;
}

export function WinModal({ title, isOpen, onClose, children, width = '500px', icon }: WinModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width, backgroundColor: '#ffffff', border: '1px solid #7a9ab5', boxShadow: '4px 4px 16px rgba(0,0,0,0.45)', fontFamily: "'Segoe UI', Arial, sans-serif", maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Title bar */}
        <div style={{ background: 'linear-gradient(to bottom, #2a5a9a, #1a3a6c)', color: 'white', padding: '7px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {icon && <span style={{ opacity: 0.85 }}>{icon}</span>}
            <span style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.2px' }}>{title}</span>
          </div>
          <button
            onClick={onClose}
            style={{ color: 'white', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer', padding: '2px 6px', lineHeight: 1, display: 'flex', alignItems: 'center' }}
          >
            <X size={12} />
          </button>
        </div>
        {/* Content */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

interface WinAlertProps {
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export function WinAlert({ type, message, isOpen, onClose, title }: WinAlertProps) {
  const config = {
    error:   { bg: '#ffebee', border: '#ef5350', icon: '✖', color: '#c62828', titleBg: '#c62828', defaultTitle: 'Error' },
    warning: { bg: '#fff8e1', border: '#ffa726', icon: '⚠', color: '#e65100', titleBg: '#e65100', defaultTitle: 'Warning' },
    info:    { bg: '#e3f2fd', border: '#42a5f5', icon: 'ℹ', color: '#0d47a1', titleBg: '#1565c0', defaultTitle: 'Information' },
    success: { bg: '#e8f5e9', border: '#66bb6a', icon: '✔', color: '#2e7d32', titleBg: '#2e7d32', defaultTitle: 'Success' },
  }[type];

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div style={{ width: '360px', backgroundColor: '#ffffff', border: `1px solid ${config.border}`, boxShadow: '4px 4px 16px rgba(0,0,0,0.4)', fontFamily: "'Segoe UI', Arial, sans-serif" }}>
        <div style={{ background: config.titleBg, color: 'white', padding: '7px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>{title || config.defaultTitle}</span>
          <button onClick={onClose} style={{ color: 'white', background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', padding: '2px 6px' }}><X size={12} /></button>
        </div>
        <div style={{ backgroundColor: config.bg, padding: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '22px', color: config.color }}>{config.icon}</span>
          <p style={{ fontSize: '13px', color: '#1a2636', lineHeight: 1.5, margin: 0 }}>{message}</p>
        </div>
        <div style={{ padding: '10px 16px', borderTop: '1px solid #e0e4e8', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#f5f7f9' }}>
          <button onClick={onClose} style={{ backgroundColor: '#1a4a8a', color: 'white', border: '1px solid #0d3a7a', padding: '5px 20px', fontSize: '12px', cursor: 'pointer' }}>OK</button>
        </div>
      </div>
    </div>
  );
}
