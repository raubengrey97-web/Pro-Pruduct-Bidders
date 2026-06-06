'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase-client'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSignup = async () => {
    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      alert("Unable to validate email address: invalid format")
      return
    }

    const { error } = await supabase.auth.signUp({ email: email.trim(), password })
    if (error) alert(error.message)
    else alert('Check your email to confirm signup')
  }

  return (
    <div>
      <h1>Sign Up</h1>
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
      <button onClick={handleSignup}>Sign Up</button>
    </div>
  )
}
