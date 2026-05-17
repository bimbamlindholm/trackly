import { useState } from "react"
import { Link } from "react-router-dom"

import AuthShell from "../components/AuthShell"
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
    <AuthShell>
      <form className="form-box login-box" onSubmit={handleResetPassword}>
        <div className="top-form-logo">
          <img src="/trackly-icon.png" alt="Trackly logo" />
        </div>

        <h1>Reset Password</h1>

        <p className="subtitle">
          Enter your email and Trackly will send a reset link.
        </p>

        <label>
          Email address
          <input
            type="email"
            placeholder="Enter your email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <button className="main-button" type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        {message && <p className="form-message">{message}</p>}

        <p className="switch">
          Remembered your password? <Link to="/login">Log In</Link>
        </p>
      </form>
    </AuthShell>
  )
}

export default ForgotPasswordPage
