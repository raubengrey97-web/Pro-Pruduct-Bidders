'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase-client'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSignup = async () => {
    const cleanEmail = email.trim()
    const cleanPassword = password.trim()

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(cleanEmail)) {
      alert("Unable to validate email address: invalid format")
      return
    }

    if (cleanPassword.length < 6) {
      alert("Password must be at least 6 characters")
      return
    }

    const { error } = await supabase.auth.signUp({ 
      email: cleanEmail, 
      password: cleanPassword 
    })
    
    if (error) alert(error.message)
    else alert('Check your email to confirm signup')
  }

  return (
    <div>
      <h1>Sign Up</h1>
      <input 
        type="email"
        autoComplete="email"
        placeholder="Email" 
        value={email} 
        onChange={e => setEmail(e.target.value)} 
      />
      <input 
        type="password" 
        autoComplete="new-password"
        placeholder="Password" 
        value={password} 
        onChange={e => setPassword(e.target.value)} 
      />
      <button onClick={handleSignup}>Sign Up</button>
    </div>
  )
}
