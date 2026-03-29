import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Alert } from '../components/UI'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await signIn(email, password)
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f1117' }}>
      <div style={{ width: 400, maxWidth: '94vw' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>⏱</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: '#e8eaf0' }}>Timetable</div>
          <div style={{ fontSize: 13, color: '#8892a4', marginTop: 4 }}>Anna University Affiliated College</div>
        </div>

        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, color: '#e8eaf0' }}>Sign in to your account</div>

          {error && <Alert variant="error">{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: '#8892a4', fontWeight: 500, display: 'block', marginBottom: 5 }}>Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@college.edu"
                required
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: '#8892a4', fontWeight: 500, display: 'block', marginBottom: 5 }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in →'}
            </button>
          </form>

          <div style={{ marginTop: 16, padding: '12px', background: '#1e2535', borderRadius: 6, fontSize: 11, color: '#8892a4' }}>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Setup instructions:</div>
            <div>1. Create a Supabase project at supabase.com</div>
            <div>2. Run schema.sql in the SQL editor</div>
            <div>3. Create users in Authentication → Users</div>
            <div>4. Set role in user metadata: <code style={{ background: '#252d3d', padding: '1px 4px', borderRadius: 3 }}>{'{"role":"admin"}'}</code></div>
          </div>
        </div>
      </div>
    </div>
  )
}
