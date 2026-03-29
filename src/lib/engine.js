// ============================================================
// TimetableAI — Core Scheduling Engine
// CSP + Backtracking with constraint enforcement
// ============================================================

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const PERIODS = 8
const LAB_BLOCKS = [[0, 1, 2, 3], [4, 5, 6, 7]]

const shuffle = arr => [...arr].sort(() => Math.random() - 0.5)

// Always use teacher_id (e.g. CSE001) as the key — never UUID
// This ensures the grid stored in DB matches what TeacherView reads
const tid = t => t.teacher_id || t.id

function countPlaced(grid, sec, subjCode) {
  return grid[sec].flat().filter(c => c && c.subjectCode === subjCode).length
}

export function generateForDept(deptCode, sections, subjectsByYear, teachers, allowPairs = true) {
  const results = {}
  for (const year of Object.keys(subjectsByYear)) {
    const secs = sections[year] || []
    const subjs = subjectsByYear[year] || []
    if (!secs.length || !subjs.length) continue
    const eligibleTeachers = teachers.filter(t => subjs.some(s => t.subjects.includes(s.code)))
    if (!eligibleTeachers.length) continue
    const arr = []
    for (let att = 0; att < 12 && arr.length < 2; att++) {
      const r = attemptGenerate(secs, subjs, eligibleTeachers, allowPairs)
      if (r) arr.push(r)
    }
    if (arr.length) results[year] = arr
  }
  return results
}

function attemptGenerate(sections, subjects, teachers, allowPairs) {
  const grid = {}
  sections.forEach(s => { grid[s] = DAYS.map(() => Array(PERIODS).fill(null)) })

  // Use teacher_id as key (e.g. CSE001) so it matches DB and TeacherView
  const busy = {}
  teachers.forEach(t => { busy[tid(t)] = DAYS.map(() => Array(PERIODS).fill(null)) })

  // PHASE 1: Place labs
  const labSubjs = subjects.filter(s => s.is_lab)
  for (const sec of sections) {
    for (const lab of shuffle(labSubjs)) {
      const eligT = shuffle(teachers.filter(t => t.subjects.includes(lab.code)))
      if (!eligT.length) continue
      let placed = false
      for (const day of shuffle([0, 1, 2, 3, 4])) {
        if (placed) break
        if (grid[sec][day].some(p => p?.isLab)) continue
        for (const block of shuffle(LAB_BLOCKS)) {
          if (!block.every(p => grid[sec][day][p] === null)) continue
          const t = eligT.find(t => block.every(p => busy[tid(t)][day][p] === null))
          if (!t) continue
          block.forEach(p => {
            grid[sec][day][p] = { subjectCode: lab.code, teacherId: tid(t), isLab: true }
            busy[tid(t)][day][p] = sec
          })
          placed = true
          break
        }
      }
    }
  }

  // PHASE 2: Place theory subjects
  const theorySubjs = subjects.filter(s => !s.is_lab).sort((a, b) => b.weekly_periods - a.weekly_periods)
  for (const sec of sections) {
    const daySubjCount = DAYS.map(() => ({}))
    const dayHasDouble = Array(5).fill(false)
    const slotHist = {}
    theorySubjs.forEach(s => { slotHist[s.code] = Array(PERIODS).fill(0) })

    for (const subj of shuffle(theorySubjs)) {
      const eligT = shuffle(teachers.filter(t => t.subjects.includes(subj.code)))
      if (!eligT.length) continue
      const limit = subj.weekly_periods
      let placed = countPlaced(grid, sec, subj.code)

      // PAIR placement
      if (allowPairs && limit >= 2) {
        for (const day of shuffle([0, 1, 2, 3, 4])) {
          if (placed >= limit) break
          if (limit - placed < 2) break
          if (dayHasDouble[day]) continue
          if ((daySubjCount[day][subj.code] || 0) > 0) continue
          const pairs = shuffle([[0, 1], [2, 3], [4, 5], [6, 7]])
          for (const [p1, p2] of pairs) {
            if (grid[sec][day][p1] || grid[sec][day][p2]) continue
            if (slotHist[subj.code][p1] > 1 || slotHist[subj.code][p2] > 1) continue
            const t = eligT.find(t => {
              if (busy[tid(t)][day][p1] || busy[tid(t)][day][p2]) return false
              if (p1 > 0 && busy[tid(t)][day][p1 - 1] && busy[tid(t)][day][p1 - 1] !== sec) return false
              if (p2 < PERIODS - 1 && busy[tid(t)][day][p2 + 1] && busy[tid(t)][day][p2 + 1] !== sec) return false
              return true
            })
            if (!t) continue
            grid[sec][day][p1] = { subjectCode: subj.code, teacherId: tid(t) }
            grid[sec][day][p2] = { subjectCode: subj.code, teacherId: tid(t) }
            busy[tid(t)][day][p1] = sec
            busy[tid(t)][day][p2] = sec
            slotHist[subj.code][p1]++
            slotHist[subj.code][p2]++
            dayHasDouble[day] = true
            daySubjCount[day][subj.code] = (daySubjCount[day][subj.code] || 0) + 2
            placed += 2
            break
          }
        }
      }

      // SINGLE placements
      for (const day of shuffle([0, 1, 2, 3, 4])) {
        if (placed >= limit) break
        if ((daySubjCount[day][subj.code] || 0) >= 1) continue
        const freePeriods = []
        for (let p = 0; p < PERIODS; p++) { if (!grid[sec][day][p]) freePeriods.push(p) }
        freePeriods.sort((a, b) => slotHist[subj.code][a] - slotHist[subj.code][b])
        for (const p of freePeriods) {
          const t = eligT.find(t => {
            if (busy[tid(t)][day][p]) return false
            if (p > 0 && busy[tid(t)][day][p - 1] && busy[tid(t)][day][p - 1] !== sec) return false
            if (p < PERIODS - 1 && busy[tid(t)][day][p + 1] && busy[tid(t)][day][p + 1] !== sec) return false
            return true
          })
          if (!t) continue
          grid[sec][day][p] = { subjectCode: subj.code, teacherId: tid(t) }
          busy[tid(t)][day][p] = sec
          slotHist[subj.code][p]++
          daySubjCount[day][subj.code] = (daySubjCount[day][subj.code] || 0) + 1
          placed++
          break
        }
      }
    }

    // PHASE 3: Force-fill empty slots
    DAYS.forEach((_, d) => {
      for (let p = 0; p < PERIODS; p++) {
        if (grid[sec][d][p]) continue
        let filled = false

        // Pass 1: under limit + soft constraints
        const underLimit = shuffle(theorySubjs).filter(s => countPlaced(grid, sec, s.code) < s.weekly_periods)
        for (const subj of underLimit) {
          if ((daySubjCount[d][subj.code] || 0) >= 1) continue
          const t = shuffle(teachers.filter(t => t.subjects.includes(subj.code))).find(t => {
            if (busy[tid(t)][d][p]) return false
            if (p > 0 && busy[tid(t)][d][p - 1] && busy[tid(t)][d][p - 1] !== sec) return false
            return true
          })
          if (!t) continue
          grid[sec][d][p] = { subjectCode: subj.code, teacherId: tid(t) }
          busy[tid(t)][d][p] = sec
          daySubjCount[d][subj.code] = (daySubjCount[d][subj.code] || 0) + 1
          filled = true
          break
        }

        // Pass 2: relax weekly limit
        if (!filled) {
          for (const subj of shuffle(theorySubjs)) {
            if ((daySubjCount[d][subj.code] || 0) >= 2) continue
            if ((daySubjCount[d][subj.code] || 0) === 1 && dayHasDouble[d]) continue
            const t = shuffle(teachers.filter(t => t.subjects.includes(subj.code))).find(t => !busy[tid(t)][d][p])
            if (!t) continue
            grid[sec][d][p] = { subjectCode: subj.code, teacherId: tid(t) }
            busy[tid(t)][d][p] = sec
            daySubjCount[d][subj.code] = (daySubjCount[d][subj.code] || 0) + 1
            filled = true
            break
          }
        }

        // Pass 3: absolute fallback
        if (!filled) {
          for (const subj of theorySubjs) {
            const t = teachers.find(t => t.subjects.includes(subj.code) && !busy[tid(t)][d][p])
            if (t) {
              grid[sec][d][p] = { subjectCode: subj.code, teacherId: tid(t) }
              busy[tid(t)][d][p] = sec
              filled = true
              break
            }
          }
        }
      }
    })
  }

  // Validate: zero empty slots
  for (const sec of sections) {
    for (let d = 0; d < 5; d++) {
      for (let p = 0; p < PERIODS; p++) {
        if (!grid[sec][d][p]) return null
      }
    }
  }
  return { grid, sections: [...sections] }
}

// Derive teacher timetable from saved section timetables
// teacherId here is teacher_id (e.g. CSE001) — matches what grid stores
export function deriveTeacherTimetable(teacherId, deptCode, timetablesByYear, sectionsByYear) {
  const tGrid = DAYS.map(() => Array(PERIODS).fill(null))
  Object.entries(timetablesByYear).forEach(([year, tt]) => {
    const secs = sectionsByYear[year] || []
    secs.forEach(sec => {
      const grid = tt.grid?.[sec]
      if (!grid) return
      DAYS.forEach((_, d) => {
        for (let p = 0; p < PERIODS; p++) {
          const cell = grid[d][p]
          if (cell?.teacherId === teacherId) {
            tGrid[d][p] = { ...cell, section: sec, year }
          }
        }
      })
    })
  })
  return tGrid
}

export { DAYS, PERIODS }
