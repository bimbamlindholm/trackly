import { useContext } from "react"

import DashboardLayout from "../layouts/DashboardLayout"
import { AttendanceContext } from "../context/attendanceContextValue"
import { AuthContext } from "../context/authContextValue"
import { supabase } from "../services/supabaseClient"
import {
  formatDuration,
  getAllowedAttendanceActions,
  getAttendanceIssues,
  getAttendanceStatus,
} from "../utils/payrollUtils"

function TimeTrackerPage() {
  const { records, setRecords } = useContext(AttendanceContext)
  const { user } = useContext(AuthContext)

  const sortedRecords = [...records].sort(
    (a, b) => Number(a.timestamp) - Number(b.timestamp)
  )

  const lastRecord = sortedRecords[sortedRecords.length - 1]
  const currentStatus = getAttendanceStatus(records)
  const attendanceIssues = getAttendanceIssues(records)
  const today = new Date().toISOString().split("T")[0]
  const todayRecords = records.filter((record) => record.date === today)
  const todayStartedAt = todayRecords.find(
    (record) => record.type === "Time In"
  )

  const addRecord = async (type) => {
    const allowedActions = getAllowedAttendanceActions(records)
    const allowedByType = {
      "Time In": allowedActions.canTimeIn,
      "Break Out": allowedActions.canBreakOut,
      "Break In": allowedActions.canBreakIn,
      "Time Out": allowedActions.canTimeOut,
    }

    if (!allowedByType[type]) {
      alert(`Cannot add ${type} while status is ${currentStatus}.`)
      return
    }

    const now = new Date()

    const newRecord = {
      type,
      time: now.toLocaleTimeString(),
      date: now.toISOString().split("T")[0],
      timestamp: now.getTime(),
      user_email: user?.email,
    }

    const { data, error } = await supabase
      .from("attendance_records")
      .insert([newRecord])
      .select()
      .single()

    if (error) {
      alert("Failed to save record to Supabase.")
      console.error(error)
      return
    }

    setRecords([...records, data])
  }

  const {
    canTimeIn,
    canBreakOut,
    canBreakIn,
    canTimeOut,
  } = getAllowedAttendanceActions(records)

  return (
    <DashboardLayout>
      <div className="dashboard-page">
        <div className="dashboard-header">
          <h1>Time Tracker</h1>
          <p>Record your work time and breaks.</p>
        </div>

        <div className="tracker-card">
          <div className="status-panel">
            <div>
              <span className="eyebrow">Live DTR Status</span>
              <h2>{currentStatus}</h2>
              <p>
                {todayStartedAt
                  ? `Today started at ${todayStartedAt.time}.`
                  : "No time-in yet for today."}
              </p>
            </div>

            <div className="status-pill">
              {lastRecord ? lastRecord.type : "Ready"}
            </div>
          </div>

          {attendanceIssues.length > 0 && (
            <div className="review-box">
              <strong>DTR needs review</strong>
              {attendanceIssues.slice(0, 3).map((issue) => (
                <p key={issue}>{issue}</p>
              ))}
            </div>
          )}

          <div className="records-list">
            <h3>Today&apos;s Records</h3>

            {todayRecords.length === 0 ? (
              <p>No attendance records yet.</p>
            ) : (
              todayRecords.map((record) => (
                <div key={record.id || record.timestamp} className="record-item">
                  <strong>{record.type}</strong>
                  <span>{record.time}</span>
                </div>
              ))
            )}
          </div>

          <div className="tracker-buttons">
            <button disabled={!canTimeIn} onClick={() => addRecord("Time In")}>
              Time In
            </button>

            <button disabled={!canBreakOut} onClick={() => addRecord("Break Out")}>
              Break Out
            </button>

            <button disabled={!canBreakIn} onClick={() => addRecord("Break In")}>
              Break In
            </button>

            <button disabled={!canTimeOut} onClick={() => addRecord("Time Out")}>
              Time Out
            </button>
          </div>

          <p className="helper-text">
            Current saved records: {records.length}. Estimated raw DTR span is{" "}
            {formatDuration(
              lastRecord && sortedRecords[0]
                ? (Number(lastRecord.timestamp) -
                    Number(sortedRecords[0].timestamp)) /
                    1000 /
                    60 /
                    60
                : 0
            )}
            .
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default TimeTrackerPage
