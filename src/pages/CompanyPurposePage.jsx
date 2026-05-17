import { Link } from "react-router-dom"

function CompanyPurposePage() {
  return (
    <main className="landing-page page-enter">
      <nav className="landing-nav">
        <Link className="logo-button" to="/">
          <img src="/trackly-icon.png" alt="" />
          <span>Trackly</span>
        </Link>
      </nav>

      <section className="choice-section">
        <div className="section-heading">
          <p className="eyebrow">Company Setup</p>
          <h2>Choose your company role</h2>
        </div>

        <div className="choice-grid">
          <Link
            className="choice-card"
            to="/register?type=company-admin&next=/company-setup"
          >
            <span>Admin</span>
            <h3>Set up company workspace</h3>
            <p>
              Create teams or branches, generate staff invite links, review
              attendance, and export payroll-ready reports.
            </p>
          </Link>

          <Link className="choice-card" to="/company/join">
            <span>Staff</span>
            <h3>Join my company team</h3>
            <p>
              Paste the link from your admin to connect your account to the
              correct team or branch.
            </p>
          </Link>
        </div>
      </section>
    </main>
  )
}

export default CompanyPurposePage
