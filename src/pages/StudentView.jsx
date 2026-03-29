import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Alert, Badge, Loading } from '../components/UI'
import TimetableGrid from '../components/TimetableGrid'
import { exportToExcel, exportToPDF } from '../lib/exports'

const YEARS = ['I Year', 'II Year', 'III Year', 'IV Year']

export default function StudentView() {
  const [depts, setDepts] = useState([])
  const [sections, setSections] = useState({})
  const [subjects, setSubjects] = useState({})
  const [teachers, setTeachers] = useState([])
  const [timetables, setTimetables] = useState({})
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [curDept, setCurDept] = useState('')
  const [curYear, setCurYear] = useState('I Year')
  const [curSec, setCurSec] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: d }, { data: sec }, { data: sub }, { data: t }, { data: tt }, { data: st }] = await Promise.all([
      supabase.from('departments').select('*').order('code'),
      supabase.from('sections').select('*').order('name'),
      supabase.from('subjects').select('*'),
      supabase.from('teachers').select('*'),
      supabase.from('timetables').select('*'),
      supabase.from('settings').select('*').single(),
    ])
    setDepts(d || [])
    setSettings(st || {})
    setTeachers(t || [])

    const secMap = {}
    ;(sec || []).forEach(s => {
      if (!secMap[s.dept_code]) secMap[s.dept_code] = {}
      if (!secMap[s.dept_code][s.year]) secMap[s.dept_code][s.year] = []
      secMap[s.dept_code][s.year].push(s.name)
    })
    setSections(secMap)

    const subjMap = {}
    ;(sub || []).forEach(s => {
      if (!subjMap[s.dept_code]) subjMap[s.dept_code] = {}
      if (!subjMap[s.dept_code][s.year]) subjMap[s.dept_code][s.year] = []
      subjMap[s.dept_code][s.year].push(s)
    })
    setSubjects(subjMap)

    const ttMap = {}
    ;(tt || []).forEach(t => {
      const key = `${t.dept_code}-${t.year}-${t.section}`
      ttMap[key] = t
    })
    setTimetables(ttMap)

    if (d?.length) {
      const firstDept = d[0].code
      setCurDept(firstDept)
      const firstYear = YEARS.find(yr => secMap[firstDept]?.[yr]?.length)
      if (firstYear) {
        setCurYear(firstYear)
        setCurSec(secMap[firstDept][firstYear][0])
      }
    }
    setLoading(false)
  }

  function changeDept(dept) {
    setCurDept(dept)
    const firstYear = YEARS.find(yr => sections[dept]?.[yr]?.length)
    if (firstYear) {
      setCurYear(firstYear)
      setCurSec(sections[dept][firstYear][0])
    }
  }

  function changeYear(yr) {
    setCurYear(yr)
    const secs = sections[curDept]?.[yr] || []
    if (secs.length) setCurSec(secs[0])
  }

  const key = `${curDept}-${curYear}-${curSec}`
  const tt = timetables[key]
  const grid = tt?.grid || null
  const curSubjects = subjects[curDept]?.[curYear] || []
  const curTeachers = teachers.filter(t => t.dept_code === curDept)
  const deptName = depts.find(d => d.code === curDept)?.name || ''
  const sem = settings.current_sem === 'odd'
    ? `Odd Semester (${settings.odd_sem_start}–${settings.odd_sem_end})`
    : `Even Semester (${settings.even_sem_start}–${settings.even_sem_end})`

  if (loading) return <Loading />

  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 600, color: '#e8eaf0', marginBottom: 4 }}>Student Timetable</div>
      <div style={{ fontSize: 13, color: '#8892a4', marginBottom: 16 }}>View timetable by department, year and section</div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 16 }}>
        <div>
          <label style={{ fontSize: 12, color: '#8892a4', fontWeight: 500, display: 'block', marginBottom: 5 }}>Department</label>
          <select value={curDept} onChange={e => changeDept(e.target.value)} style={{ width: 'auto' }}>
            {depts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, color: '#8892a4', fontWeight: 500, display: 'block', marginBottom: 5 }}>Year</label>
          <select value={curYear} onChange={e => changeYear(e.target.value)} style={{ width: 'auto' }}>
            {YEARS.filter(yr => sections[curDept]?.[yr]?.length).map(yr => <option key={yr} value={yr}>{yr}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, color: '#8892a4', fontWeight: 500, display: 'block', marginBottom: 5 }}>Section</label>
          <select value={curSec} onChange={e => setCurSec(e.target.value)} style={{ width: 'auto' }}>
            {(sections[curDept]?.[curYear] || []).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {grid && (
          <div style={{ display: 'flex', gap: 6, paddingBottom: 1 }}>
            <button className="btn btn-success btn-sm" onClick={() => exportToPDF(grid, curSubjects, curTeachers, curDept, curYear, curSec, settings.college_name, settings.acad_year, sem)}>
              📄 Export PDF
            </button>
            <button className="btn btn-sm" onClick={() => exportToExcel(grid, curSubjects, curDept, curYear, curSec, settings.college_name, settings.acad_year)}>
              📊 Export Excel
            </button>
          </div>
        )}
      </div>

      {/* Timetable */}
      {grid ? (
        <>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{deptName} — {curYear} Section {curSec}</div>
                <div style={{ fontSize: 12, color: '#8892a4', marginTop: 3 }}>{sem} · {settings.acad_year} · Pre-lunch: {settings.pre_lunch_duration}min · Post-lunch: {settings.post_lunch_duration}min</div>
              </div>
              <Badge variant="green">✓ Clash-Free</Badge>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              <span style={{ fontSize: 11, color: '#4a5568' }}>Legend:</span>
              <Badge variant="teal">Theory</Badge>
              <Badge variant="amber">🔬 Lab (4 consecutive)</Badge>
            </div>
            <TimetableGrid grid={grid} subjects={curSubjects} teachers={curTeachers} showTime settings={settings} />
          </div>

          {/* Subject Summary */}
          <div className="card">
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Subject Summary</div>
            <div style={{ overflowX: 'auto', borderRadius: 6, border: '1px solid #2a3347' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>{['Subject', 'Type', 'Teacher', 'Weekly Target', 'Placed', 'Status'].map(h => (
                    <th key={h} style={{ background: '#1e2535', padding: '8px 12px', textAlign: 'left', fontWeight: 500, color: '#8892a4', borderBottom: '1px solid #2a3347', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {curSubjects.map(s => {
                    const count = grid.flat().filter(c => c?.subjectCode === s.code).length
                    const teacher = curTeachers.find(t => t.subjects?.includes(s.code))
                    const ok = count >= s.weekly_periods
                    return (
                      <tr key={s.id} style={{ borderBottom: '1px solid #2a3347' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 500 }}>{s.name}</td>
                        <td style={{ padding: '10px 12px' }}><Badge variant={s.is_lab ? 'amber' : 'teal'}>{s.is_lab ? 'Lab' : 'Theory'}</Badge></td>
                        <td style={{ padding: '10px 12px', color: '#8892a4' }}>{teacher?.name || <span style={{ color: '#ef4444' }}>⚠ Unassigned</span>}</td>
                        <td style={{ padding: '10px 12px' }}><span className="tag">{s.weekly_periods}/week</span></td>
                        <td style={{ padding: '10px 12px' }}><span className="tag">{count} placed</span></td>
                        <td style={{ padding: '10px 12px' }}><Badge variant={ok ? 'green' : 'amber'}>{ok ? '✓ OK' : '⚠ Check'}</Badge></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="card">
          <div style={{ textAlign: 'center', padding: '48px 20px', color: '#4a5568' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 14, marginBottom: 8 }}>No timetable found for {curDept} {curYear} Section {curSec}</div>
            <div style={{ fontSize: 12, marginBottom: 20 }}>Generate and save a timetable first</div>
            <a href="/generate" className="btn btn-primary">⚡ Go to Generate</a>
          </div>
        </div>
      )}
    </div>
  )
}
