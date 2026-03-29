import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { StatCard, Badge, Loading } from '../components/UI'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [depts, setDepts] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    const [{ data: departments }, { data: sections }, { data: teachers }, { data: timetables }, { data: settings }] = await Promise.all([
      supabase.from('departments').select('*'),
      supabase.from('sections').select('*'),
      supabase.from('teachers').select('*'),
      supabase.from('timetables').select('dept_code,year,section'),
      supabase.from('settings').select('*').single(),
    ])
    setDepts(departments || [])
    const sem = settings?.current_sem === 'odd'
      ? `Odd Semester (${settings.odd_sem_start}–${settings.odd_sem_end})`
      : `Even Semester (${settings.even_sem_start}–${settings.even_sem_end})`
    setStats({
      depts: departments?.length || 0,
      sectionCount: sections?.length || 0,
      teachers: teachers?.length || 0,
      generated: timetables?.length || 0,
      sem,
      departments: departments || [],
      sections: sections || [],
      timetables: timetables || [],
    })
    setLoading(false)
  }

  if (loading) return <Loading text="Loading dashboard..." />

  const actions = [
    { label: '⚡ Generate Timetables', to: '/generate', cls: 'btn-primary' },
    { label: '📋 Manage Sections', to: '/sections', cls: '' },
    { label: '📚 Manage Subjects', to: '/subjects', cls: '' },
    { label: '👨‍🏫 Manage Teachers', to: '/teachers', cls: '' },
    { label: '🎓 View Student Timetable', to: '/student-view', cls: 'btn-success' },
    { label: '👤 View Teacher Timetable', to: '/teacher-view', cls: '' },
  ]

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 600, color: '#e8eaf0', marginBottom: 4 }}>Dashboard</div>
        <div style={{ fontSize: 13, color: '#8892a4' }}>Welcome back, Admin · {stats?.sem}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard label="Departments" value={stats?.depts} sub="Active this semester" />
        <StatCard label="Total Sections" value={stats?.sectionCount} sub="Across all years" />
        <StatCard label="Faculty" value={stats?.teachers} sub="Registered teachers" />
        <StatCard label="Generated" value={stats?.generated} sub="Saved timetables" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Departments Status</div>
          {stats?.departments.map(d => {
            const secCount = stats.sections.filter(s => s.dept_code === d.code).length
            const ttCount = stats.timetables.filter(t => t.dept_code === d.code).length
            const hasGen = ttCount > 0
            const pct = Math.round(([secCount > 0, hasGen].filter(Boolean).length / 2) * 100)
            return (
              <div key={d.code} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="tag">{d.code}</span>
                    <span style={{ fontSize: 12, color: '#8892a4' }}>{secCount} sections · {ttCount} timetables</span>
                  </div>
                  <Badge variant={hasGen ? 'green' : 'amber'}>{hasGen ? 'Generated' : 'Pending'}</Badge>
                </div>
                <div style={{ height: 3, background: '#252d3d', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: '#3b82f6', borderRadius: 2, transition: 'width 0.4s' }} />
                </div>
              </div>
            )
          })}
        </div>

        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Quick Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {actions.map(a => (
              <button key={a.to} className={`btn ${a.cls}`} style={{ justifyContent: 'center' }} onClick={() => navigate(a.to)}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
