'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function UserDashboard() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  if (!user) return <p>Please login first</p>

  return (
    <div>
      <h1>User Dashboard</h1>
      <p>Welcome {user.email}</p>
      <button onClick={() => supabase.auth.signOut()}>Logout</button>
    </div>
  )
}
