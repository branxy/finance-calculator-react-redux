import { type Session } from "@supabase/supabase-js"
import { useEffect, useState } from "react"
import { supabase } from "../backend/supabaseClient"

export default function useSupabaseSession(): [Session | null, boolean] {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    setIsLoading(false)

    return () => subscription.unsubscribe()
  }, [])

  return [session, isLoading]
}
