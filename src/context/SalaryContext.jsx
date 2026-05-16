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
  const [paidBreaks, setPaidBreaks] = useState(false)
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
          paid_breaks: false,
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
        setPaidBreaks(false)
      }

      if (error.code !== "PGRST116") {
        setSalaryError(error.message)
      }

      return
    }

    setHourlyRate(Number(data.hourly_rate) || 0)
    setHoursPerDay(Number(data.hours_per_day) || 0)
    setPaidBreaks(Boolean(data.paid_breaks))
    setSalaryError("")
  }, [createDefaultSettings, user])

  const updateSalarySettings = async (
    newHourlyRate,
    newHoursPerDay,
    newPaidBreaks = paidBreaks
  ) => {
    if (!user?.email) return

    const normalizedHourlyRate = Number(newHourlyRate) || 0
    const normalizedHoursPerDay = Number(newHoursPerDay) || 0
    const normalizedPaidBreaks = Boolean(newPaidBreaks)

    setHourlyRate(normalizedHourlyRate)
    setHoursPerDay(normalizedHoursPerDay)
    setPaidBreaks(normalizedPaidBreaks)

    const { data, error } = await supabase
      .from("user_salary_settings")
      .update({
        hourly_rate: normalizedHourlyRate,
        hours_per_day: normalizedHoursPerDay,
        paid_breaks: normalizedPaidBreaks,
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
            paid_breaks: normalizedPaidBreaks,
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
      setPaidBreaks(false)
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
        paidBreaks,
        salaryError,
        updateSalarySettings,
      }}
    >
      {children}
    </SalaryContext.Provider>
  )
}

export default SalaryProvider
