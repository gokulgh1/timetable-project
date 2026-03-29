import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { generateForDept } from '../lib/engine'
import { Alert, Badge, Loading, DeptPill, SectionLabel, Spinner } from '../components/UI'
import TimetableGrid from '../components/TimetableGrid'

const YEARS = ['I Year', 'II Year', 'III Year', 'IV Year']

export default function Generate() {
  const [depts, setDepts] = useState([])
  const [sections, setSections] = useState({})
  const [subjects, setSubjects] = useState({})
  const [teachers, setTeachers] = useState([])
  const [settings, setSettings] = useState({})
  const [curDept, setCurDept] = useState('')
  const [curYear, setCurYear] = useState('I Year')
  const [curSec, setCurSec] = useState('A')
  const [optIdx, setOptIdx] = useState(0)
  const [allowPairs, setAllowPairs] = useState(true)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [results, setResults] = useState(null) // {year: [tt1, tt2]}
  const [genError, setGenError] = useState('')
  const navigate = useNavigate()

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: d }, { data: sec }, { data: sub }, { data: t }, { data: ts }, { data: st }] = await Promise.all([
      supabase.from('departments').select('*').order('code'),
      supabase.from('sections').select('*').order('name'),
      supabase.from('subjects').select('*').order('name'),
      supabase.from('teachers').select('*').order('name'),
      supabase.from('teacher_subjects').select('*'),
      supabase.from('settings').select('*').single(),
    ])
    setDepts(d || [])
    setSettings(st || {})
    setAllowPairs(st?.allow_pairs ?? true)

    // Build sections map: {deptCode: {year: ['A','B',...]}}
    const secMap = {}
    ;(sec || []).forEach(s => {
      if (!secMap[s.dept_code]) secMap[s.dept_code] = {}
      if (!secMap[s.dept_code][s.year]) secMap[s.dept_code][s.year] = []
      secMap[s.dept_code][s.year].push(s.name)
    })
    setSections(secMap)

    // Build subjects map: {deptCode: {year: [{code,name,is_lab,weekly_periods}]}}
    const subjMap = {}
    ;(sub || []).forEach(s => {
      if (!subjMap[s.dept_code]) subjMap[s.dept_code] = {}
      if (!subjMap[s.dept_code][s.year]) subjMap[s.dept_code][s.year] = []
      subjMap[s.dept_code][s.year].push(s)
    })
    setSubjects(subjMap)

    // Attach subjects to teachers
    const teachersWithSubjs = (t || []).map(teacher => ({
      ...teacher,
      subjects: (ts || []).filter(x => x.teacher_id === teacher.teacher_id).map(x => x.subject_code)
    }))
    setTeachers(teachersWithSubjs)

    if (d?.length) setCurDept(d[0].code)
    setLoading(false)
  }

  function doGenerate() {
    setGenerating(true)
    setGenError('')
    setResults(null)
    setTimeout(() => {
      try {
        const deptTeachers = teachers.filter(t => t.dept_code === curDept)
        const res = generateForDept(
          curDept,
          sections[curDept] || {},
          subjects[curDept] || {},
          deptTeachers,
          allowPairs
        )
        if (!Object.keys(res).length) {
          setGenError('Could not generate a valid timetable. Make sure teachers are assigned to all subjects and sections exist.')
        } else {
          setResults(res)
          const firstYear = Object.keys(res)[0]
          setCurYear(firstYear)
          setCurSec(res[firstYear]?.[0]?.sections?.[0] || 'A')
          setOptIdx(0)
        }
      } catch (e) {
        setGenError(e.message)
      }
      setGenerating(false)
    }, 800)
  }

  async function saveTimetable() {
    if (!results) return
    setSaving(true)
    const rows = []
    for (const [year, opts] of Object.entries(results)) {
      const tt = opts[optIdx] || opts[0]
      if (!tt) continue
      for (const sec of tt.sections) {
        rows.push({
          dept_code: curDept, year, section: sec,
          grid: tt.grid[sec], is_active: true, saved_at: new Date().toISOString()
        })
      }
    }
    // Upsert (replace existing)
    for (const row of rows) {
      await supabase.from('timetables').upsert(row, { onConflict: 'dept_code,year,section' })
    }
    setSaving(false)
    alert(`✓ Saved timetables for all sections of ${curDept}!`)
    navigate('/student-view')
  }

  const curGrid = results?.[curYear]?.[optIdx]?.grid?.[curSec]
  const curSubjects = subjects[curDept]?.[curYear] || []
  const curTeachers = teachers.filter(t => t.dept_code === curDept)

  if (loading) return <Loading />

  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 600, color: '#e8eaf0', marginBottom: 4 }}>Generate Timetable</div>
      <div style={{ fontSize: 13, color: '#8892a4', marginBottom: 16 }}>CSP backtracking engine — clash-free, zero free periods</div>

      <Alert variant="info">⚡ All sections of all years are generated together so teacher clashes are checked globally across every section simultaneously.</Alert>

      <div className="card">
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Select Department</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {depts.map(d => <DeptPill key={d.code} label={d.code} active={curDept === d.code} onClick={() => { setCurDept(d.code); setResults(null); setGenError('') }} />)}
        </div>

        {/* Department info */}
        {curDept && (
          <div style={{ marginBottom: 16 }}>
            {YEARS.map(yr => {
              const secs = sections[curDept]?.[yr] || []
              const subjs = subjects[curDept]?.[yr] || []
              if (!secs.length && !subjs.length) return null
              return (
                <div key={yr} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                  <Badge variant="gray">{yr}</Badge>
                  {secs.map(s => <Badge key={s} variant="blue">{s}</Badge>)}
                  <span style={{ fontSize: 11, color: '#8892a4' }}>{subjs.length} subjects</span>
                  {!secs.length && <Badge variant="amber">No sections</Badge>}
                </div>
              )
            })}
          </div>
        )}

        <div style={{ borderTop: '1px solid #2a3347', paddingTop: 16, marginBottom: 16 }}>
          <SectionLabel>Generation Options</SectionLabel>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', background: '#1e2535', padding: 12, borderRadius: 6, border: '1px solid #2a3347' }}>
            <input type="checkbox" checked={allowPairs} onChange={e => setAllowPairs(e.target.checked)} style={{ marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 500, fontSize: 13 }}>Allow same subject as consecutive pair in a day</div>
              <div style={{ fontSize: 11, color: '#8892a4', marginTop: 2 }}>When enabled, one subject per day can appear twice back-to-back (e.g. P3+P4). Disable for fully spread-out scheduling.</div>
            </div>
          </label>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={doGenerate} disabled={generating}>
            {generating ? <><Spinner size={14} /> Generating...</> : `⚡ Generate for ${curDept}`}
          </button>
        </div>
      </div>

      {genError && <Alert variant="error">{genError}</Alert>}

      {results && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Generated — {curDept}</div>
              <div style={{ fontSize: 12, color: '#8892a4', marginTop: 2 }}>{Object.keys(results).length} years · Select year and section to preview</div>
            </div>
            <Badge variant="green">✓ Clash-Free · All Periods Filled</Badge>
          </div>

          <Alert variant="success">✓ Zero free periods · No teacher clashes · Labs consecutive · Period rotation enforced</Alert>

          {/* Year tabs */}
          <SectionLabel>Year</SectionLabel>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {Object.keys(results).map(yr => (
              <div key={yr} className={`sec-tab ${yr === curYear ? 'active' : ''}`}
                onClick={() => { setCurYear(yr); setCurSec(results[yr]?.[0]?.sections?.[0] || 'A'); setOptIdx(0) }}>
                {yr}
              </div>
            ))}
          </div>

          {/* Section tabs */}
          <SectionLabel>Section</SectionLabel>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {(results[curYear]?.[optIdx]?.sections || []).map(s => (
              <div key={s} className={`sec-tab ${s === curSec ? 'active' : ''}`} onClick={() => setCurSec(s)}>
                {curDept}-{s}
              </div>
            ))}
          </div>

          {/* Option cards */}
          <SectionLabel>Timetable Options</SectionLabel>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            {(results[curYear] || []).map((r, i) => (
              <div key={i} className={`feasible-card ${i === optIdx ? 'selected' : ''}`} onClick={() => setOptIdx(i)}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, color: i === optIdx ? '#22c55e' : '#e8eaf0' }}>Option {i + 1}</div>
                <div style={{ fontSize: 11, color: '#8892a4' }}>{r.sections.length} sections · 5 days · 8 periods/day</div>
                <div style={{ marginTop: 8 }}>
                  <Badge variant={i === optIdx ? 'green' : 'gray'}>{i === optIdx ? 'Selected' : 'Click to select'}</Badge>
                </div>
              </div>
            ))}
          </div>

          {/* Preview */}
          <SectionLabel>Preview — {curDept} {curYear} Section {curSec}</SectionLabel>
          <TimetableGrid grid={curGrid} subjects={curSubjects} teachers={curTeachers} showTime settings={settings} />

          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            <button className="btn btn-success" onClick={saveTimetable} disabled={saving}>
              {saving ? 'Saving...' : '✓ Save Selected Timetable'}
            </button>
            <button className="btn" onClick={() => navigate('/student-view')}>🎓 View Student Timetable →</button>
          </div>
        </div>
      )}
    </div>
  )
}
