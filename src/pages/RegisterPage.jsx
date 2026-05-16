import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"

import AuthShell from "../components/AuthShell"
import EyeIcon from "../components/EyeIcon"
import { supabase } from "../services/supabaseClient"

function RegisterPage() {
  const navigate = useNavigate()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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

    navigate("/login")
  }

  return (
    <AuthShell>
      <form className="form-box register-box" onSubmit={handleRegister}>
        <h1>Create account</h1>
        <p className="subtitle">
          Register your details to start using the DTR system.
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

        <p className="switch">
          Already have an account?
          <Link to="/login">Log In</Link>
        </p>
      </form>
    </AuthShell>
  )
}

export default RegisterPage
