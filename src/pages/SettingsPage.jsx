import { useContext } from "react"

import DashboardLayout from "../layouts/DashboardLayout"
import InstallAppButton from "../components/InstallAppButton"

import { AuthContext } from "../context/authContextValue"
import { SalaryContext } from "../context/salaryContextValue"
import { AttendanceContext } from "../context/attendanceContextValue"
import { ThemeContext } from "../context/themeContextValue"
import { supabase } from "../services/supabaseClient"

const pesoFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
})

function SettingsPage() {
  const { user, profile, isAdmin } = useContext(AuthContext)
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
          <div className="record-item">
            Role: {profile?.role || "worker"}
          </div>
          {isAdmin && (
            <div className="record-item">
              Admin Access: Company monitoring enabled
            </div>
          )}
          <div className="record-item">User ID: {user?.id}</div>
          <div className="record-item">
            Hourly Rate: {pesoFormatter.format(hourlyRate)}
          </div>
          <div className="record-item">Theme: {theme}</div>

          <div className="record-item">
            App Mode: Installable PWA for supported browsers
          </div>

          <button className="custom-button" onClick={toggleTheme}>
            Switch to {theme === "dark" ? "Light" : "Dark"} Mode
          </button>

          <InstallAppButton />

          <button className="logout-button" onClick={clearRecords}>
            Clear Attendance Records
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default SettingsPage
