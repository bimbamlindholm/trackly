import { useState } from "react"
import { useNavigate, Link, useSearchParams } from "react-router-dom"

import AuthShell from "../components/AuthShell"
import EyeIcon from "../components/EyeIcon"
import { supabase } from "../services/supabaseClient"

function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const nextPath = searchParams.get("next") || "/login"
  const accountType = searchParams.get("type")

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleOAuthRegister = async (provider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}${nextPath}`,
      },
    })

    if (error) {
      alert(error.message)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    })

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    alert("Registration successful!")

    navigate(nextPath)
  }

  return (
    <AuthShell>
      <form className="form-box register-box" onSubmit={handleRegister}>
        <h1>
          {accountType === "company-admin"
            ? "Create admin account"
            : "Create account"}
        </h1>
        <p className="subtitle">
          {accountType === "company-admin"
            ? "Create your admin account before setting up your company."
            : "Register your details to start using the DTR system."}
        </p>

        <label>
          Full name
          <input
            type="text"
            placeholder="Enter your full name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>

        <label>
          Email address
          <input
            type="email"
            placeholder="Enter your email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          Password
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Create password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              className="password-toggle"
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <EyeIcon hidden={!showPassword} />
            </button>
          </div>
        </label>

        <button className="main-button" type="submit" disabled={loading}>
          {loading ? "Creating Account..." : "Create Account"}
        </button>

        <div className="auth-divider">
          <span>or create with</span>
        </div>

        <div className="oauth-grid">
          <button type="button" onClick={() => handleOAuthRegister("google")}>
            Google
          </button>
          <button type="button" onClick={() => handleOAuthRegister("facebook")}>
            Facebook
          </button>
        </div>

        <p className="switch">
          Already have an account?
          <Link to={`/login?next=${encodeURIComponent(nextPath)}`}>
            Log In
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}

export default RegisterPage
