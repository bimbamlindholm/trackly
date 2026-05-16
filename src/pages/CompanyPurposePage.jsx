import { Link } from "react-router-dom"

function CompanyPurposePage() {
  return (
    <main className="landing-page page-enter">
      <nav className="landing-nav">
        <Link className="logo-button" to="/">
          <img src="/ICON-01.png" alt="" />
          <span>Trackly</span>
        </Link>
      </nav>

      <section className="choice-section">
        <div className="section-heading">
          <p className="eyebrow">Company Setup</p>
          <h2>Are you the admin or a staff member?</h2>
        </div>

        <div className="choice-grid">
          <Link
            className="choice-card"
            to="/register?type=company-admin&next=/company-setup"
          >
            <span>Admin</span>
            <h3>I will manage the company</h3>
            <p>
              Create a company workspace, create staff folders, and generate
              invite links for your team.
            </p>
          </Link>

          <Link className="choice-card" to="/company/join">
            <span>Staff</span>
            <h3>I have an invite link</h3>
            <p>
              Paste the link from your admin to connect your account to the
              correct staff folder.
            </p>
          </Link>
        </div>
      </section>
    </main>
  )
}

export default CompanyPurposePage
