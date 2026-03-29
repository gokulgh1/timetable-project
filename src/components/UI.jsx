// ============================================================
// Shared UI Components
// ============================================================

export function Badge({ variant = 'gray', children, className = '' }) {
  const variants = {
    blue: 'badge-blue', green: 'badge-green', amber: 'badge-amber',
    red: 'badge-red', teal: 'badge-teal', gray: 'badge-gray', purple: 'badge-purple'
  }
  return <span className={`badge ${variants[variant]} ${className}`}>{children}</span>
}

export function Alert({ variant = 'info', children }) {
  return <div className={`alert alert-${variant}`}>{children}</div>
}

export function Spinner({ size = 18 }) {
  return (
    <div style={{
      width: size, height: size, border: '2px solid #3a4560',
      borderTopColor: '#3b82f6', borderRadius: '50%',
      animation: 'spin 0.7s linear infinite', flexShrink: 0
    }} />
  )
}

export function Loading({ text = 'Loading...' }) {
  return (
    <div className="flex items-center gap-3 p-6 text-sm" style={{ color: '#8892a4' }}>
      <Spinner />
      {text}
    </div>
  )
}

export function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#161b27', border: '1px solid #3a4560', borderRadius: 10,
        padding: 24, width: 520, maxWidth: '94vw', maxHeight: '88vh',
        overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
      }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: '#e8eaf0' }}>{title}</div>
        {children}
        {footer && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20, paddingTop: 16, borderTop: '1px solid #2a3347' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export function FormGroup({ label, hint, children }) {
  return (
    <div className="flex flex-col gap-1 mb-3">
      {label && <label style={{ fontSize: 12, color: '#8892a4', fontWeight: 500 }}>{label}</label>}
      {children}
      {hint && <div style={{ fontSize: 11, color: '#4a5568', marginTop: 2 }}>{hint}</div>}
    </div>
  )
}

export function StatCard({ label, value, sub }) {
  return (
    <div className="stat">
      <div style={{ fontSize: 11, color: '#8892a4', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 600, color: '#e8eaf0', margin: '6px 0 2px', fontFamily: 'DM Mono, monospace' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#4a5568' }}>{sub}</div>}
    </div>
  )
}

export function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>
      {children}
    </div>
  )
}

export function DeptPill({ label, active, onClick }) {
  return (
    <div className={`dept-pill ${active ? 'active' : ''}`} onClick={onClick}>{label}</div>
  )
}

export function SecTab({ label, active, onClick }) {
  return (
    <div className={`sec-tab ${active ? 'active' : ''}`} onClick={onClick}>{label}</div>
  )
}

export function ConstraintItem({ icon, iconClass, title, desc }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 12px', background: '#1e2535', borderRadius: 6, marginBottom: 6 }}>
      <span className={`badge ${iconClass}`}>{icon}</span>
      <div>
        <div style={{ fontWeight: 500, fontSize: 13 }}>{title}</div>
        <div style={{ fontSize: 11, color: '#8892a4', marginTop: 2 }}>{desc}</div>
      </div>
    </div>
  )
}
