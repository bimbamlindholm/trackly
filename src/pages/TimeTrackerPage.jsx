import { useContext } from "react"

import DashboardLayout from "../layouts/DashboardLayout"
import { AttendanceContext } from "../context/attendanceContextValue"
import { AuthContext } from "../context/authContextValue"
import { supabase } from "../services/supabaseClient"

function TimeTrackerPage() {
  const { records, setRecords } = useContext(AttendanceContext)
  const { user } = useContext(AuthContext)

  const sortedRecords = [...records].sort(
    (a, b) => Number(a.timestamp) - Number(b.timestamp)
  )

  const lastRecord = sortedRecords[sortedRecords.length - 1]

  const currentStatus = (() => {
    if (!lastRecord) return "Not Working"
    if (lastRecord.type === "Time In") return "Currently Working"
    if (lastRecord.type === "Break Out") return "On Break"
    if (lastRecord.type === "Break In") return "Currently Working"
    if (lastRecord.type === "Time Out") return "Not Working"
    return "Not Working"
  })()

  const addRecord = async (type) => {
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

  const canTimeIn = currentStatus === "Not Working"
  const canBreakOut = currentStatus === "Currently Working"
  const canBreakIn = currentStatus === "On Break"
  const canTimeOut = currentStatus === "Currently Working"

  return (
    <DashboardLayout>
      <div className="dashboard-page">
        <div className="dashboard-header">
          <h1>Time Tracker</h1>
          <p>Record your work time and breaks.</p>
        </div>

        <div className="tracker-card">
          <h2>Current Status:</h2>
          <p>{currentStatus}</p>

          <div className="records-list">
            <h3>Attendance Records</h3>

            {sortedRecords.length === 0 ? (
              <p>No attendance records yet.</p>
            ) : (
              sortedRecords.map((record) => (
                <div key={record.id || record.timestamp} className="record-item">
                  {record.type} - {record.time}
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
        </div>
      </div>
    </DashboardLayout>
  )
}

export default TimeTrackerPage
