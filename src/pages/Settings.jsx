import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Alert, Loading, SectionLabel, Badge } from '../components/UI'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function Settings() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState('')
  const [saved, setSaved] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('settings').select('*').single()
    setSettings(data || {
      college_name: 'Anna University Affiliated College',
      acad_year: '2025–2026',
      current_sem: 'odd',
      odd_sem_start: 'July', odd_sem_end: 'November',
      even_sem_start: 'January', even_sem_end: 'May',
      pre_lunch_duration: 50, post_lunch_duration: 45,
      short_break_duration: 10, lunch_duration: 45,
      allow_pairs: true,
    })
    setLoading(false)
  }

  async function saveSection(section) {
    setSaving(section)
    const { error } = await supabase.from('settings').upsert(settings)
    setSaving('')
    if (!error) { setSaved(section); setTimeout(() => setSaved(''), 2000) }
  }

  function periodTime(idx) {
    if (!settings) return ''
    let h = 9, m = 0
    for (let i = 0; i < idx; i++) {
      m += i < 4 ? settings.pre_lunch_duration : settings.post_lunch_duration
      if (i === 1) m += settings.short_break_duration
      if (i === 3) m += settings.lunch_duration
      if (i === 5) m += settings.short_break_duration
      h += Math.floor(m / 60); m = m % 60
    }
    const ampm = h < 12 ? 'AM' : 'PM'
    const h12 = h > 12 ? h - 12 : (h === 0 ? 12 : h)
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`
  }

  if (loading) return <Loading />

  const set = (key, val) => setSettings(s => ({ ...s, [key]: val }))
  const SaveBtn = ({ section }) => (
    <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => saveSection(section)} disabled={saving === section}>
      {saving === section ? 'Saving...' : saved === section ? '✓ Saved!' : 'Save'}
    </button>
  )

  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 600, color: '#e8eaf0', marginBottom: 4 }}>Settings</div>
      <div style={{ fontSize: 13, color: '#8892a4', marginBottom: 16 }}>College and period configuration</div>

      {/* College Info */}
      <div className="card">
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>College Information</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: '#8892a4', fontWeight: 500, display: 'block', marginBottom: 5 }}>College Name</label>
            <input value={settings.college_name || ''} onChange={e => set('college_name', e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8892a4', fontWeight: 500, display: 'block', marginBottom: 5 }}>Academic Year</label>
            <input value={settings.acad_year || ''} onChange={e => set('acad_year', e.target.value)} placeholder="e.g. 2025–2026" />
          </div>
        </div>
        <SaveBtn section="college" />
      </div>

      {/* Semester */}
      <div className="card">
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Semester Configuration</div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: '#8892a4', fontWeight: 500, display: 'block', marginBottom: 5 }}>Current Semester</label>
          <select value={settings.current_sem || 'odd'} onChange={e => set('current_sem', e.target.value)} style={{ width: 'auto' }}>
            <option value="odd">Odd Semester</option>
            <option value="even">Even Semester</option>
          </select>
        </div>
        <SectionLabel>Odd Semester Months</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: '#8892a4', fontWeight: 500, display: 'block', marginBottom: 5 }}>Start Month</label>
            <select value={settings.odd_sem_start || 'July'} onChange={e => set('odd_sem_start', e.target.value)}>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8892a4', fontWeight: 500, display: 'block', marginBottom: 5 }}>End Month</label>
            <select value={settings.odd_sem_end || 'November'} onChange={e => set('odd_sem_end', e.target.value)}>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <SectionLabel>Even Semester Months</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: '#8892a4', fontWeight: 500, display: 'block', marginBottom: 5 }}>Start Month</label>
            <select value={settings.even_sem_start || 'January'} onChange={e => set('even_sem_start', e.target.value)}>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8892a4', fontWeight: 500, display: 'block', marginBottom: 5 }}>End Month</label>
            <select value={settings.even_sem_end || 'May'} onChange={e => set('even_sem_end', e.target.value)}>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <SaveBtn section="semester" />
      </div>

      {/* Period Durations */}
      <div className="card">
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Period & Break Durations</div>
        <div style={{ fontSize: 12, color: '#8892a4', marginBottom: 16 }}>Does not affect the scheduling algorithm — only affects period timing display</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: '#8892a4', fontWeight: 500, display: 'block', marginBottom: 5 }}>Pre-Lunch Period Duration — P1 to P4</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="number" min={30} max={90} value={settings.pre_lunch_duration || 50} style={{ width: 80 }} onChange={e => set('pre_lunch_duration', Number(e.target.value))} />
              <span style={{ color: '#8892a4', fontSize: 13 }}>minutes per period</span>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8892a4', fontWeight: 500, display: 'block', marginBottom: 5 }}>Post-Lunch Period Duration — P5 to P8</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="number" min={30} max={90} value={settings.post_lunch_duration || 45} style={{ width: 80 }} onChange={e => set('post_lunch_duration', Number(e.target.value))} />
              <span style={{ color: '#8892a4', fontSize: 13 }}>minutes per period</span>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8892a4', fontWeight: 500, display: 'block', marginBottom: 5 }}>Short Break Duration (after P2 and P6)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="number" min={5} max={30} value={settings.short_break_duration || 10} style={{ width: 80 }} onChange={e => set('short_break_duration', Number(e.target.value))} />
              <span style={{ color: '#8892a4', fontSize: 13 }}>minutes</span>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8892a4', fontWeight: 500, display: 'block', marginBottom: 5 }}>Lunch Break Duration (after P4)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="number" min={15} max={90} value={settings.lunch_duration || 45} style={{ width: 80 }} onChange={e => set('lunch_duration', Number(e.target.value))} />
              <span style={{ color: '#8892a4', fontSize: 13 }}>minutes</span>
            </div>
          </div>
        </div>
        <SaveBtn section="periods" />

        <SectionLabel style={{ marginTop: 20 }}>Period Timings Preview</SectionLabel>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {[0,1,2,3,4,5,6,7].map(i => (
            <div key={i} style={{ background: '#1e2535', border: '1px solid #2a3347', borderRadius: 6, padding: '8px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#8892a4' }}>P{i+1}</div>
              <div style={{ fontSize: 13, color: '#e8eaf0', fontFamily: 'DM Mono, monospace' }}>{periodTime(i)}</div>
              <div style={{ fontSize: 9, color: '#4a5568', marginTop: 2 }}>{i < 4 ? settings.pre_lunch_duration : settings.post_lunch_duration}m</div>
            </div>
          ))}
        </div>

        <SectionLabel style={{ marginTop: 16 }}>Period Layout</SectionLabel>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginTop: 8 }}>
          <Badge variant="blue">P1 ({settings.pre_lunch_duration}m)</Badge>
          <Badge variant="blue">P2 ({settings.pre_lunch_duration}m)</Badge>
          <Badge variant="amber">Short Break ({settings.short_break_duration}m)</Badge>
          <Badge variant="blue">P3 ({settings.pre_lunch_duration}m)</Badge>
          <Badge variant="blue">P4 ({settings.pre_lunch_duration}m)</Badge>
          <Badge variant="green">Lunch ({settings.lunch_duration}m)</Badge>
          <Badge variant="blue">P5 ({settings.post_lunch_duration}m)</Badge>
          <Badge variant="blue">P6 ({settings.post_lunch_duration}m)</Badge>
          <Badge variant="amber">Short Break ({settings.short_break_duration}m)</Badge>
          <Badge variant="blue">P7 ({settings.post_lunch_duration}m)</Badge>
          <Badge variant="blue">P8 ({settings.post_lunch_duration}m)</Badge>
        </div>
        <Alert variant="info" style={{ marginTop: 12 }}>During lab sessions, the short break is not counted as a separate slot — labs run as 4 solid consecutive periods.</Alert>
      </div>
    </div>
  )
}
