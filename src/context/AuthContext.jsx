import { useEffect, useState } from "react"
import { supabase } from "../services/supabaseClient"
import { AuthContext } from "./authContextValue"

function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession()

      setSession(data.session)
      setUser(data.session?.user || null)
      setIsLoggedIn(!!data.session)
      setLoading(false)
    }

    getSession()

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user || null)
        setIsLoggedIn(!!session)
        setLoading(false)
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isLoggedIn,
        loading,
        setIsLoggedIn,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
