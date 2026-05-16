import { useContext, useEffect, useRef, useState } from "react"

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
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState("")
  const [timeMarkPhoto, setTimeMarkPhoto] = useState("")
  const [photoCapturedAt, setPhotoCapturedAt] = useState("")

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

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

  const startCamera = async () => {
    setCameraError("")

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera is not supported on this browser.")
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      })

      streamRef.current = stream
      setCameraActive(true)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      setCameraError(error.message || "Camera permission was blocked.")
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setCameraActive(false)
  }

  const captureTimeMark = () => {
    const video = videoRef.current

    if (!video?.videoWidth || !video?.videoHeight) {
      setCameraError("Camera preview is still loading. Try again in a moment.")
      return
    }

    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const context = canvas.getContext("2d")
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    const capturedAt = new Date()
    const stampLines = [
      "Trackly Time Mark",
      capturedAt.toLocaleString(),
      user?.email || "Unknown user",
    ]

    context.fillStyle = "rgba(4, 18, 11, 0.82)"
    context.fillRect(0, canvas.height - 116, canvas.width, 116)
    context.fillStyle = "#79ff9c"
    context.font = "700 28px Arial"
    context.fillText(stampLines[0], 24, canvas.height - 72)
    context.fillStyle = "#ffffff"
    context.font = "500 22px Arial"
    context.fillText(stampLines[1], 24, canvas.height - 42)
    context.fillText(stampLines[2], 24, canvas.height - 16)

    setTimeMarkPhoto(canvas.toDataURL("image/jpeg", 0.82))
    setPhotoCapturedAt(capturedAt.toISOString())
    setCameraError("")
  }

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
      photo_data_url: timeMarkPhoto || null,
      photo_captured_at: photoCapturedAt || null,
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
    setTimeMarkPhoto("")
    setPhotoCapturedAt("")
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

          <div className="time-mark-panel">
            <div>
              <span className="eyebrow">Camera Time Mark</span>
              <h3>Selfie stamp before logging time</h3>
              <p>
                Capture a selfie with date and time. The next attendance action
                will save this image as proof for admin review.
              </p>
            </div>

            <div className="camera-frame">
              {timeMarkPhoto ? (
                <img src={timeMarkPhoto} alt="Captured time mark" />
              ) : (
                <video ref={videoRef} autoPlay muted playsInline />
              )}
            </div>

            {cameraError && <p className="form-error">{cameraError}</p>}

            <div className="camera-actions">
              {!cameraActive ? (
                <button className="custom-button" type="button" onClick={startCamera}>
                  Open Camera
                </button>
              ) : (
                <>
                  <button
                    className="custom-button"
                    type="button"
                    onClick={captureTimeMark}
                  >
                    Capture Time Mark
                  </button>
                  <button type="button" onClick={stopCamera}>
                    Stop Camera
                  </button>
                </>
              )}

              {timeMarkPhoto && (
                <button
                  type="button"
                  onClick={() => {
                    setTimeMarkPhoto("")
                    setPhotoCapturedAt("")
                  }}
                >
                  Retake
                </button>
              )}
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
                  {record.photo_data_url && (
                    <img
                      className="record-photo"
                      src={record.photo_data_url}
                      alt={`${record.type} time mark`}
                    />
                  )}
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
