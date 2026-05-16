import { useContext } from "react"

import DashboardLayout from "../layouts/DashboardLayout"
import { SalaryContext } from "../context/salaryContextValue"

const pesoFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
})

function SalaryPage() {
  const {
    hourlyRate,
    hoursPerDay,
    salaryError,
    updateSalarySettings,
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
              onChange={(e) =>
                updateSalarySettings(e.target.value, hoursPerDay)
              }
              className="custom-input"
              min="0"
              step="0.01"
            />

            <input
              type="number"
              placeholder="Required hours per day"
              value={hoursPerDay}
              onChange={(e) =>
                updateSalarySettings(hourlyRate, e.target.value)
              }
              className="custom-input"
              min="0"
              step="0.25"
            />
          </div>

          {salaryError && (
            <p className="form-error">{salaryError}</p>
          )}

          <div className="records-list">
            <h3>Estimated Daily Salary</h3>
            <div className="record-item">
              {pesoFormatter.format(estimatedDailySalary)}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default SalaryPage
