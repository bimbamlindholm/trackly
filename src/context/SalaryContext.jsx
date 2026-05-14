import { createContext, useContext, useEffect, useState } from "react"
import { AuthContext } from "./AuthContext"

export const SalaryContext = createContext()

function SalaryProvider({ children }) {
  const { user } = useContext(AuthContext)

  const userKey = user?.id || "guest"

  const [hourlyRate, setHourlyRate] = useState(100)
  const [hoursPerDay, setHoursPerDay] = useState(8)

  useEffect(() => {
    const savedRate = localStorage.getItem(
      `trackly-hourly-rate-${userKey}`
    )

    const savedHours = localStorage.getItem(
      `trackly-hours-per-day-${userKey}`
    )

    setHourlyRate(savedRate ? Number(savedRate) : 100)
    setHoursPerDay(savedHours ? Number(savedHours) : 8)
  }, [userKey])

  useEffect(() => {
    localStorage.setItem(
      `trackly-hourly-rate-${userKey}`,
      hourlyRate
    )
  }, [hourlyRate, userKey])

  useEffect(() => {
    localStorage.setItem(
      `trackly-hours-per-day-${userKey}`,
      hoursPerDay
    )
  }, [hoursPerDay, userKey])

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