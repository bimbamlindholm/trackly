import ThemeProvider from "./context/ThemeContext"
import AuthProvider from "./context/AuthContext"
import SalaryProvider from "./context/SalaryContext"
import AttendanceProvider from "./context/AttendanceContext"
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <AttendanceProvider>
          <SalaryProvider>
            <App />
          </SalaryProvider>
        </AttendanceProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
