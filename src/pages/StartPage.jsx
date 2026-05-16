import { Link } from "react-router-dom"

function StartPage() {
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
          <p className="eyebrow">Start Using Trackly</p>
          <h2>How will you use Trackly?</h2>
        </div>

        <div className="choice-grid">
          <Link className="choice-card" to="/register?type=personal">
            <span>Personal</span>
            <h3>My own DTR</h3>
            <p>
              Track your own time-in, breaks, time-out, salary estimate, and
              attendance history without company admin tools.
            </p>
          </Link>

          <Link className="choice-card" to="/company">
            <span>Company</span>
            <h3>Team DTR system</h3>
            <p>
              Set up a company workspace, create teams, invite staff, and
              monitor DTR records from one admin view.
            </p>
          </Link>
        </div>
      </section>
    </main>
  )
}

export default StartPage
