function sortRecords(records) {
  return [...records]
    .filter((record) => Number(record.timestamp) > 0)
    .sort((a, b) => Number(a.timestamp) - Number(b.timestamp))
}

function groupRecordsByDate(records) {
  return sortRecords(records).reduce((groups, record) => {
    if (!record.date) return groups

    return {
      ...groups,
      [record.date]: [...(groups[record.date] || []), record],
    }
  }, {})
}

function millisecondsToHours(milliseconds) {
  return milliseconds / 1000 / 60 / 60
}

function getWorkedMilliseconds(records) {
  const sortedRecords = sortRecords(records)
  let workedMilliseconds = 0
  let workStartedAt = null

  sortedRecords.forEach((record) => {
    const timestamp = Number(record.timestamp)

    if (record.type === "Time In" && workStartedAt === null) {
      workStartedAt = timestamp
      return
    }

    if (record.type === "Break In" && workStartedAt === null) {
      workStartedAt = timestamp
      return
    }

    if (
      (record.type === "Break Out" || record.type === "Time Out") &&
      workStartedAt !== null &&
      timestamp > workStartedAt
    ) {
      workedMilliseconds += timestamp - workStartedAt
      workStartedAt = null
    }
  })

  return workedMilliseconds
}

export function calculateGrossWorkedHours(records) {
  const sortedRecords = sortRecords(records)
  let grossMilliseconds = 0
  let shiftStartedAt = null

  sortedRecords.forEach((record) => {
    const timestamp = Number(record.timestamp)

    if (record.type === "Time In" && shiftStartedAt === null) {
      shiftStartedAt = timestamp
      return
    }

    if (
      record.type === "Time Out" &&
      shiftStartedAt !== null &&
      timestamp > shiftStartedAt
    ) {
      grossMilliseconds += timestamp - shiftStartedAt
      shiftStartedAt = null
    }
  })

  return millisecondsToHours(grossMilliseconds)
}

export function calculateBreakHours(records) {
  let breakMilliseconds = 0
  const sortedRecords = sortRecords(records)
  let breakStartedAt = null

  sortedRecords.forEach((record) => {
    const timestamp = Number(record.timestamp)

    if (
      record.type === "Break Out" &&
      breakStartedAt === null
    ) {
      breakStartedAt = timestamp
      return
    }

    if (
      (record.type === "Break In" || record.type === "Time Out") &&
      breakStartedAt !== null &&
      timestamp > breakStartedAt
    ) {
      breakMilliseconds += timestamp - breakStartedAt
      breakStartedAt = null
    }
  })

  return millisecondsToHours(breakMilliseconds)
}

export function calculateWorkedHours(records) {
  return millisecondsToHours(getWorkedMilliseconds(records))
}

export function calculatePayableHours(records, paidBreaks = false) {
  return paidBreaks
    ? calculateGrossWorkedHours(records)
    : calculateWorkedHours(records)
}

export function calculateOvertimeHours(
  records,
  requiredHoursPerDay,
  paidBreaks = false
) {
  const requiredHours = Number(requiredHoursPerDay) || 0

  if (requiredHours <= 0) return 0

  const recordsByDate = groupRecordsByDate(records)

  return Object.values(recordsByDate).reduce((total, dailyRecords) => {
    const dailyWorkedHours = calculatePayableHours(dailyRecords, paidBreaks)
    const dailyOvertimeHours = dailyWorkedHours - requiredHours

    return total + (dailyOvertimeHours > 0 ? dailyOvertimeHours : 0)
  }, 0)
}

export function calculateEstimatedSalary(records, hourlyRate, paidBreaks = false) {
  const workedHours = calculatePayableHours(records, paidBreaks)

  return workedHours * (Number(hourlyRate) || 0)
}

export function formatDuration(hours) {
  const safeHours = Math.max(Number(hours) || 0, 0)
  const totalMinutes = Math.round(safeHours * 60)
  const hourValue = Math.floor(totalMinutes / 60)
  const minuteValue = totalMinutes % 60

  return `${hourValue}h ${String(minuteValue).padStart(2, "0")}m`
}

export function getAttendanceStatus(records) {
  const sortedRecords = sortRecords(records)
  const lastRecord = sortedRecords[sortedRecords.length - 1]

  if (!lastRecord) return "Not Working"
  if (lastRecord.type === "Time In") return "Currently Working"
  if (lastRecord.type === "Break Out") return "On Break"
  if (lastRecord.type === "Break In") return "Currently Working"
  if (lastRecord.type === "Time Out") return "Not Working"

  return "Not Working"
}

export function getAllowedAttendanceActions(records) {
  const status = getAttendanceStatus(records)

  return {
    canTimeIn: status === "Not Working",
    canBreakOut: status === "Currently Working",
    canBreakIn: status === "On Break",
    canTimeOut: status === "Currently Working",
  }
}

export function getAttendanceIssues(records) {
  const issues = []
  let state = "outside"

  sortRecords(records).forEach((record) => {
    if (record.type === "Time In") {
      if (state !== "outside") {
        issues.push(`Unexpected Time In on ${record.date} at ${record.time}`)
      }

      state = "working"
      return
    }

    if (record.type === "Break Out") {
      if (state !== "working") {
        issues.push(`Unexpected Break Out on ${record.date} at ${record.time}`)
      }

      state = "break"
      return
    }

    if (record.type === "Break In") {
      if (state !== "break") {
        issues.push(`Unexpected Break In on ${record.date} at ${record.time}`)
      }

      state = "working"
      return
    }

    if (record.type === "Time Out") {
      if (state === "outside") {
        issues.push(`Unexpected Time Out on ${record.date} at ${record.time}`)
      }

      state = "outside"
    }
  })

  if (state === "working") {
    issues.push("Shift is still open. Add Time Out to complete the DTR.")
  }

  if (state === "break") {
    issues.push("Break is still open. Add Break In or Time Out to complete it.")
  }

  return issues
}

export function getDailyAttendanceSummaries(
  records,
  hourlyRate,
  requiredHoursPerDay,
  paidBreaks = false
) {
  const requiredHours = Number(requiredHoursPerDay) || 0
  const rate = Number(hourlyRate) || 0
  const recordsByDate = groupRecordsByDate(records)

  return Object.entries(recordsByDate)
    .map(([date, dailyRecords]) => {
      const sortedDailyRecords = sortRecords(dailyRecords)
      const firstTimeIn = sortedDailyRecords.find(
        (record) => record.type === "Time In"
      )
      const lastTimeOut = [...sortedDailyRecords]
        .reverse()
        .find((record) => record.type === "Time Out")
      const grossHours = calculateGrossWorkedHours(sortedDailyRecords)
      const breakHours = calculateBreakHours(sortedDailyRecords)
      const netHours = calculateWorkedHours(sortedDailyRecords)
      const payableHours = calculatePayableHours(
        sortedDailyRecords,
        paidBreaks
      )
      const overtimeHours =
        requiredHours > 0 ? Math.max(payableHours - requiredHours, 0) : 0
      const undertimeHours =
        requiredHours > 0 ? Math.max(requiredHours - payableHours, 0) : 0
      const issues = getAttendanceIssues(sortedDailyRecords)

      return {
        date,
        firstTimeIn: firstTimeIn?.time || "-",
        lastTimeOut: lastTimeOut?.time || "-",
        grossHours,
        breakHours,
        netHours,
        payableHours,
        overtimeHours,
        undertimeHours,
        earnings: payableHours * rate,
        recordCount: sortedDailyRecords.length,
        status: issues.length === 0 ? "Complete" : "Needs Review",
        issues,
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date))
}
