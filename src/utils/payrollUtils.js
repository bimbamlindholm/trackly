function sortRecords(records) {
  return [...records].sort((a, b) => a.timestamp - b.timestamp)
}

export function calculateGrossWorkedHours(records) {
  const sortedRecords = sortRecords(records)

  const timeIn = sortedRecords.find(
    (record) => record.type === "Time In"
  )

  const timeOut = [...sortedRecords]
    .reverse()
    .find((record) => record.type === "Time Out")

  if (!timeIn || !timeOut) return 0

  const milliseconds = timeOut.timestamp - timeIn.timestamp

  if (milliseconds <= 0) return 0

  return milliseconds / 1000 / 60 / 60
}

export function calculateBreakHours(records) {
  let totalBreakHours = 0
  const sortedRecords = sortRecords(records)

  for (let i = 0; i < sortedRecords.length; i++) {
    const current = sortedRecords[i]
    const next = sortedRecords[i + 1]

    if (
      current?.type === "Break Out" &&
      next?.type === "Break In"
    ) {
      const milliseconds = next.timestamp - current.timestamp

      if (milliseconds > 0) {
        totalBreakHours += milliseconds / 1000 / 60 / 60
      }
    }
  }

  return totalBreakHours
}

export function calculateWorkedHours(records) {
  const grossHours = calculateGrossWorkedHours(records)
  const breakHours = calculateBreakHours(records)

  const netHours = grossHours - breakHours

  return netHours > 0 ? netHours : 0
}

export function calculateOvertimeHours(records, requiredHoursPerDay) {
  const netWorkedHours = calculateWorkedHours(records)
  const requiredHours = Number(requiredHoursPerDay) || 0

  const overtimeHours = netWorkedHours - requiredHours

  return overtimeHours > 0 ? overtimeHours : 0
}

export function calculateEstimatedSalary(records, hourlyRate) {
  const workedHours = calculateWorkedHours(records)

  return workedHours * Number(hourlyRate)
}