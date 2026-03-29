import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const PERIOD_LABELS = ['P1', 'P2', 'BRK', 'P3', 'P4', 'LCH', 'P5', 'P6', 'BRK', 'P7', 'P8']

function getCellText(cell, subjects) {
  if (!cell) return ''
  const s = subjects.find(x => x.code === cell.subjectCode)
  return s ? `${s.name}${cell.isLab ? ' (Lab)' : ''}` : cell.subjectCode
}

export function exportToExcel(grid, subjects, deptCode, year, section, collegeName, acadYear) {
  const rows = [
    [`${collegeName} — ${deptCode} ${year} Section ${section} — ${acadYear}`],
    [],
    ['Day', 'P1', 'P2', 'Short Break', 'P3', 'P4', 'Lunch', 'P5', 'P6', 'Short Break', 'P7', 'P8'],
  ]

  DAYS.forEach((day, d) => {
    const row = [day]
    ;[0, 1].forEach(p => row.push(getCellText(grid[d][p], subjects)))
    row.push('Break')
    ;[2, 3].forEach(p => row.push(getCellText(grid[d][p], subjects)))
    row.push('Lunch')
    ;[4, 5].forEach(p => row.push(getCellText(grid[d][p], subjects)))
    row.push('Break')
    ;[6, 7].forEach(p => row.push(getCellText(grid[d][p], subjects)))
    rows.push(row)
  })

  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [{ wch: 12 }, ...Array(11).fill({ wch: 18 })]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, `${deptCode} ${section}`)
  XLSX.writeFile(wb, `Timetable_${deptCode}_${year.replace(' ', '')}_Sec${section}.xlsx`)
}

export function exportToPDF(grid, subjects, teachers, deptCode, year, section, collegeName, acadYear, semester) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(`${collegeName}`, 148, 15, { align: 'center' })
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(`Department: ${deptCode} | ${year} | Section: ${section} | ${semester} | ${acadYear}`, 148, 22, { align: 'center' })

  const head = [['Day', 'P1', 'P2', 'Break', 'P3', 'P4', 'Lunch', 'P5', 'P6', 'Break', 'P7', 'P8']]
  const body = DAYS.map((day, d) => {
    const row = [day]
    ;[0, 1].forEach(p => row.push(getCellText(grid[d][p], subjects)))
    row.push('—')
    ;[2, 3].forEach(p => row.push(getCellText(grid[d][p], subjects)))
    row.push('—')
    ;[4, 5].forEach(p => row.push(getCellText(grid[d][p], subjects)))
    row.push('—')
    ;[6, 7].forEach(p => row.push(getCellText(grid[d][p], subjects)))
    return row
  })

  autoTable(doc, {
    startY: 28,
    head,
    body,
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 95], textColor: [126, 179, 248], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [30, 27, 39] },
      3: { fillColor: [37, 45, 61], textColor: [74, 85, 104] },
      6: { fillColor: [20, 83, 45], textColor: [34, 197, 94] },
      9: { fillColor: [37, 45, 61], textColor: [74, 85, 104] },
    },
    didParseCell: (data) => {
      const cell = data.row.index >= 0 ? grid[data.row.index]?.[
        [0, 1, null, 2, 3, null, 4, 5, null, 6, 7][data.column.index - 1]
      ] : null
      if (cell?.isLab) {
        data.cell.styles.fillColor = [69, 26, 3]
        data.cell.styles.textColor = [251, 191, 36]
      }
    }
  })

  doc.save(`Timetable_${deptCode}_${year.replace(' ', '')}_Sec${section}.pdf`)
}

export function exportTeacherToPDF(tGrid, teacher, subjects, collegeName, acadYear, semester) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(`${collegeName} — Teacher Timetable`, 148, 15, { align: 'center' })
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(`${teacher.name} (${teacher.teacher_id}) | ${teacher.dept_code} | ${semester} | ${acadYear}`, 148, 22, { align: 'center' })

  const head = [['Day', 'P1', 'P2', 'Break', 'P3', 'P4', 'Lunch', 'P5', 'P6', 'Break', 'P7', 'P8']]
  const body = DAYS.map((day, d) => {
    const row = [day]
    ;[0, 1].forEach(p => {
      const cell = tGrid[d][p]
      row.push(cell ? `${getCellText(cell, subjects)}\n${cell.year} ${cell.section}` : 'Free')
    })
    row.push('—')
    ;[2, 3].forEach(p => {
      const cell = tGrid[d][p]
      row.push(cell ? `${getCellText(cell, subjects)}\n${cell.year} ${cell.section}` : 'Free')
    })
    row.push('—')
    ;[4, 5].forEach(p => {
      const cell = tGrid[d][p]
      row.push(cell ? `${getCellText(cell, subjects)}\n${cell.year} ${cell.section}` : 'Free')
    })
    row.push('—')
    ;[6, 7].forEach(p => {
      const cell = tGrid[d][p]
      row.push(cell ? `${getCellText(cell, subjects)}\n${cell.year} ${cell.section}` : 'Free')
    })
    return row
  })

  autoTable(doc, {
    startY: 28,
    head,
    body,
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 95], textColor: [126, 179, 248], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [30, 27, 39] },
      3: { fillColor: [37, 45, 61], textColor: [74, 85, 104] },
      6: { fillColor: [20, 83, 45], textColor: [34, 197, 94] },
      9: { fillColor: [37, 45, 61], textColor: [74, 85, 104] },
    },
  })

  doc.save(`TeacherTT_${teacher.teacher_id}_${teacher.name.replace(/\s+/g, '_')}.pdf`)
}
