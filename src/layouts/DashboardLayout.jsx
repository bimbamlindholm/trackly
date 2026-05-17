import { useContext } from "react"
import { NavLink, useNavigate } from "react-router-dom"

import { AuthContext } from "../context/authContextValue"
import { AttendanceContext } from "../context/attendanceContextValue"
import { supabase } from "../services/supabaseClient"

function DashboardLayout({ children }) {
  const navigate = useNavigate()

  const { user, isAdmin, activeOrganization, activeMembership } =
    useContext(AuthContext)
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
        <div className="logo">
          <img src="/trackly-icon.png" alt="" />
          <span>Trackly</span>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-group-label">My DTR</span>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/tracker">Time Tracker</NavLink>
          <NavLink to="/attendance">Attendance</NavLink>
          <NavLink to="/salary">Salary Tracker</NavLink>
          <span className="nav-group-label">Company</span>
          <NavLink to="/company-setup">
            {activeOrganization ? "Workspace" : "Set Up Workspace"}
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
          <div className="mobile-top-brand">
            <img src="/trackly-icon.png" alt="" />
            <span>Trackly</span>
          </div>

          <div className="topbar-user">
            <h3>{displayName}</h3>
            <p>
              {activeOrganization
                ? `${activeOrganization.name} - ${activeMembership?.role || "member"}`
                : user?.email}
            </p>
          </div>

          <button
            className="mobile-logout-button"
            type="button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

        {children}
      </main>
    </div>
  )
}

export default DashboardLayout
