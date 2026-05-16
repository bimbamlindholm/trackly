import { Link } from "react-router-dom"

function AuthShell({ children }) {
  return (
    <main className="auth-page page-enter">
      <section className="auth-card">
        <div className="visual-panel">
          <Link className="back-home" to="/">
            Back to Home
          </Link>

          <div className="brand">
            <div className="brand-logo">
              <img src="/ICON-01.png" alt="Trackly logo" />
            </div>

            <div>
              <h2>Trackly</h2>
              <p>Time Record System</p>
            </div>
          </div>

          <div className="loop-area">
            <div className="orbit orbit-one"></div>
            <div className="orbit orbit-two"></div>
            <div className="orbit-dot dot-one"></div>
            <div className="orbit-dot dot-two"></div>

            <div className="center-logo">
              <img src="/ICON-01.png" alt="Trackly logo" />
            </div>
          </div>

          <div className="visual-copy">
            <h1>Simple time tracking for everyone.</h1>
            <p>
              A clean DTR experience for teams, small businesses, and
              individual workers.
            </p>
          </div>
        </div>

        <div className="form-panel">
          {children}

          <div className="auth-legal-links">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/support">Support</Link>
          </div>
        </div>
      </section>
    </main>
  )
}

export default AuthShell
