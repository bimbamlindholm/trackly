import { useContext, useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { AuthContext } from "../context/authContextValue"
import { supabase } from "../services/supabaseClient"

function extractToken(value) {
  const trimmedValue = value.trim()

  if (!trimmedValue.includes("/company/join/")) return trimmedValue

  return trimmedValue.split("/company/join/")[1]?.split(/[?#]/)[0] || ""
}

function JoinCompanyPage() {
  const navigate = useNavigate()
  const { token: routeToken } = useParams()
  const { user, session, refreshProfile } = useContext(AuthContext)
  const [token, setToken] = useState(routeToken || "")
  const [invite, setInvite] = useState(null)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (routeToken) {
      setToken(routeToken)
    }
  }, [routeToken])

  const loadInvite = async (inviteToken) => {
    const normalizedToken = extractToken(inviteToken)

    if (!normalizedToken) return null

    const { data, error } = await supabase
      .from("organization_invites")
      .select("*, organizations(name)")
      .eq("token", normalizedToken)
      .eq("active", true)
      .single()

    if (error) {
      setMessage("Invite link not found or no longer active.")
      return null
    }

    setInvite(data)
    return data
  }

  const joinCompany = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage("")

    if (!session) {
      const normalizedToken = extractToken(token)

      if (!normalizedToken) {
        setMessage("Paste a valid invite link or code.")
        setLoading(false)
        return
      }

      localStorage.setItem("trackly-pending-invite", normalizedToken)
      navigate(`/register?type=company-staff&next=/company/join/${normalizedToken}`)
      return
    }

    const activeInvite = invite || (await loadInvite(token))

    if (!activeInvite) {
      setLoading(false)
      return
    }

    const { error } = await supabase.from("organization_members").insert([
      {
        organization_id: activeInvite.organization_id,
        user_id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email,
        role: "worker",
        membership_status: "active",
        department: activeInvite.department,
        position: activeInvite.position || "Worker",
      },
    ])

    setLoading(false)

    if (error) {
      if (error.code === "23505") {
        localStorage.removeItem("trackly-pending-invite")
        await refreshProfile()
        navigate("/dashboard")
        return
      }

      setMessage(error.message)
      return
    }

    localStorage.removeItem("trackly-pending-invite")
    await refreshProfile()
    navigate("/dashboard")
  }

  return (
    <main className="landing-page page-enter">
      <nav className="landing-nav">
        <Link className="logo-button" to="/">
          <img src="/ICON-01.png" alt="" />
          <span>Trackly</span>
        </Link>
      </nav>

      <section className="choice-section">
        <form className="tracker-card join-card" onSubmit={joinCompany}>
          <p className="eyebrow">Join Company</p>
          <h2>Enter your staff invite link</h2>
          <p>
            Use the link or code from your admin to connect your DTR records to
            the right company team or branch.
          </p>

          <input
            className="custom-input"
            placeholder="Paste invite link or code"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            required
          />

          {invite && (
            <div className="record-item">
              {invite.organizations?.name} - {invite.department}
            </div>
          )}

          {message && <p className="form-error">{message}</p>}

          <button className="custom-button" type="submit" disabled={loading}>
            {loading ? "Joining..." : session ? "Join Company" : "Continue"}
          </button>
        </form>
      </section>
    </main>
  )
}

export default JoinCompanyPage
