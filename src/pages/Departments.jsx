import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Modal, FormGroup, Alert, Badge, Loading } from '../components/UI'

export default function Departments() {
  const [depts, setDepts] = useState([])
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ code: '', name: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: d }, { data: s }] = await Promise.all([
      supabase.from('departments').select('*').order('code'),
      supabase.from('sections').select('dept_code,year,name'),
    ])
    setDepts(d || [])
    setSections(s || [])
    setLoading(false)
  }

  function openAdd() { setForm({ code: '', name: '' }); setError(''); setModal('add') }
  function openEdit(dept) { setForm({ code: dept.code, name: dept.name }); setError(''); setModal({ edit: dept }) }

  async function save() {
    const code = form.code.trim().toUpperCase()
    const name = form.name.trim()
    if (!code || !name) { setError('Fill all fields'); return }
    setSaving(true)
    if (modal === 'add') {
      const { error } = await supabase.from('departments').insert({ code, name })
      if (error) { setError(error.message); setSaving(false); return }
    } else {
      const { error } = await supabase.from('departments').update({ name }).eq('code', modal.edit.code)
      if (error) { setError(error.message); setSaving(false); return }
    }
    setModal(null); setForm({ code: '', name: '' }); setError(''); setSaving(false); load()
  }

  async function deleteDept(code) {
    if (!confirm(`Delete department ${code} and all its data? This cannot be undone.`)) return
    await supabase.from('departments').delete().eq('code', code)
    load()
  }

  const isEdit = modal && modal !== 'add'
  if (loading) return <Loading />

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#e8eaf0' }}>Departments</div>
          <div style={{ fontSize: 13, color: '#8892a4', marginTop: 2 }}>{depts.length} departments configured</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add Department</button>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #2a3347' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>{['Code', 'Department Name', 'I Year', 'II Year', 'III Year', 'IV Year', 'Actions'].map(h => (
                <th key={h} style={{ background: '#1e2535', padding: '10px 12px', textAlign: 'left', fontWeight: 500, color: '#8892a4', borderBottom: '1px solid #2a3347', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {depts.map(d => (
                <tr key={d.code} style={{ borderBottom: '1px solid #2a3347' }}>
                  <td style={{ padding: '10px 12px' }}><span className="tag">{d.code}</span></td>
                  <td style={{ padding: '10px 12px', fontWeight: 500 }}>{d.name}</td>
                  {['I Year', 'II Year', 'III Year', 'IV Year'].map(yr => {
                    const secs = sections.filter(s => s.dept_code === d.code && s.year === yr)
                    return (
                      <td key={yr} style={{ padding: '10px 12px' }}>
                        {secs.length ? secs.map(s => <Badge key={s.name} variant="blue">{s.name}</Badge>) : <span style={{ color: '#4a5568' }}>—</span>}
                      </td>
                    )
                  })}
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm" style={{ background: '#1e3a5f', borderColor: '#3b82f6', color: '#3b82f6' }} onClick={() => openEdit(d)}>✏ Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteDept(d.code)}>🗑 Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!depts.length && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#4a5568' }}>No departments added yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <Modal open={!!modal} onClose={() => { setModal(null); setError('') }}
        title={isEdit ? `Edit Department — ${modal?.edit?.code}` : 'Add Department'}
        footer={<>
          <button className="btn" onClick={() => { setModal(null); setError('') }}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Department'}</button>
        </>}>
        {error && <Alert variant="error">{error}</Alert>}
        <FormGroup label="Department Code" hint={isEdit ? 'Code cannot be changed' : 'Short unique code e.g. CSE, ECE'}>
          <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. CSE" maxLength={8} disabled={isEdit} style={isEdit ? { opacity: 0.5 } : {}} />
        </FormGroup>
        <FormGroup label="Full Department Name">
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Computer Science & Engineering" />
        </FormGroup>
        {!isEdit && <Alert variant="info">After adding, go to Sections to configure years and sections.</Alert>}
      </Modal>
    </div>
  )
}
