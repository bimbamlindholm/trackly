import { BrowserRouter, Routes, Route } from "react-router-dom"

import LoginPage from "./pages/LoginPage"
import ForgotPasswordPage from "./pages/ForgotPasswordPage"
import RegisterPage from "./pages/RegisterPage"
import DashboardPage from "./pages/DashboardPage"
import TimeTrackerPage from "./pages/TimeTrackerPage"
import SalaryPage from "./pages/SalaryPage"
import AttendancePage from "./pages/AttendancePage"
import SettingsPage from "./pages/SettingsPage"
import SupabaseTestPage from "./pages/SupabaseTestPage"

import ProtectedRoute from "./components/ProtectedRoute"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/supabase-test" element={<SupabaseTestPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tracker"
          element={
            <ProtectedRoute>
              <TimeTrackerPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/attendance"
          element={
            <ProtectedRoute>
              <AttendancePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/salary"
          element={
            <ProtectedRoute>
              <SalaryPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
