import { useContext } from "react"
import { Navigate } from "react-router-dom"
import { AuthContext } from "../context/AuthContext"

function ProtectedRoute({ children }) {
  const { session, loading } = useContext(AuthContext)

  if (loading) {
    return <div className="login-page">Loading...</div>
  }

  if (!session) {
    return <Navigate to="/login" />
  }

  return children
}

export default ProtectedRoute