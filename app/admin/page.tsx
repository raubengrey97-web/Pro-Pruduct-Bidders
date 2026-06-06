'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'

export default function Admin() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })
  }, [])

  if (loading) return <p>Loading...</p>
  if (!user) return <p>Please login first</p>

  // Check if user has admin role
  if (user.user_metadata?.role !== 'admin') {
    return <p>Access denied. You don’t have admin permissions.</p>
  }

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Logged in as: {user.email}</p>
      <button onClick={() => supabase.auth.signOut()}>Logout</button>
      
      {/* Put your admin content here */}
      <p>Welcome admin! Dashboard content goes here.</p>
    </div>
  )
}
