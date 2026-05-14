import { supabase } from "../services/supabaseClient"

function SupabaseTestPage() {
  const testConnection = () => {
    console.log("Supabase client:", supabase)
    alert("Supabase client loaded. Check console.")
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Supabase Test</h1>
        <p>Testing if Trackly can load the Supabase client.</p>

        <button className="custom-button" onClick={testConnection}>
          Test Supabase
        </button>
      </div>
    </div>
  )
}

export default SupabaseTestPage