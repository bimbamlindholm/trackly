import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { supabase } from "../services/supabaseClient"

function LoginPage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    navigate("/dashboard")
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Welcome to Trackly</h1>

        <p>
          Track your time, attendance,
          and salary in one simple app.
        </p>

        <form className="login-form" onSubmit={handleLogin}>
          <input
            className="custom-input"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            className="custom-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="custom-button" type="submit">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="auth-link">
          Don&apos;t have an account? <Link to="/register">Create one</Link>
        </p>
        <p className="auth-link">
          <Link to="/forgot-password">Forgot password?</Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage
