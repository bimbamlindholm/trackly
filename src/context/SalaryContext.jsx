import {
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"

import { AuthContext } from "./authContextValue"
import { SalaryContext } from "./salaryContextValue"
import { supabase } from "../services/supabaseClient"

function SalaryProvider({ children }) {
  const { user } = useContext(AuthContext)

  const [hourlyRate, setHourlyRate] = useState(100)
  const [hoursPerDay, setHoursPerDay] = useState(8)
  const [salaryError, setSalaryError] = useState("")

  const createDefaultSettings = useCallback(async () => {
    if (!user?.email) return

    const { error } = await supabase
      .from("user_salary_settings")
      .insert([
        {
          user_email: user.email,
          hourly_rate: 100,
          hours_per_day: 8,
        },
      ])

    if (error) {
      setSalaryError(error.message)
      return
    }

    setSalaryError("")
  }, [user])

  const fetchSalarySettings = useCallback(async () => {
    if (!user?.email) return

    const { data, error } = await supabase
      .from("user_salary_settings")
      .select("*")
      .eq("user_email", user.email)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        await createDefaultSettings()
        setHourlyRate(100)
        setHoursPerDay(8)
      }

      if (error.code !== "PGRST116") {
        setSalaryError(error.message)
      }

      return
    }

    setHourlyRate(Number(data.hourly_rate) || 0)
    setHoursPerDay(Number(data.hours_per_day) || 0)
    setSalaryError("")
  }, [createDefaultSettings, user])

  const updateSalarySettings = async (
    newHourlyRate,
    newHoursPerDay
  ) => {
    if (!user?.email) return

    const normalizedHourlyRate = Number(newHourlyRate) || 0
    const normalizedHoursPerDay = Number(newHoursPerDay) || 0

    setHourlyRate(normalizedHourlyRate)
    setHoursPerDay(normalizedHoursPerDay)

    const { data, error } = await supabase
      .from("user_salary_settings")
      .update({
        hourly_rate: normalizedHourlyRate,
        hours_per_day: normalizedHoursPerDay,
      })
      .eq("user_email", user.email)
      .select("user_email")

    if (error) {
      setSalaryError(error.message)
      return
    }

    if (data.length === 0) {
      const { error: insertError } = await supabase
        .from("user_salary_settings")
        .insert([
          {
            user_email: user.email,
            hourly_rate: normalizedHourlyRate,
            hours_per_day: normalizedHoursPerDay,
          },
        ])

      if (insertError) {
        setSalaryError(insertError.message)
        return
      }
    }

    setSalaryError("")
  }

  useEffect(() => {
    if (!user?.email) {
      setHourlyRate(100)
      setHoursPerDay(8)
      setSalaryError("")
      return
    }

    fetchSalarySettings()
  }, [fetchSalarySettings, user?.email])

  return (
    <SalaryContext.Provider
      value={{
        hourlyRate,
        hoursPerDay,
        salaryError,
        updateSalarySettings,
      }}
    >
      {children}
    </SalaryContext.Provider>
  )
}

export default SalaryProvider
