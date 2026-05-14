import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "../services/supabaseClient"
import { AuthContext } from "./AuthContext"

export const AttendanceContext = createContext()

function AttendanceProvider({ children }) {
  const { user, loading } = useContext(AuthContext)
  const [records, setRecords] = useState([])

  const fetchRecords = async () => {
    if (!user?.email) return

    const { data, error } = await supabase
      .from("attendance_records")
      .select("*")
      .eq("user_email", user.email)
      .order("timestamp", { ascending: true })

    if (error) {
      console.error("Failed to fetch records:", error)
      return
    }

    setRecords(data || [])
  }

  useEffect(() => {
    if (!loading && user?.email) {
      fetchRecords()
    }

    if (!loading && !user) {
      setRecords([])
    }
  }, [loading, user])

  return (
    <AttendanceContext.Provider
      value={{ records, setRecords, fetchRecords }}
    >
      {children}
    </AttendanceContext.Provider>
  )
}

export default AttendanceProvider