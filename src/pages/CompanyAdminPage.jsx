import { useContext, useEffect, useState } from "react"

import DashboardLayout from "../layouts/DashboardLayout"
import TimeMarkImage from "../components/TimeMarkImage"
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
  const [correctionRequests, setCorrectionRequests] = useState([])
  const [members, setMembers] = useState([])
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteName, setInviteName] = useState("")
  const [inviteDepartment, setInviteDepartment] = useState("")
  const [invitePosition, setInvitePosition] = useState("")
  const [folderName, setFolderName] = useState("")
  const [folderInviteLink, setFolderInviteLink] = useState("")
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

      const [attendanceResponse, profilesResponse, salaryResponse, requestResponse] =
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
          supabase
            .from("attendance_correction_requests")
            .select("*")
            .in("requested_by_email", memberEmails)
            .order("created_at", { ascending: false }),
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
      setCorrectionRequests(requestResponse.data || [])
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
          membership_status: "active",
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
        membership_status: "active",
        department: inviteDepartment.trim() || "Unassigned",
        position: invitePosition.trim() || "Worker",
      },
    ])
    setInviteEmail("")
    setInviteName("")
    setInviteDepartment("")
    setInvitePosition("")
  }

  const createFolderInvite = async (event) => {
    event.preventDefault()

    if (!activeOrganization?.id || !folderName.trim()) return

    const token = crypto.randomUUID()
    const { error: inviteError } = await supabase
      .from("organization_invites")
      .insert([
        {
          organization_id: activeOrganization.id,
          token,
          department: folderName.trim(),
          position: "Staff",
          created_by: activeMembership?.user_id || null,
        },
      ])

    if (inviteError) {
      alert(inviteError.message)
      return
    }

    setFolderInviteLink(`${window.location.origin}/company/join/${token}`)
  }

  const updateWorkerStatus = async (worker, membershipStatus) => {
    const workerMember = members.find((item) => item.email === worker.email)

    if (!workerMember?.id) {
      alert("This worker does not have a company membership record yet.")
      return
    }

    const { error: updateError } = await supabase
      .from("organization_members")
      .update({ membership_status: membershipStatus })
      .eq("id", workerMember.id)

    if (updateError) {
      alert(updateError.message)
      return
    }

    setMembers((currentMembers) =>
      currentMembers.map((member) =>
        member.id === workerMember.id
          ? { ...member, membership_status: membershipStatus }
          : member
      )
    )
  }

  const removeWorker = async (worker) => {
    const workerMember = members.find((item) => item.email === worker.email)

    if (!workerMember?.id) {
      alert("This worker does not have a company membership record yet.")
      return
    }

    const confirmed = window.confirm(
      `Remove ${worker.name} from this company workspace? Their account and personal records will stay, but this admin view will no longer manage them.`
    )

    if (!confirmed) return

    const { error: deleteError } = await supabase
      .from("organization_members")
      .delete()
      .eq("id", workerMember.id)

    if (deleteError) {
      alert(deleteError.message)
      return
    }

    setMembers((currentMembers) =>
      currentMembers.filter((member) => member.id !== workerMember.id)
    )
    setRecords((currentRecords) =>
      currentRecords.filter((record) => record.user_email !== worker.email)
    )
  }

  const updateRecordApproval = async (recordId, approvalStatus) => {
    const { error: updateError } = await supabase
      .from("attendance_records")
      .update({ approval_status: approvalStatus })
      .eq("id", recordId)

    if (updateError) {
      alert(updateError.message)
      return
    }

    setRecords((currentRecords) =>
      currentRecords.map((record) =>
        record.id === recordId
          ? { ...record, approval_status: approvalStatus }
          : record
      )
    )
  }

  const updateCorrectionRequest = async (requestId, status) => {
    const { error: updateError } = await supabase
      .from("attendance_correction_requests")
      .update({ status, reviewed_by_email: profile?.email || null })
      .eq("id", requestId)

    if (updateError) {
      alert(updateError.message)
      return
    }

    setCorrectionRequests((currentRequests) =>
      currentRequests.map((request) =>
        request.id === requestId ? { ...request, status } : request
      )
    )
  }

  const exportCompanyCSV = () => {
    if (workers.length === 0) {
      alert("No worker data to export.")
      return
    }

    const rows = workers.flatMap((worker) =>
      worker.dailySummaries.map((day) => [
        worker.name,
        worker.email,
        worker.department,
        day.date,
        day.firstTimeIn,
        day.lastTimeOut,
        day.payableHours.toFixed(2),
        day.overtimeHours.toFixed(2),
        day.lateMinutes,
        day.earnings.toFixed(2),
        day.status,
      ])
    )
    const headers = [
      "Worker",
      "Email",
      "Team",
      "Date",
      "Time In",
      "Time Out",
      "Payable Hours",
      "Overtime",
      "Late Minutes",
      "Pay",
      "Status",
    ]
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")
      ),
    ].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "trackly-company-payroll-report.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredRecords = records.filter((record) => {
    const matchesMonth = selectedMonth
      ? record.date?.startsWith(selectedMonth)
      : true
    const matchesWorker =
      selectedWorker === "all" ? true : record.user_email === selectedWorker

    return matchesMonth && matchesWorker
  })
  const salaryByEmail = salarySettings.reduce((settings, item) => {
    return {
      ...settings,
      [item.user_email]: {
        hourlyRate: Number(item.hourly_rate) || 0,
        paidBreaks: Boolean(item.paid_breaks),
      },
    }
  }, {})
  const memberEmails = members.map((item) => item.email).filter(Boolean)
  const profileEmails = profiles.map((item) => item.email).filter(Boolean)
  const recordEmails = records.map((record) => record.user_email).filter(Boolean)
  const emails = [...new Set([...memberEmails, ...profileEmails, ...recordEmails])]
  const workers = emails
    .map((email) => {
      const workerProfile = profiles.find((item) => item.email === email)
      const workerMember = members.find((item) => item.email === email)
      const workerRecords = filteredRecords.filter(
        (record) => record.user_email === email
      )
      const salaryConfig = salaryByEmail[email] || {
        hourlyRate: 0,
        paidBreaks: false,
      }
      const dailySummaries = getDailyAttendanceSummaries(
        workerRecords,
        salaryConfig.hourlyRate,
        8,
        salaryConfig.paidBreaks
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
        membershipStatus: workerMember?.membership_status || "active",
        department:
          workerMember?.department || workerProfile?.department || "Unassigned",
        position: workerMember?.position || workerProfile?.position || "Worker",
        hourlyRate: salaryConfig.hourlyRate,
        paidBreaks: salaryConfig.paidBreaks,
        recordCount: workerRecords.length,
        dayCount: dailySummaries.length,
        dailySummaries,
        totals,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  const companyTotals = workers.reduce(
    (summary, worker) => {
      if (worker.membershipStatus !== "active") return summary

      return {
        workers: summary.workers + 1,
        records: summary.records + worker.recordCount,
        netHours: summary.netHours + worker.totals.netHours,
        overtimeHours: summary.overtimeHours + worker.totals.overtimeHours,
        earnings: summary.earnings + worker.totals.earnings,
        reviewDays: summary.reviewDays + worker.totals.reviewDays,
      }
    },
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

        <div className="tracker-card admin-control-card">
          <div>
            <h2>Reports and Filters</h2>
            <p>Filter company DTR by month or worker, then export payroll-ready data.</p>
          </div>

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

            <button className="custom-button" type="button" onClick={exportCompanyCSV}>
              Export Payroll CSV
            </button>
          </div>
        </div>

        <div className="admin-workspace-grid">
          <form className="tracker-card login-form" onSubmit={addWorker}>
            <h2>Add Worker</h2>
            <p>
              Add a worker manually by email. Invite links are better for new
              staff, but this is useful for quick admin setup.
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
              placeholder="Team or department"
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

          <form className="tracker-card login-form" onSubmit={createFolderInvite}>
            <h2>Create Team Invite</h2>
            <p>
              Example: Aquaflask Sales Staff - Harbor Point. Trackly generates
              a link you can send to staff assigned to that team.
            </p>

            <input
              className="custom-input"
              placeholder="Team or branch name"
              value={folderName}
              onChange={(event) => setFolderName(event.target.value)}
              required
            />

            <button className="custom-button" type="submit">
              Generate Invite Link
            </button>

            {folderInviteLink && (
              <div className="record-item">
                <strong>Invite link</strong>
                <p>{folderInviteLink}</p>
                <button
                  className="custom-button"
                  type="button"
                  onClick={() => navigator.clipboard.writeText(folderInviteLink)}
                >
                  Copy Link
                </button>
              </div>
            )}
          </form>
        </div>

        <div className="tracker-card admin-control-card">
          <div>
            <h2>Correction Requests</h2>
            <p>Review staff requests before making DTR corrections.</p>
          </div>
          {correctionRequests.length === 0 ? (
            <p>No correction requests yet.</p>
          ) : (
            <div className="records-list">
              {correctionRequests.map((request) => (
                <div className="record-item" key={request.id}>
                  <strong>{request.requested_by_email}</strong>
                  <p>{request.message}</p>
                  <span>Status: {request.status}</span>
                  <div className="worker-actions">
                    <button
                      className="custom-button"
                      type="button"
                      onClick={() => updateCorrectionRequest(request.id, "approved")}
                    >
                      Approve Request
                    </button>
                    <button
                      className="delete-record-button"
                      type="button"
                      onClick={() => updateCorrectionRequest(request.id, "rejected")}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

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
                      {worker.membershipStatus === "archived"
                        ? "archived"
                        : worker.role}
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

                  <div className="records-list">
                    {worker.dailySummaries.slice(0, 3).map((day) => (
                      <div className="record-item" key={day.date}>
                        <strong>{day.date}</strong>
                        <span>Late: {day.lateMinutes}m</span>
                        <span>Payable: {formatDuration(day.payableHours)}</span>
                        <span>Status: {day.status}</span>
                      </div>
                    ))}
                  </div>

                  {records
                    .filter((record) => record.user_email === worker.email)
                    .slice(-2)
                    .map((record) => (
                      <div className="record-item approval-item" key={record.id}>
                        <strong>{record.date} {record.type}</strong>
                        <span>Approval: {record.approval_status || "pending"}</span>
                        {record.photo_data_url && (
                          <TimeMarkImage
                            src={record.photo_data_url}
                            alt={`${record.type} time mark`}
                          />
                        )}
                        <div className="worker-actions">
                          <button
                            className="custom-button"
                            type="button"
                            onClick={() => updateRecordApproval(record.id, "approved")}
                          >
                            Approve
                          </button>
                          <button
                            className="delete-record-button"
                            type="button"
                            onClick={() => updateRecordApproval(record.id, "rejected")}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}

                  {worker.totals.reviewDays > 0 && (
                    <div className="review-box compact-review">
                      <strong>{worker.totals.reviewDays} day(s) need review</strong>
                    </div>
                  )}

                  {worker.role !== "admin" && (
                    <div className="worker-actions">
                      {worker.membershipStatus === "archived" ? (
                        <button
                          className="custom-button"
                          type="button"
                          onClick={() => updateWorkerStatus(worker, "active")}
                        >
                          Restore Staff
                        </button>
                      ) : (
                        <button
                          className="custom-button"
                          type="button"
                          onClick={() => updateWorkerStatus(worker, "archived")}
                        >
                          Archive Staff
                        </button>
                      )}

                      <button
                        className="delete-record-button"
                        type="button"
                        onClick={() => removeWorker(worker)}
                      >
                        Remove
                      </button>
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
