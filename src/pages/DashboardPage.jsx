import { useContext } from "react"
import { useNavigate } from "react-router-dom"

import DashboardLayout from "../layouts/DashboardLayout"
import { AttendanceContext } from "../context/AttendanceContext"
import { SalaryContext } from "../context/SalaryContext"
import { AuthContext } from "../context/AuthContext"

import {
  calculateGrossWorkedHours,
  calculateBreakHours,
  calculateWorkedHours,
  calculateOvertimeHours,
  calculateEstimatedSalary,
} from "../utils/payrollUtils"

function DashboardPage() {
  const navigate = useNavigate()

  const { records } = useContext(AttendanceContext)

  const {
    hourlyRate,
    hoursPerDay,
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
  const netWorkedHours = calculateWorkedHours(records)
  const overtimeHours = calculateOvertimeHours(records, hoursPerDay)
  const estimatedSalary = calculateEstimatedSalary(records, hourlyRate)

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
            <p>{grossHours.toFixed(2)}</p>
          </div>

          <div className="dashboard-card">
            <h2>Break Hours</h2>
            <p>{breakHours.toFixed(2)}</p>
          </div>

          <div className="dashboard-card">
            <h2>Net Worked Hours</h2>
            <p>{netWorkedHours.toFixed(2)}</p>
          </div>

          <div className="dashboard-card">
            <h2>Overtime Hours</h2>
            <p>{overtimeHours.toFixed(2)}</p>
          </div>

          <div className="dashboard-card">
            <h2>Estimated Earnings</h2>
            <p>₱{estimatedSalary.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default DashboardPage