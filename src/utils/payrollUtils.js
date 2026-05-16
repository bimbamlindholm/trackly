function sortRecords(records) {
  return [...records]
    .filter((record) => Number(record.timestamp) > 0)
    .sort((a, b) => Number(a.timestamp) - Number(b.timestamp))
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

export function calculateOvertimeHours(records, requiredHoursPerDay) {
  const requiredHours = Number(requiredHoursPerDay) || 0

  if (requiredHours <= 0) return 0

  const recordsByDate = sortRecords(records).reduce((groups, record) => {
    if (!record.date) return groups

    return {
      ...groups,
      [record.date]: [...(groups[record.date] || []), record],
    }
  }, {})

  return Object.values(recordsByDate).reduce((total, dailyRecords) => {
    const dailyWorkedHours = calculateWorkedHours(dailyRecords)
    const dailyOvertimeHours = dailyWorkedHours - requiredHours

    return total + (dailyOvertimeHours > 0 ? dailyOvertimeHours : 0)
  }, 0)
}

export function calculateEstimatedSalary(records, hourlyRate) {
  const workedHours = calculateWorkedHours(records)

  return workedHours * (Number(hourlyRate) || 0)
}
