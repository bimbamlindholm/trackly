import { useContext } from "react"

import DashboardLayout from "../layouts/DashboardLayout"

import { AuthContext } from "../context/AuthContext"
import { SalaryContext } from "../context/SalaryContext"
import { AttendanceContext } from "../context/AttendanceContext"
import { ThemeContext } from "../context/ThemeContext"
import { supabase } from "../services/supabaseClient"

function SettingsPage() {
  const { user } = useContext(AuthContext)
  const { hourlyRate } = useContext(SalaryContext)
  const { setRecords, fetchRecords } = useContext(AttendanceContext)
  const { theme, setTheme } = useContext(ThemeContext)

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email ||
    "User"

  const clearRecords = async () => {
    const confirmClear = confirm(
      "Are you sure you want to delete all your attendance records?"
    )

    if (!confirmClear) return

    const { error } = await supabase
      .from("attendance_records")
      .delete()
      .eq("user_email", user?.email)

    if (error) {
      alert(error.message)
      return
    }

    setRecords([])
    await fetchRecords()

    alert("Attendance records cleared.")
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <DashboardLayout>
      <div className="dashboard-page">
        <div className="dashboard-header">
          <h1>Settings</h1>
          <p>Manage your Trackly profile and preferences.</p>
        </div>

        <div className="tracker-card">
          <h2>Profile</h2>

          <div className="record-item">Name: {displayName}</div>
          <div className="record-item">Email: {user?.email}</div>
          <div className="record-item">User ID: {user?.id}</div>
          <div className="record-item">Hourly Rate: ₱{hourlyRate}</div>
          <div className="record-item">Theme: {theme}</div>

          <button className="custom-button" onClick={toggleTheme}>
            Switch to {theme === "dark" ? "Light" : "Dark"} Mode
          </button>

          <button className="logout-button" onClick={clearRecords}>
            Clear Attendance Records
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default SettingsPage