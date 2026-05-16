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

function parseTimeToMinutes(timeValue) {
  if (!timeValue) return null

  const [hourPart, minutePart] = String(timeValue).split(":")
  const hours = Number(hourPart)
  const minutes = Number(minutePart)

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null

  return hours * 60 + minutes
}

function getMinutesSinceMidnight(timestamp) {
  const date = new Date(Number(timestamp))

  return date.getHours() * 60 + date.getMinutes()
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

export function getScheduleMetrics(records, schedule = {}) {
  const sortedRecords = sortRecords(records)
  const firstTimeIn = sortedRecords.find((record) => record.type === "Time In")
  const lastTimeOut = [...sortedRecords]
    .reverse()
    .find((record) => record.type === "Time Out")
  const startMinutes = parseTimeToMinutes(schedule.workStartTime || "09:00")
  const endMinutes = parseTimeToMinutes(schedule.workEndTime || "17:00")
  const graceMinutes = Number(schedule.gracePeriodMinutes) || 0

  if (startMinutes === null || endMinutes === null) {
    return {
      lateMinutes: 0,
      undertimeMinutes: 0,
      scheduledHours: Number(schedule.hoursPerDay) || 0,
    }
  }

  const scheduledMinutes =
    endMinutes >= startMinutes
      ? endMinutes - startMinutes
      : 24 * 60 - startMinutes + endMinutes
  const timeInMinutes = firstTimeIn
    ? getMinutesSinceMidnight(firstTimeIn.timestamp)
    : null
  const timeOutMinutes = lastTimeOut
    ? getMinutesSinceMidnight(lastTimeOut.timestamp)
    : null
  const adjustedEndMinutes =
    endMinutes >= startMinutes ? endMinutes : endMinutes + 24 * 60
  const adjustedOutMinutes =
    timeOutMinutes !== null && timeOutMinutes < startMinutes
      ? timeOutMinutes + 24 * 60
      : timeOutMinutes

  return {
    lateMinutes:
      timeInMinutes !== null
        ? Math.max(timeInMinutes - startMinutes - graceMinutes, 0)
        : 0,
    undertimeMinutes:
      adjustedOutMinutes !== null
        ? Math.max(adjustedEndMinutes - adjustedOutMinutes, 0)
        : 0,
    scheduledHours: scheduledMinutes / 60,
  }
}

export function getCutoffDateRange(monthValue, cutoffMode = "monthly") {
  if (!monthValue) return null

  const [year, month] = monthValue.split("-").map(Number)

  if (!year || !month) return null

  if (cutoffMode === "first-half") {
    return {
      start: `${monthValue}-01`,
      end: `${monthValue}-15`,
    }
  }

  if (cutoffMode === "second-half") {
    const lastDay = new Date(year, month, 0).getDate()

    return {
      start: `${monthValue}-16`,
      end: `${monthValue}-${String(lastDay).padStart(2, "0")}`,
    }
  }

  return {
    start: `${monthValue}-01`,
    end: `${monthValue}-${String(new Date(year, month, 0).getDate()).padStart(
      2,
      "0"
    )}`,
  }
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
  paidBreaks = false,
  schedule = {}
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
      const scheduleMetrics = getScheduleMetrics(sortedDailyRecords, {
        ...schedule,
        hoursPerDay: requiredHours,
      })
      const dayMarker = sortedDailyRecords.find((record) =>
        ["Leave", "Holiday", "Rest Day"].includes(record.type)
      )

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
        lateMinutes: scheduleMetrics.lateMinutes,
        scheduledUndertimeMinutes: scheduleMetrics.undertimeMinutes,
        earnings: payableHours * rate,
        recordCount: sortedDailyRecords.length,
        dayType: dayMarker?.type || "Work Day",
        approvalStatus: firstTimeIn?.approval_status || "pending",
        status: dayMarker?.type || (issues.length === 0 ? "Complete" : "Needs Review"),
        issues,
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date))
}
