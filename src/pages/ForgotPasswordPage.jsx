import { useState } from "react"
import { Link } from "react-router-dom"

import { supabase } from "../services/supabaseClient"

function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleResetPassword = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage("")

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })

    setLoading(false)

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage("Password reset email sent. Please check your inbox.")
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Reset Password</h1>

        <p>Enter your email and Trackly will send a reset link.</p>

        <form className="login-form" onSubmit={handleResetPassword}>
          <input
            className="custom-input"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <button className="custom-button" type="submit">
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {message && <p className="form-message">{message}</p>}

        <p className="auth-link">
          Remembered your password? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
