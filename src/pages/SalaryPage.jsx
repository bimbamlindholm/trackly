import { useContext } from "react"

import DashboardLayout from "../layouts/DashboardLayout"
import { SalaryContext } from "../context/SalaryContext"

function SalaryPage() {
  const {
    hourlyRate,
    setHourlyRate,
    hoursPerDay,
    setHoursPerDay,
  } = useContext(SalaryContext)

  const estimatedDailySalary =
  (Number(hourlyRate) || 0) * (Number(hoursPerDay) || 0)
  return (
    <DashboardLayout>
      <div className="dashboard-page">
        <div className="dashboard-header">
          <h1>Salary Tracker</h1>
          <p>Set your rate and required work hours.</p>
        </div>

        <div className="tracker-card">
          <div className="login-form">
            <input
              type="number"
              placeholder="Hourly rate"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              className="custom-input"
            />

            <input
              type="number"
              placeholder="Required hours per day"
              value={hoursPerDay}
              onChange={(e) => setHoursPerDay(e.target.value)}
              className="custom-input"
            />
          </div>

          <div className="records-list">
            <h3>Estimated Daily Salary</h3>
            <div className="record-item">
              ₱{estimatedDailySalary.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default SalaryPage