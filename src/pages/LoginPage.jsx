import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"

import AuthShell from "../components/AuthShell"
import EyeIcon from "../components/EyeIcon"
import { supabase } from "../services/supabaseClient"

function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const nextPath = searchParams.get("next") || "/dashboard"
  const safeNextPath = nextPath.startsWith("/") ? nextPath : "/dashboard"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleOAuthLogin = async (provider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}${safeNextPath}`,
      },
    })

    if (error) {
      alert(error.message)
    }
  }

  const handleLogin = async (event) => {
    event.preventDefault()
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

    navigate(safeNextPath)
  }

  return (
    <AuthShell>
      <form className="form-box login-box" onSubmit={handleLogin}>
        <div className="top-form-logo">
          <img src="/trackly-icon.png" alt="Trackly logo" />
        </div>

        <h1>Welcome back</h1>
        <p className="subtitle">
          Log in with your email and password to continue.
        </p>

        <label>
          Email address
          <input
            id="login-email"
            name="email"
            type="email"
            placeholder="Enter your email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label>
          Password
          <div className="password-wrapper">
            <input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
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

        <div className="form-options">
          <label className="checkbox-label" htmlFor="login-remember">
            <input id="login-remember" name="remember" type="checkbox" />
            Remember me
          </label>

          <Link className="text-button" to="/forgot-password">
            Forgot password?
          </Link>
        </div>

        <button className="main-button" type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Log In"}
        </button>

        <div className="auth-divider">
          <span>or continue with</span>
        </div>

        <div className="oauth-grid">
          <button type="button" onClick={() => handleOAuthLogin("google")}>
            Google
          </button>
          <button type="button" onClick={() => handleOAuthLogin("facebook")}>
            Facebook
          </button>
        </div>

        <p className="switch">
          Don&apos;t have an account?
          <Link to={`/register?next=${encodeURIComponent(safeNextPath)}`}>
            Register
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}

export default LoginPage
