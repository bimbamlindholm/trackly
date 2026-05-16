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
  const [workStartTime, setWorkStartTime] = useState("09:00")
  const [workEndTime, setWorkEndTime] = useState("17:00")
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState(10)
  const [cutoffMode, setCutoffMode] = useState("monthly")
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
          work_start_time: "09:00",
          work_end_time: "17:00",
          grace_period_minutes: 10,
          cutoff_mode: "monthly",
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
        setWorkStartTime("09:00")
        setWorkEndTime("17:00")
        setGracePeriodMinutes(10)
        setCutoffMode("monthly")
      }

      if (error.code !== "PGRST116") {
        setSalaryError(error.message)
      }

      return
    }

    setHourlyRate(Number(data.hourly_rate) || 0)
    setHoursPerDay(Number(data.hours_per_day) || 0)
    setPaidBreaks(Boolean(data.paid_breaks))
    setWorkStartTime(data.work_start_time || "09:00")
    setWorkEndTime(data.work_end_time || "17:00")
    setGracePeriodMinutes(Number(data.grace_period_minutes) || 0)
    setCutoffMode(data.cutoff_mode || "monthly")
    setSalaryError("")
  }, [createDefaultSettings, user])

  const updateSalarySettings = async (
    newHourlyRate,
    newHoursPerDay,
    newPaidBreaks = paidBreaks,
    newSchedule = {}
  ) => {
    if (!user?.email) return

    const normalizedHourlyRate = Number(newHourlyRate) || 0
    const normalizedHoursPerDay = Number(newHoursPerDay) || 0
    const normalizedPaidBreaks = Boolean(newPaidBreaks)
    const normalizedStart = newSchedule.workStartTime ?? workStartTime
    const normalizedEnd = newSchedule.workEndTime ?? workEndTime
    const normalizedGrace = Number(
      newSchedule.gracePeriodMinutes ?? gracePeriodMinutes
    ) || 0
    const normalizedCutoff = newSchedule.cutoffMode ?? cutoffMode

    setHourlyRate(normalizedHourlyRate)
    setHoursPerDay(normalizedHoursPerDay)
    setPaidBreaks(normalizedPaidBreaks)
    setWorkStartTime(normalizedStart)
    setWorkEndTime(normalizedEnd)
    setGracePeriodMinutes(normalizedGrace)
    setCutoffMode(normalizedCutoff)

    const { data, error } = await supabase
      .from("user_salary_settings")
      .update({
        hourly_rate: normalizedHourlyRate,
        hours_per_day: normalizedHoursPerDay,
        paid_breaks: normalizedPaidBreaks,
        work_start_time: normalizedStart,
        work_end_time: normalizedEnd,
        grace_period_minutes: normalizedGrace,
        cutoff_mode: normalizedCutoff,
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
            work_start_time: normalizedStart,
            work_end_time: normalizedEnd,
            grace_period_minutes: normalizedGrace,
            cutoff_mode: normalizedCutoff,
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
      setWorkStartTime("09:00")
      setWorkEndTime("17:00")
      setGracePeriodMinutes(10)
      setCutoffMode("monthly")
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
        workStartTime,
        workEndTime,
        gracePeriodMinutes,
        cutoffMode,
        salaryError,
        updateSalarySettings,
      }}
    >
      {children}
    </SalaryContext.Provider>
  )
}

export default SalaryProvider
