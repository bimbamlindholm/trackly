import { useContext, useState } from "react"
import { useNavigate } from "react-router-dom"

import DashboardLayout from "../layouts/DashboardLayout"
import { AuthContext } from "../context/authContextValue"
import { supabase } from "../services/supabaseClient"

function createSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function CompanySetupPage() {
  const navigate = useNavigate()
  const { user, profile, activeOrganization, refreshProfile } =
    useContext(AuthContext)
  const [companyName, setCompanyName] = useState("")
  const [folderName, setFolderName] = useState("General Staff")
  const [department, setDepartment] = useState("Management")
  const [position, setPosition] = useState("Administrator")
  const [inviteLink, setInviteLink] = useState("")
  const [loading, setLoading] = useState(false)

  const createCompany = async (event) => {
    event.preventDefault()

    if (!companyName.trim()) return

    setLoading(true)

    const { data: organization, error: organizationError } = await supabase
      .from("organizations")
      .insert([
        {
          name: companyName.trim(),
          slug: `${createSlug(companyName)}-${Date.now()}`,
          created_by: user.id,
        },
      ])
      .select()
      .single()

    if (organizationError) {
      alert(organizationError.message)
      setLoading(false)
      return
    }

    const { error: memberError } = await supabase
      .from("organization_members")
      .insert([
        {
          organization_id: organization.id,
          user_id: user.id,
          email: user.email,
          full_name:
            profile?.full_name ||
            user.user_metadata?.full_name ||
            user.email,
          role: "admin",
          department,
          position,
        },
      ])

    if (memberError) {
      alert(memberError.message)
      setLoading(false)
      return
    }

    const token = crypto.randomUUID()
    const { error: inviteError } = await supabase
      .from("organization_invites")
      .insert([
        {
          organization_id: organization.id,
          token,
          department: folderName.trim() || "General Staff",
          position: "Staff",
          created_by: user.id,
        },
      ])

    if (inviteError) {
      alert(inviteError.message)
      setLoading(false)
      return
    }

    setInviteLink(`${window.location.origin}/company/join/${token}`)
    await refreshProfile()
    setLoading(false)
  }

  return (
    <DashboardLayout>
      <div className="dashboard-page">
        <div className="dashboard-header">
          <h1>Company Setup</h1>
          <p>Create a company workspace for admin monitoring.</p>
        </div>

        {activeOrganization ? (
          <div className="tracker-card">
            <h2>{activeOrganization.name}</h2>
            <p>Your account is already connected to a company workspace.</p>
            <button
              className="custom-button"
              type="button"
              onClick={() => navigate("/admin")}
            >
              Open Company Admin
            </button>
          </div>
        ) : (
          <form className="tracker-card login-form" onSubmit={createCompany}>
            <h2>Create Company Workspace</h2>
            <p>
              The account creating the workspace becomes the first company
              admin. Each company that installs Trackly can create its own
              workspace.
            </p>

            <input
              className="custom-input"
              placeholder="Company name"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              required
            />

            <input
              className="custom-input"
              placeholder="Your department"
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
            />

            <input
              className="custom-input"
              placeholder="First staff folder, e.g. Aquaflask Sales Staff Harbor Point"
              value={folderName}
              onChange={(event) => setFolderName(event.target.value)}
            />

            <input
              className="custom-input"
              placeholder="Your position"
              value={position}
              onChange={(event) => setPosition(event.target.value)}
            />

            <button className="custom-button" type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Company"}
            </button>

            {inviteLink && (
              <div className="record-item">
                <strong>First invite link generated</strong>
                <p>{inviteLink}</p>

                <button
                  className="custom-button"
                  type="button"
                  onClick={() => navigator.clipboard.writeText(inviteLink)}
                >
                  Copy Invite Link
                </button>

                <button
                  className="custom-button"
                  type="button"
                  onClick={() => navigate("/admin")}
                >
                  Open Company Admin
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </DashboardLayout>
  )
}

export default CompanySetupPage
