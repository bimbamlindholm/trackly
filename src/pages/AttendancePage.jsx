import { useContext, useState } from "react"

import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

import DashboardLayout from "../layouts/DashboardLayout"
import { AttendanceContext } from "../context/attendanceContextValue"
import { AuthContext } from "../context/authContextValue"
import { SalaryContext } from "../context/salaryContextValue"
import { supabase } from "../services/supabaseClient"

import {
  calculateGrossWorkedHours,
  calculateBreakHours,
  calculateWorkedHours,
  calculateEstimatedSalary,
  calculatePayableHours,
  formatDuration,
  getAttendanceIssues,
  getCutoffDateRange,
  getDailyAttendanceSummaries,
} from "../utils/payrollUtils"

const pesoFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
})

function getTimestampFromDateAndTime(date, time) {
  const timestamp = new Date(`${date} ${time}`).getTime()

  return Number.isNaN(timestamp) ? null : timestamp
}

function AttendancePage() {
  const { records, setRecords } = useContext(AttendanceContext)
  const { user } = useContext(AuthContext)
  const {
    hourlyRate,
    hoursPerDay,
    paidBreaks,
    workStartTime,
    workEndTime,
    gracePeriodMinutes,
    cutoffMode,
  } = useContext(SalaryContext)

  const [editingId, setEditingId] = useState(null)
  const [editType, setEditType] = useState("")
  const [editTime, setEditTime] = useState("")
  const [editDate, setEditDate] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedMonth, setSelectedMonth] = useState("")
  const [selectedCutoff, setSelectedCutoff] = useState("all")
  const [requestMessage, setRequestMessage] = useState("")
  const [requestRecordId, setRequestRecordId] = useState("")

  const filteredRecords = records.filter((record) => {
    const matchesDate = selectedDate ? record.date === selectedDate : true
    const matchesMonth = selectedMonth
      ? record.date?.startsWith(selectedMonth)
      : true

    const cutoffRange =
      selectedMonth && selectedCutoff !== "all"
        ? getCutoffDateRange(selectedMonth, selectedCutoff)
        : null
    const matchesCutoff = cutoffRange
      ? record.date >= cutoffRange.start && record.date <= cutoffRange.end
      : true

    return matchesDate && matchesMonth && matchesCutoff
  })

  const grossHours = calculateGrossWorkedHours(filteredRecords)
  const breakHours = calculateBreakHours(filteredRecords)
  const netWorkedHours = calculateWorkedHours(filteredRecords)
  const payableHours = calculatePayableHours(filteredRecords, paidBreaks)
  const estimatedSalary = calculateEstimatedSalary(
    filteredRecords,
    hourlyRate,
    paidBreaks
  )
  const dailySummaries = getDailyAttendanceSummaries(
    filteredRecords,
    hourlyRate,
    hoursPerDay,
    paidBreaks,
    { workStartTime, workEndTime, gracePeriodMinutes }
  )
  const recordsNeedingReview = dailySummaries.filter(
    (summary) => summary.status === "Needs Review"
  ).length

  const sortedRecords = [...filteredRecords].sort(
    (a, b) => Number(b.timestamp) - Number(a.timestamp)
  )

  const startEdit = (record) => {
    setEditingId(record.id)
    setEditType(record.type)
    setEditTime(record.time)
    setEditDate(record.date)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditType("")
    setEditTime("")
    setEditDate("")
  }

  const saveEdit = async (recordId) => {
    const timestamp = getTimestampFromDateAndTime(editDate, editTime)

    if (!timestamp) {
      alert("Please enter a valid date and time.")
      return
    }

    const { error } = await supabase
      .from("attendance_records")
      .update({
        type: editType,
        time: editTime,
        date: editDate,
        timestamp,
      })
      .eq("id", recordId)

    if (error) {
      alert(error.message)
      return
    }

    setRecords(
      records.map((record) =>
        record.id === recordId
          ? {
              ...record,
              type: editType,
              time: editTime,
              date: editDate,
              timestamp,
            }
          : record
      )
    )

    cancelEdit()
  }

  const deleteRecord = async (recordId) => {
    const confirmDelete = confirm(
      "Are you sure you want to delete this attendance record?"
    )

    if (!confirmDelete) return

    const { error } = await supabase
      .from("attendance_records")
      .delete()
      .eq("id", recordId)

    if (error) {
      alert(error.message)
      return
    }

    setRecords(records.filter((record) => record.id !== recordId))
  }

  const clearFilters = () => {
    setSelectedDate("")
    setSelectedMonth("")
    setSelectedCutoff("all")
  }

  const addDayMarker = async (type) => {
    if (!selectedDate) {
      alert("Pick a date first before marking leave, holiday, or rest day.")
      return
    }

    const markerRecord = {
      type,
      time: "All day",
      date: selectedDate,
      timestamp: new Date(`${selectedDate} 00:00`).getTime(),
      user_email: user?.email,
      approval_status: "pending",
    }

    const { data, error } = await supabase
      .from("attendance_records")
      .insert([markerRecord])
      .select()
      .single()

    if (error) {
      alert(error.message)
      return
    }

    setRecords([...records, data])
  }

  const submitCorrectionRequest = async () => {
    if (!requestMessage.trim()) {
      alert("Describe the correction you need.")
      return
    }

    const { error } = await supabase.from("attendance_correction_requests").insert([
      {
        attendance_record_id: requestRecordId || null,
        requested_by_email: user?.email,
        message: requestMessage.trim(),
        status: "pending",
      },
    ])

    if (error) {
      alert(error.message)
      return
    }

    setRequestMessage("")
    setRequestRecordId("")
    alert("Correction request submitted.")
  }

  const exportCSV = () => {
    if (filteredRecords.length === 0) {
      alert("No records available to export.")
      return
    }

    const headers = [
      "Date",
      "First Time In",
      "Last Time Out",
      "Gross Hours",
      "Break Hours",
      "Net Hours",
      "Payable Hours",
      "Overtime Hours",
      "Undertime Hours",
      "Estimated Earnings",
      "Status",
      "Issues",
    ]

    const rows = dailySummaries.map((summary) => [
      summary.date,
      summary.firstTimeIn,
      summary.lastTimeOut,
      summary.grossHours.toFixed(2),
      summary.breakHours.toFixed(2),
      summary.netHours.toFixed(2),
      summary.payableHours.toFixed(2),
      summary.overtimeHours.toFixed(2),
      summary.undertimeHours.toFixed(2),
      summary.earnings.toFixed(2),
      summary.status,
      summary.issues.join(" | "),
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")
      ),
    ].join("\n")

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.setAttribute("download", "trackly-attendance-report.csv")

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportPDF = () => {
    if (filteredRecords.length === 0) {
      alert("No records available to export.")
      return
    }

    const doc = new jsPDF()

    doc.setFontSize(18)
    doc.text("Trackly Attendance Report", 14, 20)

    doc.setFontSize(11)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30)

    doc.text(`Gross Hours: ${grossHours.toFixed(2)}`, 14, 40)
    doc.text(`Break Hours: ${breakHours.toFixed(2)}`, 14, 48)
    doc.text(`Net Worked Hours: ${netWorkedHours.toFixed(2)}`, 14, 56)
    doc.text(`Payable Hours: ${payableHours.toFixed(2)}`, 14, 64)
    doc.text(
      `Break Policy: ${paidBreaks ? "Paid breaks" : "Unpaid breaks"}`,
      14,
      72
    )
    doc.text(`Estimated Earnings: PHP ${estimatedSalary.toFixed(2)}`, 14, 80)

    autoTable(doc, {
      startY: 92,
      head: [["Date", "Time In", "Time Out", "Payable", "OT", "Pay", "Status"]],
      body: dailySummaries.map((summary) => [
        summary.date,
        summary.firstTimeIn,
        summary.lastTimeOut,
        formatDuration(summary.payableHours),
        formatDuration(summary.overtimeHours),
        `PHP ${summary.earnings.toFixed(2)}`,
        summary.status,
      ]),
    })

    doc.save("trackly-attendance-report.pdf")
  }

  return (
    <DashboardLayout>
      <div className="dashboard-page">
        <div className="dashboard-header">
          <h1>Attendance History</h1>
          <p>View monthly and daily attendance reports.</p>
        </div>

        <div className="dashboard-cards">
          <div className="dashboard-card">
            <h2>Filtered Records</h2>
            <p>{filteredRecords.length}</p>
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
            <h2>Payable Hours</h2>
            <p>{formatDuration(payableHours)}</p>
          </div>

          <div className="dashboard-card">
            <h2>Estimated Earnings</h2>
            <p>{pesoFormatter.format(estimatedSalary)}</p>
          </div>

          <div className="dashboard-card">
            <h2>Needs Review</h2>
            <p>{recordsNeedingReview}</p>
          </div>
        </div>

        <div className="tracker-card">
          <h2>Filters</h2>

          <input
            type="month"
            className="custom-input"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />

          <input
            type="date"
            className="custom-input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />

          <select
            className="custom-input"
            value={selectedCutoff}
            onChange={(event) => setSelectedCutoff(event.target.value)}
          >
            <option value="all">All cutoff dates</option>
            <option value="first-half">1-15 cutoff</option>
            <option value="second-half">16-end cutoff</option>
            <option value={cutoffMode}>My salary cutoff</option>
          </select>

          <button className="custom-button" onClick={clearFilters}>
            Clear Filters
          </button>

          <button className="custom-button" onClick={exportCSV}>
            Export CSV
          </button>

          <button className="custom-button" onClick={exportPDF}>
            Export PDF
          </button>

          <div className="admin-filter-grid">
            <button className="custom-button" onClick={() => addDayMarker("Leave")}>
              Mark Leave
            </button>
            <button className="custom-button" onClick={() => addDayMarker("Holiday")}>
              Mark Holiday
            </button>
            <button className="custom-button" onClick={() => addDayMarker("Rest Day")}>
              Mark Rest Day
            </button>
          </div>

          <div className="record-item">
            <strong>Correction Request</strong>
            <select
              className="custom-input"
              value={requestRecordId}
              onChange={(event) => setRequestRecordId(event.target.value)}
            >
              <option value="">General request</option>
              {sortedRecords.map((record) => (
                <option key={record.id} value={record.id}>
                  {record.date} - {record.type} - {record.time}
                </option>
              ))}
            </select>
            <input
              className="custom-input"
              placeholder="Explain what needs correction"
              value={requestMessage}
              onChange={(event) => setRequestMessage(event.target.value)}
            />
            <button className="custom-button" onClick={submitCorrectionRequest}>
              Submit Request
            </button>
          </div>

          <h2>Daily DTR Summary</h2>

          {dailySummaries.length === 0 ? (
            <div className="record-item">
              <h3>No daily summaries yet.</h3>
              <p>Daily summaries appear when attendance records exist.</p>
            </div>
          ) : (
            <div className="summary-table">
              <div className="summary-row summary-head">
                <span>Date</span>
                <span>Time In</span>
                <span>Time Out</span>
                <span>Net</span>
                <span>Payable</span>
                <span>Pay</span>
                <span>Late</span>
                <span>Status</span>
              </div>

              {dailySummaries.map((summary) => (
                <div className="summary-row" key={summary.date}>
                  <span>{summary.date}</span>
                  <span>{summary.firstTimeIn}</span>
                  <span>{summary.lastTimeOut}</span>
                  <span>{formatDuration(summary.netHours)}</span>
                  <span>{formatDuration(summary.payableHours)}</span>
                  <span>{pesoFormatter.format(summary.earnings)}</span>
                  <span>{summary.lateMinutes}m</span>
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

          <h2>Attendance Records</h2>

          {sortedRecords.length === 0 ? (
            <div className="record-item">
              <h3>No attendance records found.</h3>

              <p>
                Try changing your filters or create a new attendance record.
              </p>
            </div>
          ) : (
            sortedRecords.map((record) => (
              <div
                key={record.id || record.timestamp}
                className="record-item"
              >
                {editingId === record.id ? (
                  <>
                    {getAttendanceIssues([record]).length > 0 && (
                      <p className="helper-text">
                        Editing this record will update the timestamp used by
                        payroll.
                      </p>
                    )}

                    <select
                      className="custom-input"
                      value={editType}
                      onChange={(e) => setEditType(e.target.value)}
                    >
                      <option>Time In</option>
                      <option>Break Out</option>
                      <option>Break In</option>
                      <option>Time Out</option>
                      <option>Leave</option>
                      <option>Holiday</option>
                      <option>Rest Day</option>
                    </select>

                    <input
                      className="custom-input"
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      placeholder="Time"
                    />

                    <input
                      type="date"
                      className="custom-input"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                    />

                    <button
                      className="custom-button"
                      onClick={() => saveEdit(record.id)}
                    >
                      Save
                    </button>

                    <button
                      className="delete-record-button"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <strong>{record.type}</strong>
                    <br />
                    Time: {record.time}
                    <br />
                    Date: {record.date}
                    <br />
                    Email: {record.user_email}
                    <br />
                    Approval: {record.approval_status || "pending"}
                    <br />
                    {record.latitude && record.longitude && (
                      <>
                        Location: {Number(record.latitude).toFixed(5)},{" "}
                        {Number(record.longitude).toFixed(5)}
                        <br />
                      </>
                    )}
                    {record.photo_data_url && (
                      <img
                        className="record-photo"
                        src={record.photo_data_url}
                        alt={`${record.type} time mark`}
                      />
                    )}

                    <button
                      className="custom-button"
                      onClick={() => startEdit(record)}
                    >
                      Edit Record
                    </button>

                    <button
                      className="delete-record-button"
                      onClick={() => deleteRecord(record.id)}
                    >
                      Delete Record
                    </button>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default AttendancePage
