// ============================================================
// Sections Page
// ============================================================
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Modal, FormGroup, Alert, Badge, Loading, DeptPill } from '../components/UI'

const YEARS = ['I Year', 'II Year', 'III Year', 'IV Year']

export function Sections() {
  const [depts, setDepts] = useState([])
  const [sections, setSections] = useState({})
  const [curDept, setCurDept] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // {dept, year} for add | {edit: sec} for edit
  const [secName, setSecName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: d }, { data: s }] = await Promise.all([
      supabase.from('departments').select('*').order('code'),
      supabase.from('sections').select('*').order('name'),
    ])
    setDepts(d || [])
    const map = {}
    ;(s || []).forEach(sec => {
      if (!map[sec.dept_code]) map[sec.dept_code] = {}
      if (!map[sec.dept_code][sec.year]) map[sec.dept_code][sec.year] = []
      map[sec.dept_code][sec.year].push(sec)
    })
    setSections(map)
    if (d?.length && !curDept) setCurDept(d[0].code)
    setLoading(false)
  }

  function openAdd(dept, year) { setModal({ dept, year }); setSecName(''); setError('') }
  function openEdit(sec) { setModal({ edit: sec }); setSecName(sec.name); setError('') }

  async function save() {
    const name = secName.trim().toUpperCase()
    if (!name) { setError('Enter section name'); return }
    if (modal.edit) {
      const { error } = await supabase.from('sections').update({ name }).eq('id', modal.edit.id)
      if (error) { setError(error.message); return }
    } else {
      const { error } = await supabase.from('sections').insert({ dept_code: modal.dept, year: modal.year, name })
      if (error) { setError(error.message); return }
    }
    setModal(null); setSecName(''); setError(''); load()
  }

  async function deleteSection(id) {
    if (!confirm('Delete this section?')) return
    await supabase.from('sections').delete().eq('id', id)
    load()
  }

  if (loading) return <Loading />

  const isEdit = modal?.edit

  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 600, color: '#e8eaf0', marginBottom: 4 }}>Sections</div>
      <div style={{ fontSize: 13, color: '#8892a4', marginBottom: 16 }}>Manage sections per department per year</div>
      <Alert variant="info">Each department can have different sections per year. A new department may only have I Year students.</Alert>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {depts.map(d => <DeptPill key={d.code} label={d.code} active={curDept === d.code} onClick={() => setCurDept(d.code)} />)}
      </div>
      {curDept && (
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: '#e8eaf0' }}>
            {depts.find(d => d.code === curDept)?.name} <span className="tag">{curDept}</span>
          </div>
          {YEARS.map(yr => {
            const secs = sections[curDept]?.[yr] || []
            return (
              <div key={yr} style={{ background: '#1e2535', border: '1px solid #2a3347', borderRadius: 6, padding: 14, marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#8892a4', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{yr}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {secs.length ? <Badge variant="green">{secs.length} section{secs.length > 1 ? 's' : ''}</Badge> : <Badge variant="gray">No sections</Badge>}
                    <button className="btn btn-sm" onClick={() => openAdd(curDept, yr)}>+ Add</button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {secs.length ? secs.map(s => (
                    <div key={s.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#161b27', border: '1px solid #2a3347', borderRadius: 20, padding: '5px 10px', fontSize: 12, color: '#e8eaf0' }}>
                      Section {s.name}
                      <button onClick={() => openEdit(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', fontSize: 11, padding: '0 2px' }}>✏</button>
                      <span onClick={() => deleteSection(s.id)} style={{ cursor: 'pointer', color: '#4a5568', fontSize: 16, lineHeight: 1 }}>×</span>
                    </div>
                  )) : <span style={{ color: '#4a5568', fontSize: 12 }}>No sections — this year will be skipped during generation</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}
      <Modal open={!!modal} onClose={() => setModal(null)}
        title={isEdit ? `Edit Section — ${modal?.edit?.dept_code} ${modal?.edit?.year}` : `Add Section — ${modal?.dept} ${modal?.year}`}
        footer={<>
          <button className="btn" onClick={() => setModal(null)}>Cancel</button>
          <button className="btn btn-primary" onClick={save}>{isEdit ? 'Save Changes' : 'Add'}</button>
        </>}>
        {error && <Alert variant="error">{error}</Alert>}
        <FormGroup label="Section Name" hint="Typically A, B, C, D — one letter per section">
          <input value={secName} onChange={e => setSecName(e.target.value)} placeholder="e.g. A" maxLength={3} />
        </FormGroup>
      </Modal>
    </div>
  )
}

// ============================================================
// Subjects Page
// ============================================================
export function Subjects() {
  const [depts, setDepts] = useState([])
  const [subjects, setSubjects] = useState({})
  const [curDept, setCurDept] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ code: '', name: '', is_lab: false, weekly_periods: 5 })
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: d }, { data: s }] = await Promise.all([
      supabase.from('departments').select('*').order('code'),
      supabase.from('subjects').select('*').order('name'),
    ])
    setDepts(d || [])
    const map = {}
    ;(s || []).forEach(sub => {
      if (!map[sub.dept_code]) map[sub.dept_code] = {}
      if (!map[sub.dept_code][sub.year]) map[sub.dept_code][sub.year] = []
      map[sub.dept_code][sub.year].push(sub)
    })
    setSubjects(map)
    if (d?.length && !curDept) setCurDept(d[0].code)
    setLoading(false)
  }

  function openAdd(dept, yr) {
    setModal({ dept, year: yr })
    setForm({ code: '', name: '', is_lab: false, weekly_periods: 5 })
    setError('')
  }

  function openEdit(sub) {
    setModal({ edit: sub })
    setForm({ code: sub.code, name: sub.name, is_lab: sub.is_lab, weekly_periods: sub.weekly_periods })
    setError('')
  }

  async function save() {
    if (!form.code || !form.name) { setError('Fill all fields'); return }
    const weekly_periods = form.is_lab ? 4 : Number(form.weekly_periods)
    if (modal.edit) {
      const { error } = await supabase.from('subjects').update({
        name: form.name, is_lab: form.is_lab, weekly_periods
      }).eq('id', modal.edit.id)
      if (error) { setError(error.message); return }
    } else {
      const { error } = await supabase.from('subjects').insert({
        code: form.code.toUpperCase(), name: form.name,
        dept_code: modal.dept, year: modal.year,
        is_lab: form.is_lab, weekly_periods
      })
      if (error) { setError(error.message); return }
    }
    setModal(null); setForm({ code: '', name: '', is_lab: false, weekly_periods: 5 }); setError(''); load()
  }

  async function deleteSubject(id) {
    if (!confirm('Delete this subject?')) return
    await supabase.from('subjects').delete().eq('id', id)
    load()
  }

  if (loading) return <Loading />
  const isEdit = !!modal?.edit

  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 600, color: '#e8eaf0', marginBottom: 4 }}>Subjects</div>
      <div style={{ fontSize: 13, color: '#8892a4', marginBottom: 16 }}>Manage subjects per department per year</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {depts.map(d => <DeptPill key={d.code} label={d.code} active={curDept === d.code} onClick={() => setCurDept(d.code)} />)}
      </div>
      {curDept && YEARS.map(yr => {
        const subjs = subjects[curDept]?.[yr] || []
        return (
          <div key={yr} className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{curDept} — {yr}</div>
                <div style={{ fontSize: 12, color: '#8892a4', marginTop: 2 }}>{subjs.length} subjects configured</div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => openAdd(curDept, yr)}>+ Add Subject</button>
            </div>
            {subjs.length ? (
              <div style={{ overflowX: 'auto', borderRadius: 6, border: '1px solid #2a3347' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>{['Code', 'Subject Name', 'Type', 'Weekly Periods', 'Actions'].map(h => (
                      <th key={h} style={{ background: '#1e2535', padding: '8px 12px', textAlign: 'left', fontWeight: 500, color: '#8892a4', borderBottom: '1px solid #2a3347', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {subjs.map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #2a3347' }}>
                        <td style={{ padding: '10px 12px' }}><span className="tag">{s.code}</span></td>
                        <td style={{ padding: '10px 12px', fontWeight: 500 }}>{s.name}</td>
                        <td style={{ padding: '10px 12px' }}><Badge variant={s.is_lab ? 'amber' : 'teal'}>{s.is_lab ? '🔬 Lab' : 'Theory'}</Badge></td>
                        <td style={{ padding: '10px 12px' }}><span className="tag">{s.weekly_periods}/week</span></td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-sm" style={{ background: '#1e3a5f', borderColor: '#3b82f6', color: '#3b82f6' }} onClick={() => openEdit(s)}>✏ Edit</button>
                            <button className="btn btn-danger btn-sm" onClick={() => deleteSubject(s.id)}>🗑 Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <div style={{ color: '#4a5568', fontSize: 12 }}>No subjects added yet</div>}
          </div>
        )
      })}
      <Modal open={!!modal} onClose={() => setModal(null)}
        title={isEdit ? `Edit Subject — ${modal?.edit?.code}` : `Add Subject — ${modal?.dept} ${modal?.year}`}
        footer={<>
          <button className="btn" onClick={() => setModal(null)}>Cancel</button>
          <button className="btn btn-primary" onClick={save}>{isEdit ? 'Save Changes' : 'Add Subject'}</button>
        </>}>
        {error && <Alert variant="error">{error}</Alert>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormGroup label="Subject Code">
            <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g. CS301"
              disabled={isEdit} style={isEdit ? { opacity: 0.5 } : {}} />
          </FormGroup>
          <FormGroup label="Subject Name">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Operating Systems" />
          </FormGroup>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormGroup label="Type">
            <select value={form.is_lab ? '1' : '0'} onChange={e => setForm(f => ({ ...f, is_lab: e.target.value === '1', weekly_periods: e.target.value === '1' ? 4 : 5 }))}>
              <option value="0">Theory</option>
              <option value="1">Lab (4 consecutive periods)</option>
            </select>
          </FormGroup>
          <FormGroup label="Weekly Periods" hint={form.is_lab ? 'Fixed at 4 for labs' : ''}>
            <input type="number" min={1} max={8} value={form.weekly_periods} disabled={form.is_lab}
              style={form.is_lab ? { opacity: 0.5 } : {}}
              onChange={e => setForm(f => ({ ...f, weekly_periods: Number(e.target.value) }))} />
          </FormGroup>
        </div>
      </Modal>
    </div>
  )
}

// ============================================================
// Teachers Page
// ============================================================
export function Teachers() {
  const [depts, setDepts] = useState([])
  const [teachers, setTeachers] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ teacher_id: '', name: '', email: '', dept_code: '', subjects: [] })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: d }, { data: t }, { data: s }, { data: ts }] = await Promise.all([
      supabase.from('departments').select('*').order('code'),
      supabase.from('teachers').select('*').order('name'),
      supabase.from('subjects').select('*').order('name'),
      supabase.from('teacher_subjects').select('*'),
    ])
    setDepts(d || [])
    const teachersWithSubjs = (t || []).map(teacher => ({
      ...teacher,
      subjects: (ts || []).filter(x => x.teacher_id === teacher.teacher_id).map(x => x.subject_code)
    }))
    setTeachers(teachersWithSubjs)
    setSubjects(s || [])
    if (d?.length) setForm(f => ({ ...f, dept_code: d[0].code }))
    setLoading(false)
  }

  function openAdd() {
    setForm({ teacher_id: '', name: '', email: '', dept_code: depts[0]?.code || '', subjects: [] })
    setError('')
    setModal('add')
  }

  function openEdit(teacher) {
    setForm({
      teacher_id: teacher.teacher_id,
      name: teacher.name,
      email: teacher.email || '',
      dept_code: teacher.dept_code,
      subjects: teacher.subjects || []
    })
    setError('')
    setModal({ edit: teacher })
  }

  const deptSubjects = subjects.filter(s => s.dept_code === form.dept_code)
  const isEdit = modal && modal !== 'add'

  async function save() {
    if (!form.teacher_id || !form.name || !form.dept_code) { setError('Fill all required fields'); return }
    setSaving(true)
    if (isEdit) {
      // Update teacher info
      const { error: e1 } = await supabase.from('teachers').update({
        name: form.name, email: form.email || null, dept_code: form.dept_code
      }).eq('teacher_id', modal.edit.teacher_id)
      if (e1) { setError(e1.message); setSaving(false); return }
      // Delete old subject assignments and re-insert
      await supabase.from('teacher_subjects').delete().eq('teacher_id', modal.edit.teacher_id)
      if (form.subjects.length) {
        const rows = form.subjects.map(sc => {
          const sub = subjects.find(s => s.code === sc)
          return { teacher_id: modal.edit.teacher_id, subject_code: sc, dept_code: form.dept_code, year: sub?.year || '' }
        })
        await supabase.from('teacher_subjects').insert(rows)
      }
    } else {
      const { error: e1 } = await supabase.from('teachers').insert({
        teacher_id: form.teacher_id.toUpperCase(), name: form.name,
        email: form.email || null, dept_code: form.dept_code
      })
      if (e1) { setError(e1.message); setSaving(false); return }
      if (form.subjects.length) {
        const rows = form.subjects.map(sc => {
          const sub = subjects.find(s => s.code === sc)
          return { teacher_id: form.teacher_id.toUpperCase(), subject_code: sc, dept_code: form.dept_code, year: sub?.year || '' }
        })
        await supabase.from('teacher_subjects').insert(rows)
      }
    }
    setModal(null); setError(''); setSaving(false)
    setForm({ teacher_id: '', name: '', email: '', dept_code: depts[0]?.code || '', subjects: [] })
    load()
  }

  async function deleteTeacher(teacher_id) {
    if (!confirm('Delete this teacher?')) return
    await supabase.from('teachers').delete().eq('teacher_id', teacher_id)
    load()
  }

  function allSubjectsForDept(dept) {
    const all = []
    YEARS.forEach(yr => {
      subjects.filter(s => s.dept_code === dept && s.year === yr).forEach(s => {
        if (!all.find(x => x.code === s.code)) all.push(s)
      })
    })
    return all
  }

  if (loading) return <Loading />

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#e8eaf0' }}>Teachers</div>
          <div style={{ fontSize: 13, color: '#8892a4', marginTop: 2 }}>{teachers.length} faculty registered</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add Teacher</button>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #2a3347' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>{['ID', 'Name', 'Email', 'Department', 'Assigned Subjects', 'Actions'].map(h => (
                <th key={h} style={{ background: '#1e2535', padding: '10px 12px', textAlign: 'left', fontWeight: 500, color: '#8892a4', borderBottom: '1px solid #2a3347', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {teachers.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid #2a3347' }}>
                  <td style={{ padding: '10px 12px' }}><span className="tag">{t.teacher_id}</span></td>
                  <td style={{ padding: '10px 12px', fontWeight: 500 }}>{t.name}</td>
                  <td style={{ padding: '10px 12px', color: '#8892a4' }}>{t.email || '—'}</td>
                  <td style={{ padding: '10px 12px' }}><Badge variant="blue">{t.dept_code}</Badge></td>
                  <td style={{ padding: '10px 12px', maxWidth: 280 }}>
                    {t.subjects?.map(sc => {
                      const s = subjects.find(x => x.code === sc)
                      return s ? <Badge key={sc} variant={s.is_lab ? 'amber' : 'teal'} style={{ marginRight: 4, marginBottom: 2 }}>{s.name}</Badge> : null
                    }) || <span style={{ color: '#4a5568' }}>None</span>}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm" style={{ background: '#1e3a5f', borderColor: '#3b82f6', color: '#3b82f6' }} onClick={() => openEdit(t)}>✏ Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteTeacher(t.teacher_id)}>🗑 Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!teachers.length && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#4a5568' }}>No teachers added yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!modal} onClose={() => { setModal(null); setError('') }}
        title={isEdit ? `Edit Teacher — ${modal?.edit?.teacher_id}` : 'Add Teacher'}
        footer={<>
          <button className="btn" onClick={() => { setModal(null); setError('') }}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Teacher'}</button>
        </>}>
        {error && <Alert variant="error">{error}</Alert>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormGroup label="Teacher ID *">
            <input value={form.teacher_id} onChange={e => setForm(f => ({ ...f, teacher_id: e.target.value.toUpperCase() }))}
              placeholder="e.g. T015" disabled={isEdit} style={isEdit ? { opacity: 0.5 } : {}} />
          </FormGroup>
          <FormGroup label="Full Name *">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Dr. Kumar" />
          </FormGroup>
        </div>
        <FormGroup label="Email (optional)">
          <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="teacher@college.edu" />
        </FormGroup>
        <FormGroup label="Department *">
          <select value={form.dept_code} onChange={e => setForm(f => ({ ...f, dept_code: e.target.value, subjects: [] }))}>
            {depts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
          </select>
        </FormGroup>
        <FormGroup label="Assign Subjects">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6, maxHeight: 220, overflowY: 'auto' }}>
            {YEARS.map(yr => {
              const yrSubjs = subjects.filter(s => s.dept_code === form.dept_code && s.year === yr)
              if (!yrSubjs.length) return null
              return (
                <div key={yr}>
                  <div style={{ fontSize: 10, color: '#4a5568', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, marginTop: 8 }}>{yr}</div>
                  {yrSubjs.map(s => (
                    <label key={s.code} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', background: '#1e2535', padding: '8px 10px', borderRadius: 6, border: '1px solid #2a3347', marginBottom: 4 }}>
                      <input type="checkbox" checked={form.subjects.includes(s.code)}
                        onChange={e => setForm(f => ({ ...f, subjects: e.target.checked ? [...f.subjects, s.code] : f.subjects.filter(x => x !== s.code) }))} />
                      <span style={{ flex: 1 }}>{s.name}</span>
                      <Badge variant={s.is_lab ? 'amber' : 'teal'}>{s.is_lab ? 'Lab' : 'Theory'} · {s.weekly_periods}p/w</Badge>
                    </label>
                  ))}
                </div>
              )
            })}
            {!subjects.filter(s => s.dept_code === form.dept_code).length && (
              <div style={{ color: '#4a5568', fontSize: 12 }}>No subjects configured for this department. Add subjects first.</div>
            )}
          </div>
        </FormGroup>
      </Modal>
    </div>
  )
}
