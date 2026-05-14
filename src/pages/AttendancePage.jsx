import { useContext, useState } from "react"

import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

import DashboardLayout from "../layouts/DashboardLayout"
import { AttendanceContext } from "../context/AttendanceContext"
import { SalaryContext } from "../context/SalaryContext"
import { supabase } from "../services/supabaseClient"

import {
  calculateGrossWorkedHours,
  calculateBreakHours,
  calculateWorkedHours,
  calculateEstimatedSalary,
} from "../utils/payrollUtils"

function AttendancePage() {
  const { records, setRecords } = useContext(AttendanceContext)
  const { hourlyRate } = useContext(SalaryContext)

  const [editingId, setEditingId] = useState(null)
  const [editType, setEditType] = useState("")
  const [editTime, setEditTime] = useState("")
  const [editDate, setEditDate] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedMonth, setSelectedMonth] = useState("")

  const filteredRecords = records.filter((record) => {
    const matchesDate = selectedDate ? record.date === selectedDate : true
    const matchesMonth = selectedMonth
      ? record.date?.startsWith(selectedMonth)
      : true

    return matchesDate && matchesMonth
  })

  const grossHours = calculateGrossWorkedHours(filteredRecords)
  const breakHours = calculateBreakHours(filteredRecords)
  const netWorkedHours = calculateWorkedHours(filteredRecords)
  const estimatedSalary = calculateEstimatedSalary(filteredRecords, hourlyRate)

  const sortedRecords = [...filteredRecords].sort(
    (a, b) => b.timestamp - a.timestamp
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
    const { error } = await supabase
      .from("attendance_records")
      .update({
        type: editType,
        time: editTime,
        date: editDate,
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
  }

  const exportCSV = () => {
    if (filteredRecords.length === 0) {
      alert("No records available to export.")
      return
    }

    const headers = ["Type", "Time", "Date", "Email"]

    const rows = filteredRecords.map((record) => [
      record.type,
      record.time,
      record.date,
      record.user_email,
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
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
    doc.text(`Estimated Earnings: PHP ${estimatedSalary.toFixed(2)}`, 14, 64)

    autoTable(doc, {
      startY: 75,
      head: [["Type", "Time", "Date", "Email"]],
      body: filteredRecords.map((record) => [
        record.type,
        record.time,
        record.date,
        record.user_email,
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
            <h2>Net Worked Hours</h2>
            <p>{netWorkedHours.toFixed(2)}</p>
          </div>

          <div className="dashboard-card">
            <h2>Estimated Earnings</h2>
            <p>₱{estimatedSalary.toFixed(2)}</p>
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

          <button className="custom-button" onClick={clearFilters}>
            Clear Filters
          </button>

          <button className="custom-button" onClick={exportCSV}>
            Export CSV
          </button>

          <button className="custom-button" onClick={exportPDF}>
            Export PDF
          </button>

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
                    <select
                      className="custom-input"
                      value={editType}
                      onChange={(e) => setEditType(e.target.value)}
                    >
                      <option>Time In</option>
                      <option>Break Out</option>
                      <option>Break In</option>
                      <option>Time Out</option>
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