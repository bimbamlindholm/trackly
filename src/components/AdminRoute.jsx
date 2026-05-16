import { useContext } from "react"
import { Navigate } from "react-router-dom"

import { AuthContext } from "../context/authContextValue"

function AdminRoute({ children }) {
  const { loading, session, isAdmin } = useContext(AuthContext)

  if (loading) {
    return <div className="auth-page">Loading...</div>
  }

  if (!session) {
    return <Navigate to="/login" />
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" />
  }

  return children
}

export default AdminRoute
