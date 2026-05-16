import { useContext } from "react"
import { NavLink, useNavigate } from "react-router-dom"

import { AuthContext } from "../context/authContextValue"
import { AttendanceContext } from "../context/attendanceContextValue"
import { supabase } from "../services/supabaseClient"

function DashboardLayout({ children }) {
  const navigate = useNavigate()

  const { user, isAdmin, activeOrganization } = useContext(AuthContext)
  const { setRecords } = useContext(AttendanceContext)

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email ||
    "User"

  const handleLogout = async () => {
    setRecords([])

    const { error } = await supabase.auth.signOut()

    if (error) {
      alert(error.message)
      return
    }

    navigate("/login")
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h2 className="logo">Trackly</h2>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/tracker">Time Tracker</NavLink>
          <NavLink to="/attendance">Attendance</NavLink>
          <NavLink to="/salary">Salary Tracker</NavLink>
          <NavLink to="/company-setup">
            {activeOrganization ? "Company" : "Create Company"}
          </NavLink>
          {isAdmin && <NavLink to="/admin">Company Admin</NavLink>}
          <NavLink to="/settings">Settings</NavLink>
        </nav>

        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="main-content">
        <div className="topbar">
          <div>
            <h3>{displayName}</h3>
            <p>{user?.email}</p>
          </div>
        </div>

        {children}
      </main>
    </div>
  )
}

export default DashboardLayout
