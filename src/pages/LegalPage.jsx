import { Link } from "react-router-dom"

const pages = {
  privacy: {
    eyebrow: "Privacy Policy",
    title: "How Trackly handles user data",
    updated: "Last updated: May 17, 2026",
    sections: [
      {
        heading: "Information Trackly uses",
        body: "Trackly stores account details, email address, attendance records, salary settings, company workspace membership, invite links, and optional camera time-mark photo references attached to DTR records.",
      },
      {
        heading: "Google and Facebook login",
        body: "When users sign in with Google or Facebook, Trackly receives basic profile information such as name, email address, and profile identity needed to create or access the account.",
      },
      {
        heading: "Camera time marks",
        body: "If a user captures a time-mark photo, the image includes the user's face, email address, and the captured date and time. Photos are stored in Supabase Storage and loaded through temporary signed links for the user or authorized company admin.",
      },
      {
        heading: "Salary estimates",
        body: "Salary calculations are estimates based on the user's configured hourly rate, required hours per day, break policy, and DTR records. Final payroll decisions remain with the user or company.",
      },
      {
        heading: "Data deletion",
        body: "Users can clear their own attendance records in Settings. For account deletion or company data removal, contact the Trackly administrator or support contact for the deployed app.",
      },
    ],
  },
  terms: {
    eyebrow: "Terms and Conditions",
    title: "Rules for using Trackly",
    updated: "Last updated: May 17, 2026",
    sections: [
      {
        heading: "Purpose",
        body: "Trackly is a DTR and attendance monitoring tool for personal users and company workspaces. Users are responsible for entering accurate time records.",
      },
      {
        heading: "Company workspaces",
        body: "Company admins may invite staff, monitor staff DTR records, archive staff access, and remove staff from the workspace. Staff should only join workspaces where they are authorized.",
      },
      {
        heading: "Attendance and payroll",
        body: "Trackly provides attendance summaries and salary estimates. These are for review and payroll preparation, not a legal guarantee of final wages or employment status.",
      },
      {
        heading: "Acceptable use",
        body: "Users must not falsify time records, misuse invite links, access another user's account, or upload misleading camera time marks.",
      },
      {
        heading: "Availability",
        body: "Trackly depends on browser/device support, internet access, and Supabase services. Temporary downtime or sync delays may happen.",
      },
    ],
  },
  support: {
    eyebrow: "Support",
    title: "Help and data requests",
    updated: "Trackly public support page",
    sections: [
      {
        heading: "Common setup checks",
        body: "If Google or Facebook login fails, confirm the Supabase Site URL and Redirect URLs match the deployed Trackly site. For camera issues, allow camera permission in the browser or Android app settings.",
      },
      {
        heading: "For company admins",
        body: "Create a company workspace, create a team invite link, send the link to staff, then review staff DTR records in Company Admin.",
      },
      {
        heading: "For staff",
        body: "Use the invite link from your company admin, sign in or create an account, then record Time In, Break Out, Break In, and Time Out from the Time Tracker.",
      },
      {
        heading: "Data removal",
        body: "Users can clear attendance records from Settings. Company admins can remove staff from the company workspace without deleting the staff user's personal account.",
      },
    ],
  },
}

function LegalPage({ type }) {
  const page = pages[type] || pages.privacy

  return (
    <main className="landing-page page-enter">
      <nav className="landing-nav">
        <Link className="logo-button" to="/">
          <img src="/ICON-01.png" alt="" />
          <span>Trackly</span>
        </Link>

        <div className="nav-actions">
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link className="nav-primary" to="/start">
            Start Using Trackly
          </Link>
        </div>
      </nav>

      <section className="legal-section">
        <p className="eyebrow">{page.eyebrow}</p>
        <h1>{page.title}</h1>
        <p>{page.updated}</p>

        <div className="legal-list">
          {page.sections.map((section) => (
            <article key={section.heading} className="tracker-card">
              <h2>{section.heading}</h2>
              <p>{section.body}</p>
            </article>
          ))}
        </div>

        <div className="legal-links">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms and Conditions</Link>
          <Link to="/support">Support</Link>
        </div>
      </section>
    </main>
  )
}

export default LegalPage
