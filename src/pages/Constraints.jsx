import { ConstraintItem } from '../components/UI'

const HARD = [
  ['Fixed working days', 'Monday to Friday, 5 days per week'],
  ['Fixed 8 periods/day', 'Every day has exactly 8 teaching periods'],
  ['Period layout', 'P1,P2 → Short Break → P3,P4 → Lunch → P5,P6 → Short Break → P7,P8'],
  ['Zero free periods', 'All 8 periods filled every day for every section — enforced with 3-pass algorithm'],
  ['Strict weekly limit', 'Each subject appears exactly its configured weekly_periods count — never more'],
  ['One double per day max', 'Only ONE subject may appear as a back-to-back pair per day per section'],
  ['No teacher clashes', 'A teacher cannot be in two sections at the same time — checked across ALL sections and ALL years simultaneously'],
  ['Assigned subjects only', 'Teachers can only teach their assigned subjects'],
  ['One subject per period', 'Each period has exactly one subject per section'],
  ['Labs: 4 consecutive', 'Lab subjects always occupy P1–P4 or P5–P8 as a solid 4-period block'],
  ['No lab split', 'Labs never split across break or lunch'],
  ['One lab session per week', 'Each lab subject has exactly one 4-period session per week'],
  ['One lab per day per section', 'A section cannot have more than one lab subject on the same day'],
  ['Simultaneous generation', 'All sections of all years generated together — global clash checking'],
  ['Year-wise structure', 'Each year (I–IV) has its own subjects, sections and timetable'],
  ['New dept flexibility', 'A department can exist for some years only — e.g. a new dept with only I Year students'],
]

const SOFT = [
  ['Subject period rotation', 'A subject must not appear in the same period slot every day — least-used slots are preferred'],
  ['No teacher zig-zag', 'Teachers avoid teaching different sections in adjacent periods'],
  ['Natural distribution', 'Timetable looks organically varied — subjects spread across all days and periods'],
  ['Back-to-back toggle', 'Admin can enable/disable consecutive same-subject pairs via a checkbox in Generate'],
]

export default function Constraints() {
  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 600, color: '#e8eaf0', marginBottom: 4 }}>Active Constraints</div>
      <div style={{ fontSize: 13, color: '#8892a4', marginBottom: 16 }}>All scheduling rules enforced by the CSP backtracking engine</div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Hard Constraints</div>
            <div style={{ fontSize: 12, color: '#8892a4', marginTop: 2 }}>Never violated — timetable is invalid if any fail</div>
          </div>
          <span className="badge badge-red">{HARD.length} rules</span>
        </div>
        {HARD.map(([title, desc]) => (
          <ConstraintItem key={title} icon="✓" iconClass="badge-green" title={title} desc={desc} />
        ))}
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Soft Constraints</div>
            <div style={{ fontSize: 12, color: '#8892a4', marginTop: 2 }}>Strongly preferred — optimized during generation</div>
          </div>
          <span className="badge badge-amber">{SOFT.length} rules</span>
        </div>
        {SOFT.map(([title, desc]) => (
          <ConstraintItem key={title} icon="~" iconClass="badge-amber" title={title} desc={desc} />
        ))}
      </div>
    </div>
  )
}
