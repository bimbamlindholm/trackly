import { useContext } from "react"
import { useNavigate } from "react-router-dom"

import DashboardLayout from "../layouts/DashboardLayout"
import { AttendanceContext } from "../context/attendanceContextValue"
import { SalaryContext } from "../context/salaryContextValue"
import { AuthContext } from "../context/authContextValue"

import {
  calculateGrossWorkedHours,
  calculateBreakHours,
  calculateOvertimeHours,
  calculateEstimatedSalary,
  calculatePayableHours,
  formatDuration,
  getDailyAttendanceSummaries,
} from "../utils/payrollUtils"

const pesoFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
})

function DashboardPage() {
  const navigate = useNavigate()

  const { records } = useContext(AttendanceContext)

  const {
    hourlyRate,
    hoursPerDay,
    paidBreaks,
  } = useContext(SalaryContext)

  const { user } = useContext(AuthContext)

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email ||
    "User"

  const totalRecords = records.length

  const totalTimeIns = records.filter(
    (record) => record.type === "Time In"
  ).length

  const grossHours = calculateGrossWorkedHours(records)
  const breakHours = calculateBreakHours(records)
  const payableHours = calculatePayableHours(records, paidBreaks)
  const overtimeHours = calculateOvertimeHours(records, hoursPerDay, paidBreaks)
  const estimatedSalary = calculateEstimatedSalary(
    records,
    hourlyRate,
    paidBreaks
  )
  const dailySummaries = getDailyAttendanceSummaries(
    records,
    hourlyRate,
    hoursPerDay,
    paidBreaks
  )
  const completeDays = dailySummaries.filter(
    (summary) => summary.status === "Complete"
  ).length
  const reviewDays = dailySummaries.length - completeDays

  return (
    <DashboardLayout>
      <div className="dashboard-page">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <p>Welcome back, {displayName}.</p>
        </div>

        <div className="tracker-buttons">
          <button onClick={() => navigate("/tracker")}>
            Open Time Tracker
          </button>

          <button onClick={() => navigate("/attendance")}>
            View Attendance
          </button>

          <button onClick={() => navigate("/salary")}>
            Salary Tracker
          </button>
        </div>

        <div className="dashboard-cards">
          <div className="dashboard-card">
            <h2>Total Records</h2>
            <p>{totalRecords}</p>
          </div>

          <div className="dashboard-card">
            <h2>Time In Sessions</h2>
            <p>{totalTimeIns}</p>
          </div>

          <div className="dashboard-card">
            <h2>Gross Hours</h2>
            <p>{formatDuration(grossHours)}</p>
          </div>

          <div className="dashboard-card">
            <h2>Break Hours</h2>
            <p>{formatDuration(breakHours)}</p>
          </div>

          <div className="dashboard-card">
            <h2>Payable Hours</h2>
            <p>{formatDuration(payableHours)}</p>
          </div>

          <div className="dashboard-card">
            <h2>Overtime Hours</h2>
            <p>{formatDuration(overtimeHours)}</p>
          </div>

          <div className="dashboard-card">
            <h2>Estimated Earnings</h2>
            <p>{pesoFormatter.format(estimatedSalary)}</p>
          </div>

          <div className="dashboard-card">
            <h2>Complete DTR Days</h2>
            <p>{completeDays}</p>
          </div>

          <div className="dashboard-card">
            <h2>Needs Review</h2>
            <p>{reviewDays}</p>
          </div>
        </div>

        <div className="tracker-card">
          <h2>Recent Daily DTR</h2>

          {dailySummaries.length === 0 ? (
            <p>No attendance summaries yet.</p>
          ) : (
            <div className="summary-table">
              <div className="summary-row summary-head">
                <span>Date</span>
                <span>Net</span>
                <span>Payable</span>
                <span>Overtime</span>
                <span>Status</span>
              </div>

              {dailySummaries.slice(0, 5).map((summary) => (
                <div className="summary-row" key={summary.date}>
                  <span>{summary.date}</span>
                  <span>{formatDuration(summary.netHours)}</span>
                  <span>{formatDuration(summary.payableHours)}</span>
                  <span>{formatDuration(summary.overtimeHours)}</span>
                  <span
                    className={
                      summary.status === "Complete"
                        ? "status-complete"
                        : "status-review"
                    }
                  >
                    {summary.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default DashboardPage
