import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { section: 'Overview', items: [{ to: '/', icon: '◈', label: 'Dashboard' }] },
  {
    section: 'Setup', items: [
      { to: '/departments', icon: '🏛', label: 'Departments' },
      { to: '/sections', icon: '📋', label: 'Sections' },
      { to: '/subjects', icon: '📚', label: 'Subjects' },
      { to: '/teachers', icon: '👨‍🏫', label: 'Teachers' },
    ]
  },
  {
    section: 'Timetable', items: [
      { to: '/generate', icon: '⚡', label: 'Generate' },
      { to: '/student-view', icon: '🎓', label: 'Student View' },
      { to: '/teacher-view', icon: '👤', label: 'Teacher View' },
    ]
  },
  {
    section: 'System', items: [
      { to: '/constraints', icon: '🔒', label: 'Constraints' },
      { to: '/settings', icon: '⚙', label: 'Settings' },
    ]
  },
]

export default function Layout({ children }) {
  const { user, isAdmin, signOut, role } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* SIDEBAR */}
      <div style={{ width: 230, background: '#161b27', borderRight: '1px solid #2a3347', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #2a3347' }}>
          <div style={{ fontSize: 22, marginBottom: 4 }}>⏱</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#e8eaf0', letterSpacing: '-0.3px' }}>TimetableAI</div>
          <div style={{ fontSize: 11, color: '#8892a4', marginTop: 2 }}>Anna University Affiliated</div>
        </div>

        <nav style={{ padding: '10px 8px', flex: 1 }}>
          {NAV.map(({ section, items }) => (
            <div key={section}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#4a5568', letterSpacing: '1px', textTransform: 'uppercase', padding: '10px 8px 4px' }}>
                {section}
              </div>
              {items.map(({ to, icon, label }) => (
                // Hide setup pages for staff
                (!isAdmin && ['Departments', 'Sections', 'Subjects', 'Teachers', 'Generate', 'Settings'].includes(label)) ? null : (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    end={to === '/'}
                  >
                    <span style={{ fontSize: 15, width: 20, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
                    {label}
                  </NavLink>
                )
              ))}
            </div>
          ))}
        </nav>

        {/* User info */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #2a3347' }}>
          <div style={{ fontSize: 12, color: '#8892a4', marginBottom: 4 }}>
            {user?.email}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className={`badge ${isAdmin ? 'badge-blue' : 'badge-green'}`}>
              {isAdmin ? 'Admin' : 'Staff'}
            </span>
            <button className="btn btn-ghost btn-sm" onClick={handleSignOut}>Sign out</button>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {children}
        </div>
      </div>
    </div>
  )
}
