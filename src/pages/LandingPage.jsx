import { Link } from "react-router-dom"

import InstallAppButton from "../components/InstallAppButton"

function LandingPage() {
  return (
    <main className="landing-page page-enter">
      <nav className="landing-nav">
        <Link className="logo-button" to="/" aria-label="Trackly home">
          <img src="/ICON-01.png" alt="" />
          <span>Trackly</span>
        </Link>

        <div className="nav-actions">
          <Link to="/login">Log In</Link>
          <Link className="nav-primary" to="/start">
            Start Using Trackly
          </Link>
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">Daily Time Record System</p>
          <h1>Track time clearly, work smarter daily.</h1>
          <p className="hero-text">
            Trackly helps employees record attendance, monitor daily hours, and
            review work logs through a clean and reliable DTR experience.
          </p>

          <div className="hero-actions">
            <Link className="hero-primary" to="/start">
              Start Using Trackly
            </Link>
            <Link className="hero-secondary" to="/login">
              Log In
            </Link>
            <InstallAppButton className="hero-secondary install-link" />
          </div>
        </div>

        <div className="hero-preview" aria-label="Trackly dashboard preview">
          <div className="preview-topbar">
            <span></span>
            <span></span>
            <span></span>
          </div>

          <div className="clock-card">
            <p>Today</p>
            <strong>08:00 AM</strong>
            <span>Ready for time in</span>
          </div>

          <div className="quick-actions-grid">
            <div>Time In</div>
            <div>Break</div>
            <div>Time Out</div>
          </div>

          <div className="record-list">
            <div>
              <span>Mon</span>
              <strong>8h 03m</strong>
            </div>
            <div>
              <span>Tue</span>
              <strong>7h 58m</strong>
            </div>
            <div>
              <span>Wed</span>
              <strong>8h 11m</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="features-section">
        <article>
          <span>01</span>
          <h2>Fast Time Logs</h2>
          <p>Employees can record time in, breaks, and time out in seconds.</p>
        </article>

        <article>
          <span>02</span>
          <h2>Daily Summary</h2>
          <p>See total hours, late status, overtime, and incomplete records.</p>
        </article>

        <article>
          <span>03</span>
          <h2>Reports Ready</h2>
          <p>Prepare attendance data for payroll, review, and admin checking.</p>
        </article>
      </section>

      <section className="mission-vision-section">
        <div className="section-heading">
          <p className="eyebrow">Purpose of Trackly</p>
          <h2>Built for accurate and stress-free attendance monitoring.</h2>
        </div>

        <div className="mission-grid">
          <article>
            <span>Mission</span>
            <p>
              To provide a simple and dependable DTR system that helps users
              record attendance accurately and manage daily work hours with
              confidence.
            </p>
          </article>

          <article>
            <span>Vision</span>
            <p>
              To become a practical timekeeping platform for schools, teams, and
              small organizations that need clear attendance records and
              organized reporting.
            </p>
          </article>
        </div>
      </section>
    </main>
  )
}

export default LandingPage
