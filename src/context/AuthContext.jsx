import { useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "../services/supabaseClient"
import { AuthContext } from "./authContextValue"

function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)

  const adminEmails = useMemo(() => {
    return (import.meta.env.VITE_TRACKLY_ADMIN_EMAILS || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  }, [])

  const loadProfile = useCallback(async (activeUser) => {
    if (!activeUser?.id) {
      setProfile(null)
      return
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", activeUser.id)
      .single()

    if (error) {
      const fallbackRole = adminEmails.includes(
        activeUser.email?.toLowerCase()
      )
        ? "admin"
        : "worker"

      setProfile({
        id: activeUser.id,
        email: activeUser.email,
        full_name: activeUser.user_metadata?.full_name || "",
        role: fallbackRole,
      })
      return
    }

    setProfile(data)
  }, [adminEmails])

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession()

      setSession(data.session)
      setUser(data.session?.user || null)
      setIsLoggedIn(!!data.session)
      await loadProfile(data.session?.user || null)
      setLoading(false)
    }

    getSession()

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user || null)
        setIsLoggedIn(!!session)
        loadProfile(session?.user || null).finally(() => {
          setLoading(false)
        })
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [loadProfile])

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isAdmin: profile?.role === "admin",
        isLoggedIn,
        loading,
        setProfile,
        setIsLoggedIn,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
