import { useContext, useEffect, useMemo, useState } from "react"

import DashboardLayout from "../layouts/DashboardLayout"
import { AuthContext } from "../context/authContextValue"
import { supabase } from "../services/supabaseClient"
import {
  formatDuration,
  getDailyAttendanceSummaries,
} from "../utils/payrollUtils"

const pesoFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
})

function CompanyAdminPage() {
  const { profile, activeOrganization, activeMembership } =
    useContext(AuthContext)
  const [records, setRecords] = useState([])
  const [profiles, setProfiles] = useState([])
  const [salarySettings, setSalarySettings] = useState([])
  const [members, setMembers] = useState([])
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteName, setInviteName] = useState("")
  const [inviteDepartment, setInviteDepartment] = useState("")
  const [invitePosition, setInvitePosition] = useState("")
  const [selectedMonth, setSelectedMonth] = useState("")
  const [selectedWorker, setSelectedWorker] = useState("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!activeOrganization?.id) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError("")

      const membersResponse = await supabase
        .from("organization_members")
        .select("*")
        .eq("organization_id", activeOrganization.id)
        .order("full_name", { ascending: true })

      if (membersResponse.error) {
        setError(membersResponse.error.message)
        setLoading(false)
        return
      }

      const companyMembers = membersResponse.data || []
      const memberEmails = companyMembers.map((member) => member.email)

      if (memberEmails.length === 0) {
        setMembers([])
        setRecords([])
        setProfiles([])
        setSalarySettings([])
        setLoading(false)
        return
      }

      const [attendanceResponse, profilesResponse, salaryResponse] =
        await Promise.all([
          supabase
            .from("attendance_records")
            .select("*")
            .in("user_email", memberEmails)
            .order("timestamp", { ascending: true }),
          supabase
            .from("user_profiles")
            .select("id,email,full_name,role,department,position")
            .in("email", memberEmails)
            .order("full_name", { ascending: true }),
          supabase
            .from("user_salary_settings")
            .select("*")
            .in("user_email", memberEmails),
        ])

      if (attendanceResponse.error) {
        setError(attendanceResponse.error.message)
        setLoading(false)
        return
      }

      setMembers(companyMembers)
      setRecords(attendanceResponse.data || [])
      setProfiles(profilesResponse.data || [])
      setSalarySettings(salaryResponse.data || [])
      setLoading(false)
    }

    fetchCompanyData()
  }, [activeOrganization])

  const addWorker = async (event) => {
    event.preventDefault()

    if (!activeOrganization?.id || !inviteEmail.trim()) return

    const normalizedEmail = inviteEmail.trim().toLowerCase()

    const { error: memberError } = await supabase
      .from("organization_members")
      .insert([
        {
          organization_id: activeOrganization.id,
          email: normalizedEmail,
          full_name: inviteName.trim() || normalizedEmail,
          role: "worker",
          department: inviteDepartment.trim() || "Unassigned",
          position: invitePosition.trim() || "Worker",
        },
      ])

    if (memberError) {
      alert(memberError.message)
      return
    }

    setMembers([
      ...members,
      {
        organization_id: activeOrganization.id,
        email: normalizedEmail,
        full_name: inviteName.trim() || normalizedEmail,
        role: "worker",
        department: inviteDepartment.trim() || "Unassigned",
        position: invitePosition.trim() || "Worker",
      },
    ])
    setInviteEmail("")
    setInviteName("")
    setInviteDepartment("")
    setInvitePosition("")
  }

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const matchesMonth = selectedMonth
        ? record.date?.startsWith(selectedMonth)
        : true
      const matchesWorker =
        selectedWorker === "all" ? true : record.user_email === selectedWorker

      return matchesMonth && matchesWorker
    })
  }, [records, selectedMonth, selectedWorker])

  const salaryByEmail = useMemo(() => {
    return salarySettings.reduce((settings, item) => {
      return {
        ...settings,
        [item.user_email]: Number(item.hourly_rate) || 0,
      }
    }, {})
  }, [salarySettings])

  const workers = useMemo(() => {
    const memberEmails = members.map((item) => item.email).filter(Boolean)
    const profileEmails = profiles.map((item) => item.email).filter(Boolean)
    const recordEmails = records
      .map((record) => record.user_email)
      .filter(Boolean)
    const emails = [
      ...new Set([...memberEmails, ...profileEmails, ...recordEmails]),
    ]

    return emails
      .map((email) => {
        const workerProfile = profiles.find((item) => item.email === email)
        const workerMember = members.find((item) => item.email === email)
        const workerRecords = filteredRecords.filter(
          (record) => record.user_email === email
        )
        const hourlyRate = salaryByEmail[email] || 0
        const dailySummaries = getDailyAttendanceSummaries(
          workerRecords,
          hourlyRate,
          8
        )
        const totals = dailySummaries.reduce(
          (summary, day) => ({
            netHours: summary.netHours + day.netHours,
            overtimeHours: summary.overtimeHours + day.overtimeHours,
            earnings: summary.earnings + day.earnings,
            reviewDays:
              summary.reviewDays + (day.status === "Needs Review" ? 1 : 0),
          }),
          {
            netHours: 0,
            overtimeHours: 0,
            earnings: 0,
            reviewDays: 0,
          }
        )

        return {
          email,
          name: workerMember?.full_name || workerProfile?.full_name || email,
          role: workerMember?.role || workerProfile?.role || "worker",
          department:
            workerMember?.department ||
            workerProfile?.department ||
            "Unassigned",
          position:
            workerMember?.position ||
            workerProfile?.position ||
            "Worker",
          hourlyRate,
          recordCount: workerRecords.length,
          dayCount: dailySummaries.length,
          dailySummaries,
          totals,
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [filteredRecords, members, profiles, records, salaryByEmail])

  const companyTotals = workers.reduce(
    (summary, worker) => ({
      workers: summary.workers + 1,
      records: summary.records + worker.recordCount,
      netHours: summary.netHours + worker.totals.netHours,
      overtimeHours: summary.overtimeHours + worker.totals.overtimeHours,
      earnings: summary.earnings + worker.totals.earnings,
      reviewDays: summary.reviewDays + worker.totals.reviewDays,
    }),
    {
      workers: 0,
      records: 0,
      netHours: 0,
      overtimeHours: 0,
      earnings: 0,
      reviewDays: 0,
    }
  )

  return (
    <DashboardLayout>
      <div className="dashboard-page">
        <div className="dashboard-header">
          <h1>Company Admin</h1>
          <p>
            Monitor worker DTR, payroll hours, review days, and attendance
            reports.
          </p>
        </div>

        {activeOrganization ? (
          <div className="admin-badge">
            {activeOrganization.name} - {activeMembership?.role || "member"} -{" "}
            {profile?.full_name || profile?.email || "Admin"}
          </div>
        ) : (
          <div className="review-box">
            <strong>No company workspace yet</strong>
            <p>Create a company workspace first to monitor workers.</p>
          </div>
        )}

        {error && (
          <div className="review-box">
            <strong>Admin data is blocked by Supabase policies</strong>
            <p>{error}</p>
            <p>
              Run the SQL setup file in `supabase/company-admin-setup.sql`,
              then create a company workspace from Trackly.
            </p>
          </div>
        )}

        <div className="dashboard-cards">
          <div className="dashboard-card">
            <h2>Workers</h2>
            <p>{companyTotals.workers}</p>
          </div>

          <div className="dashboard-card">
            <h2>Total Records</h2>
            <p>{companyTotals.records}</p>
          </div>

          <div className="dashboard-card">
            <h2>Net Hours</h2>
            <p>{formatDuration(companyTotals.netHours)}</p>
          </div>

          <div className="dashboard-card">
            <h2>Overtime</h2>
            <p>{formatDuration(companyTotals.overtimeHours)}</p>
          </div>

          <div className="dashboard-card">
            <h2>Payroll Estimate</h2>
            <p>{pesoFormatter.format(companyTotals.earnings)}</p>
          </div>

          <div className="dashboard-card">
            <h2>Needs Review</h2>
            <p>{companyTotals.reviewDays}</p>
          </div>
        </div>

        <div className="tracker-card">
          <h2>Company Filters</h2>

          <div className="admin-filter-grid">
            <input
              type="month"
              className="custom-input"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
            />

            <select
              className="custom-input"
              value={selectedWorker}
              onChange={(event) => setSelectedWorker(event.target.value)}
            >
              <option value="all">All workers</option>
              {workers.map((worker) => (
                <option key={worker.email} value={worker.email}>
                  {worker.name}
                </option>
              ))}
            </select>

            <button
              className="custom-button"
              type="button"
              onClick={() => {
                setSelectedMonth("")
                setSelectedWorker("all")
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>

        <form className="tracker-card login-form" onSubmit={addWorker}>
          <h2>Add Worker to Company</h2>
          <p>
            Add the worker email they use to register/login to Trackly. Their
            DTR will appear here once they create records.
          </p>

          <input
            className="custom-input"
            type="email"
            placeholder="Worker email"
            value={inviteEmail}
            onChange={(event) => setInviteEmail(event.target.value)}
            required
          />

          <input
            className="custom-input"
            placeholder="Worker name"
            value={inviteName}
            onChange={(event) => setInviteName(event.target.value)}
          />

          <input
            className="custom-input"
            placeholder="Department"
            value={inviteDepartment}
            onChange={(event) => setInviteDepartment(event.target.value)}
          />

          <input
            className="custom-input"
            placeholder="Position"
            value={invitePosition}
            onChange={(event) => setInvitePosition(event.target.value)}
          />

          <button className="custom-button" type="submit">
            Add Worker
          </button>
        </form>

        <div className="tracker-card">
          <h2>Worker Monitoring</h2>

          {loading ? (
            <p>Loading company DTR data...</p>
          ) : workers.length === 0 ? (
            <p>No workers found yet.</p>
          ) : (
            <div className="worker-grid">
              {workers.map((worker) => (
                <article className="worker-card" key={worker.email}>
                  <div className="worker-card-header">
                    <div>
                      <h3>{worker.name}</h3>
                      <p>{worker.email}</p>
                    </div>

                    <span
                      className={
                        worker.role === "admin"
                          ? "status-complete"
                          : "status-pill"
                      }
                    >
                      {worker.role}
                    </span>
                  </div>

                  <div className="worker-meta">
                    <span>{worker.department}</span>
                    <span>{worker.position}</span>
                    <span>{pesoFormatter.format(worker.hourlyRate)} / hr</span>
                  </div>

                  <div className="worker-stats">
                    <div>
                      <strong>{worker.dayCount}</strong>
                      <span>DTR Days</span>
                    </div>
                    <div>
                      <strong>{formatDuration(worker.totals.netHours)}</strong>
                      <span>Net</span>
                    </div>
                    <div>
                      <strong>{formatDuration(worker.totals.overtimeHours)}</strong>
                      <span>OT</span>
                    </div>
                    <div>
                      <strong>{pesoFormatter.format(worker.totals.earnings)}</strong>
                      <span>Pay</span>
                    </div>
                  </div>

                  {worker.totals.reviewDays > 0 && (
                    <div className="review-box compact-review">
                      <strong>{worker.totals.reviewDays} day(s) need review</strong>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default CompanyAdminPage
