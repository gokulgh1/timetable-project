import { DAYS } from '../lib/engine'

const PERIODS = 8

export default function TimetableGrid({ grid, subjects = [], teachers = [], showTime = false, settings = {} }) {
  if (!grid) return (
    <div style={{ textAlign: 'center', padding: '32px', color: '#4a5568', fontSize: 13 }}>
      No timetable data available.
    </div>
  )

  function periodTime(idx) {
    const pre = settings.pre_lunch_duration || 50
    const post = settings.post_lunch_duration || 45
    const shortBrk = settings.short_break_duration || 10
    const lunch = settings.lunch_duration || 45
    let h = 9, m = 0
    for (let i = 0; i < idx; i++) {
      m += i < 4 ? pre : post
      if (i === 1) m += shortBrk
      if (i === 3) m += lunch
      if (i === 5) m += shortBrk
      h += Math.floor(m / 60); m = m % 60
    }
    const ampm = h < 12 ? 'AM' : 'PM'
    const h12 = h > 12 ? h - 12 : (h === 0 ? 12 : h)
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`
  }

  function renderCell(cell) {
    if (!cell) {
      return (
        <td key="empty" style={{ padding: '4px 3px', border: '1px solid #2a3347', textAlign: 'center', height: 56, minWidth: 82, background: '#450a0a' }}>
          <span style={{ color: '#ef4444', fontSize: 9 }}>EMPTY</span>
        </td>
      )
    }
    const s = subjects.find(x => x.code === cell.subjectCode)
    const t = teachers.find(x => x.teacher_id === cell.teacherId || x.id === cell.teacherId)
    const tName = t ? t.name.split(' ').pop() : '—'
    const cls = cell.isLab ? 'tt-cell-lab' : 'tt-cell-theory'
    return (
      <td style={{ padding: '4px 3px', border: '1px solid #2a3347', textAlign: 'center', height: 56, minWidth: 82 }}>
        <span className={cls}>
          {s ? s.name : cell.subjectCode}{cell.isLab ? ' 🔬' : ''}
          <span className="tt-cell-staff">{tName}</span>
        </span>
      </td>
    )
  }

  const breakColStyle = { padding: '4px 2px', border: '1px solid #2a3347', background: '#252d3d', width: 28, minWidth: 28, textAlign: 'center' }
  const lunchColStyle = { padding: '4px 2px', border: '1px solid #2a3347', background: '#14532d', width: 28, minWidth: 28, textAlign: 'center' }
  const breakText = <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: 8, color: '#4a5568', letterSpacing: 1 }}>BRK</span>
  const lunchText = <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: 8, color: '#4ade80', letterSpacing: 1 }}>LCH</span>

  return (
    <div style={{ overflowX: 'auto', marginTop: 4 }}>
      <table style={{ borderCollapse: 'collapse', fontSize: 11, minWidth: 700, width: '100%' }}>
        <thead>
          <tr>
            <th style={{ background: '#1e2535', padding: '8px 6px', textAlign: 'center', fontWeight: 500, color: '#8892a4', border: '1px solid #2a3347', fontSize: 10, minWidth: 60, width: 60 }}>Day</th>
            {[0, 1].map(p => (
              <th key={p} style={{ background: '#1e2535', padding: '8px 6px', textAlign: 'center', fontWeight: 500, color: '#8892a4', border: '1px solid #2a3347', fontSize: 10 }}>
                P{p + 1}{showTime && <div style={{ fontSize: 8, fontWeight: 400, color: '#4a5568' }}>{periodTime(p)}</div>}
              </th>
            ))}
            <th style={{ ...breakColStyle, background: '#1e2535' }}></th>
            {[2, 3].map(p => (
              <th key={p} style={{ background: '#1e2535', padding: '8px 6px', textAlign: 'center', fontWeight: 500, color: '#8892a4', border: '1px solid #2a3347', fontSize: 10 }}>
                P{p + 1}{showTime && <div style={{ fontSize: 8, fontWeight: 400, color: '#4a5568' }}>{periodTime(p)}</div>}
              </th>
            ))}
            <th style={{ ...lunchColStyle, background: '#14532d' }}></th>
            {[4, 5].map(p => (
              <th key={p} style={{ background: '#1e2535', padding: '8px 6px', textAlign: 'center', fontWeight: 500, color: '#8892a4', border: '1px solid #2a3347', fontSize: 10 }}>
                P{p + 1}{showTime && <div style={{ fontSize: 8, fontWeight: 400, color: '#4a5568' }}>{periodTime(p)}</div>}
              </th>
            ))}
            <th style={{ ...breakColStyle, background: '#1e2535' }}></th>
            {[6, 7].map(p => (
              <th key={p} style={{ background: '#1e2535', padding: '8px 6px', textAlign: 'center', fontWeight: 500, color: '#8892a4', border: '1px solid #2a3347', fontSize: 10 }}>
                P{p + 1}{showTime && <div style={{ fontSize: 8, fontWeight: 400, color: '#4a5568' }}>{periodTime(p)}</div>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day, d) => (
            <tr key={day}>
              <td style={{ background: '#1e2535', padding: '8px 6px', fontWeight: 500, color: '#8892a4', fontSize: 11, border: '1px solid #2a3347', textAlign: 'center', whiteSpace: 'nowrap' }}>
                {day.slice(0, 3)}
              </td>
              {renderCell(grid[d]?.[0])}
              {renderCell(grid[d]?.[1])}
              <td style={breakColStyle}>{breakText}</td>
              {renderCell(grid[d]?.[2])}
              {renderCell(grid[d]?.[3])}
              <td style={lunchColStyle}>{lunchText}</td>
              {renderCell(grid[d]?.[4])}
              {renderCell(grid[d]?.[5])}
              <td style={breakColStyle}>{breakText}</td>
              {renderCell(grid[d]?.[6])}
              {renderCell(grid[d]?.[7])}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
