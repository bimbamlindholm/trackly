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
    paidBreaks,
    workStartTime,
    workEndTime,
    gracePeriodMinutes,
    cutoffMode,
    salaryError,
    updateSalarySettings,
  } = useContext(SalaryContext)

  const updateSchedule = (schedule) => {
    updateSalarySettings(hourlyRate, hoursPerDay, paidBreaks, schedule)
  }

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
                updateSalarySettings(e.target.value, hoursPerDay, paidBreaks)
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
                updateSalarySettings(hourlyRate, e.target.value, paidBreaks)
              }
              className="custom-input"
              min="0"
              step="0.25"
            />

            <input
              type="time"
              value={workStartTime}
              onChange={(event) =>
                updateSchedule({ workStartTime: event.target.value })
              }
              className="custom-input"
            />

            <input
              type="time"
              value={workEndTime}
              onChange={(event) =>
                updateSchedule({ workEndTime: event.target.value })
              }
              className="custom-input"
            />

            <input
              type="number"
              placeholder="Grace period minutes"
              value={gracePeriodMinutes}
              onChange={(event) =>
                updateSchedule({ gracePeriodMinutes: event.target.value })
              }
              className="custom-input"
              min="0"
              step="1"
            />

            <select
              className="custom-input"
              value={cutoffMode}
              onChange={(event) =>
                updateSchedule({ cutoffMode: event.target.value })
              }
            >
              <option value="monthly">Monthly cutoff</option>
              <option value="first-half">1-15 cutoff</option>
              <option value="second-half">16-end cutoff</option>
            </select>

            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={paidBreaks}
                onChange={(event) =>
                  updateSalarySettings(
                    hourlyRate,
                    hoursPerDay,
                    event.target.checked
                  )
                }
              />
              <span>Paid breaks</span>
            </label>
          </div>

          {salaryError && (
            <p className="form-error">{salaryError}</p>
          )}

          <div className="records-list">
            <h3>Estimated Daily Salary</h3>
            <div className="record-item">
              {pesoFormatter.format(estimatedDailySalary)}
            </div>
            <p className="helper-text">
              {paidBreaks
                ? "Break time is included in payable salary hours."
                : "Break time is excluded from payable salary hours."}
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default SalaryPage
