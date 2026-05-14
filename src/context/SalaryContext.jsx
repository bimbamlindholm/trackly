import { createContext, useEffect, useState } from "react"

export const SalaryContext = createContext()

function SalaryProvider({ children }) {
  const [hourlyRate, setHourlyRate] = useState(() => {
    const savedRate =
      localStorage.getItem("trackly-hourly-rate")

    return savedRate ? Number(savedRate) : 100
  })

  const [hoursPerDay, setHoursPerDay] = useState(() => {
    const savedHours =
      localStorage.getItem("trackly-hours-per-day")

    return savedHours ? Number(savedHours) : 8
  })

  useEffect(() => {
    localStorage.setItem(
      "trackly-hourly-rate",
      hourlyRate
    )
  }, [hourlyRate])

  useEffect(() => {
    localStorage.setItem(
      "trackly-hours-per-day",
      hoursPerDay
    )
  }, [hoursPerDay])

  return (
    <SalaryContext.Provider
      value={{
        hourlyRate,
        setHourlyRate,
        hoursPerDay,
        setHoursPerDay,
      }}
    >
      {children}
    </SalaryContext.Provider>
  )
}

export default SalaryProvider