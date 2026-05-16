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
            <h3>For personal use</h3>
            <p>
              Create your own account and track your personal DTR, salary, and
              attendance history.
            </p>
          </Link>

          <Link className="choice-card" to="/company">
            <span>Company</span>
            <h3>For company use</h3>
            <p>
              Create company folders, generate staff invite links, and monitor
              employee DTR records.
            </p>
          </Link>
        </div>
      </section>
    </main>
  )
}

export default StartPage
