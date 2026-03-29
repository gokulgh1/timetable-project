import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Alert, Badge, Loading, StatCard } from '../components/UI'
import TimetableGrid from '../components/TimetableGrid'
import { deriveTeacherTimetable, DAYS } from '../lib/engine'
import { exportTeacherToPDF } from '../lib/exports'

const YEARS = ['I Year', 'II Year', 'III Year', 'IV Year']
const PERIODS = 8

export default function TeacherView() {
  const [teachers, setTeachers] = useState([])
  const [subjects, setSubjects] = useState([])
  const [timetables, setTimetables] = useState({})
  const [sections, setSections] = useState({})
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [curTeacher, setCurTeacher] = useState(null)
  const [teacherGrid, setTeacherGrid] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: t }, { data: ts }, { data: s }, { data: sec }, { data: tt }, { data: st }] = await Promise.all([
      supabase.from('teachers').select('*').order('name'),
      supabase.from('teacher_subjects').select('*'),
      supabase.from('subjects').select('*'),
      supabase.from('sections').select('*'),
      supabase.from('timetables').select('*'),
      supabase.from('settings').select('*').single(),
    ])
    setSettings(st || {})
    setSubjects(s || [])

    // Attach subjects to teachers
    const teachersWithSubjs = (t || []).map(teacher => ({
      ...teacher,
      subjects: (ts || []).filter(x => x.teacher_id === teacher.teacher_id).map(x => x.subject_code)
    }))
    setTeachers(teachersWithSubjs)

    // Build section map
    const secMap = {}
    ;(sec || []).forEach(s => {
      if (!secMap[s.dept_code]) secMap[s.dept_code] = {}
      if (!secMap[s.dept_code][s.year]) secMap[s.dept_code][s.year] = []
      secMap[s.dept_code][s.year].push(s.name)
    })
    setSections(secMap)

    // Build timetable map by dept+year
    const ttMap = {}
    ;(tt || []).forEach(t => {
      if (!ttMap[t.dept_code]) ttMap[t.dept_code] = {}
      if (!ttMap[t.dept_code][t.year]) ttMap[t.dept_code][t.year] = {}
      ttMap[t.dept_code][t.year][t.section] = t.grid
    })
    setTimetables(ttMap)

    if (teachersWithSubjs.length) {
      const first = teachersWithSubjs[0]
      setCurTeacher(first)
      buildTeacherGrid(first, ttMap, secMap)
    }
    setLoading(false)
  }

  function buildTeacherGrid(teacher, ttMap, secMap) {
    const dept = teacher.dept_code
    const deptTT = ttMap[dept] || {}
    // Build {year: {grid: {sec: [[]]}, sections: []}} for deriveTeacherTimetable
    const timetablesByYear = {}
    const sectionsByYear = secMap[dept] || {}
    Object.entries(deptTT).forEach(([year, sections]) => {
      timetablesByYear[year] = { grid: sections }
    })
    const grid = deriveTeacherTimetable(teacher.teacher_id, dept, timetablesByYear, sectionsByYear)
    setTeacherGrid(grid)
  }

  function changeTeacher(teacherId) {
    const t = teachers.find(x => x.teacher_id === teacherId)
    if (!t) return
    setCurTeacher(t)
    buildTeacherGrid(t, timetables, sections)
  }

  if (loading) return <Loading />

  const totalPeriods = teacherGrid ? teacherGrid.flat().filter(Boolean).length : 0
  const teacherSubjNames = curTeacher?.subjects?.map(sc => subjects.find(s => s.code === sc)?.name).filter(Boolean) || []
  const sem = settings.current_sem === 'odd'
    ? `Odd Semester (${settings.odd_sem_start}–${settings.odd_sem_end})`
    : `Even Semester (${settings.even_sem_start}–${settings.even_sem_end})`

  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 600, color: '#e8eaf0', marginBottom: 4 }}>Teacher Timetable</div>
      <div style={{ fontSize: 13, color: '#8892a4', marginBottom: 16 }}>Auto-derived from saved section timetables</div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 16 }}>
        <div>
          <label style={{ fontSize: 12, color: '#8892a4', fontWeight: 500, display: 'block', marginBottom: 5 }}>Select Teacher</label>
          <select value={curTeacher?.teacher_id || ''} onChange={e => changeTeacher(e.target.value)} style={{ width: 'auto', minWidth: 240 }}>
            {teachers.map(t => <option key={t.teacher_id} value={t.teacher_id}>{t.name} ({t.dept_code})</option>)}
          </select>
        </div>
        {curTeacher && teacherGrid && (
          <button className="btn btn-success btn-sm" onClick={() => exportTeacherToPDF(teacherGrid, curTeacher, subjects, settings.college_name, settings.acad_year, sem)}>
            📄 Export PDF
          </button>
        )}
      </div>

      {curTeacher && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{curTeacher.name}</div>
              <div style={{ fontSize: 12, color: '#8892a4', marginTop: 3 }}>
                {curTeacher.dept_code} · {teacherSubjNames.join(', ') || 'No subjects assigned'}
              </div>
            </div>
            <span className="tag">{curTeacher.teacher_id}</span>
          </div>

          {teacherGrid && teacherGrid.some(d => d.some(Boolean)) ? (
            <>
              {/* Teacher grid */}
              <div style={{ overflowX: 'auto', marginBottom: 16 }}>
                <table style={{ borderCollapse: 'collapse', fontSize: 11, minWidth: 700, width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ background: '#1e2535', padding: '8px 6px', textAlign: 'center', fontWeight: 500, color: '#8892a4', border: '1px solid #2a3347', fontSize: 10, minWidth: 60 }}>Day</th>
                      {[0,1].map(p=><th key={p} style={{ background: '#1e2535', padding: '8px 6px', textAlign: 'center', fontWeight: 500, color: '#8892a4', border: '1px solid #2a3347', fontSize: 10 }}>P{p+1}</th>)}
                      <th style={{ background: '#252d3d', width: 28, border: '1px solid #2a3347', fontSize: 8, color: '#4a5568', textAlign: 'center' }}>BRK</th>
                      {[2,3].map(p=><th key={p} style={{ background: '#1e2535', padding: '8px 6px', textAlign: 'center', fontWeight: 500, color: '#8892a4', border: '1px solid #2a3347', fontSize: 10 }}>P{p+1}</th>)}
                      <th style={{ background: '#14532d', width: 28, border: '1px solid #2a3347', fontSize: 8, color: '#4ade80', textAlign: 'center' }}>LCH</th>
                      {[4,5].map(p=><th key={p} style={{ background: '#1e2535', padding: '8px 6px', textAlign: 'center', fontWeight: 500, color: '#8892a4', border: '1px solid #2a3347', fontSize: 10 }}>P{p+1}</th>)}
                      <th style={{ background: '#252d3d', width: 28, border: '1px solid #2a3347', fontSize: 8, color: '#4a5568', textAlign: 'center' }}>BRK</th>
                      {[6,7].map(p=><th key={p} style={{ background: '#1e2535', padding: '8px 6px', textAlign: 'center', fontWeight: 500, color: '#8892a4', border: '1px solid #2a3347', fontSize: 10 }}>P{p+1}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.map((day, d) => (
                      <tr key={day}>
                        <td style={{ background: '#1e2535', padding: '8px 6px', fontWeight: 500, color: '#8892a4', fontSize: 11, border: '1px solid #2a3347', textAlign: 'center', whiteSpace: 'nowrap' }}>{day.slice(0, 3)}</td>
                        {[0,1,null,2,3,null,4,5,null,6,7].map((p, idx) => {
                          if (p === null) {
                            const isBrk = idx === 2 || idx === 9
                            return <td key={idx} style={{ background: isBrk ? '#252d3d' : '#14532d', border: '1px solid #2a3347', width: 28 }} />
                          }
                          const cell = teacherGrid[d][p]
                          if (!cell) return <td key={p} style={{ padding: '4px 3px', border: '1px solid #2a3347', textAlign: 'center', height: 56, minWidth: 82 }}>
                            <span style={{ color: '#4a5568', fontSize: 10, fontStyle: 'italic' }}>Free</span>
                          </td>
                          const s = subjects.find(x => x.code === cell.subjectCode)
                          return (
                            <td key={p} style={{ padding: '4px 3px', border: '1px solid #2a3347', textAlign: 'center', height: 56, minWidth: 82 }}>
                              <span className={cell.isLab ? 'tt-cell-lab' : 'tt-cell-theory'}>
                                {s?.name || cell.subjectCode}{cell.isLab ? ' 🔬' : ''}
                                <span className="tt-cell-staff">{cell.year} {cell.section}</span>
                              </span>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Workload summary */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <div className="stat" style={{ flex: 0, minWidth: 110 }}>
                  <div style={{ fontSize: 11, color: '#8892a4', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 500 }}>Total/Week</div>
                  <div style={{ fontSize: 28, fontWeight: 600, color: '#e8eaf0', margin: '6px 0 2px', fontFamily: 'DM Mono, monospace' }}>{totalPeriods}</div>
                </div>
                {DAYS.map((day, d) => {
                  const cnt = teacherGrid[d].filter(Boolean).length
                  return (
                    <div key={day} className="stat" style={{ flex: 0, minWidth: 70 }}>
                      <div style={{ fontSize: 11, color: '#8892a4', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 500 }}>{day.slice(0, 3)}</div>
                      <div style={{ fontSize: 22, fontWeight: 600, color: cnt > 3 ? '#f59e0b' : '#e8eaf0', margin: '6px 0 2px', fontFamily: 'DM Mono, monospace' }}>{cnt}</div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#4a5568' }}>
              <div style={{ fontSize: 14, marginBottom: 8 }}>No timetable data found for this teacher</div>
              <div style={{ fontSize: 12 }}>Generate and save timetables first, then come back here</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
