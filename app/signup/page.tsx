'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import Link from 'next/link'

export default function Signup() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async () => {
    setError('')
    const emailTrimmed = email.trim()
    const passwordTrimmed = password.trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailTrimmed)) { setError('Please enter a valid email address.'); return }
    if (passwordTrimmed.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email: emailTrimmed, password: passwordTrimmed })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/user')
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
      <div style={{ background: '#fff', border: '1px solid #ececec', borderRadius: '12px', padding: '48px', width: '100%', maxWidth: '400px' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: 700, marginBottom: '8px', color: '#111' }}>Create account</h1>
        <p style={{ color: '#888', fontSize: '14px', marginBottom: '32px' }}>Start bidding in seconds</p>

        {error && <p style={{ color: '#e53e3e', fontSize: '13px', marginBottom: '16px', background: '#fff5f5', padding: '10px', borderRadius: '6px' }}>{error}</p>}

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: 500, color: '#444', display: 'block', marginBottom: '6px' }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '13px', fontWeight: 500, color: '#444', display: 'block', marginBottom: '6px' }}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
        </div>

        <button onClick={handleSignup} disabled={loading}
          style={{ width: '100%', background: '#111', color: '#fff', padding: '12px', borderRadius: '6px', border: 'none', fontSize: '15px', fontWeight: 500, cursor: 'pointer' }}>
          {loading ? 'Creating account...' : 'Create Account'}
        </button>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: '#888' }}>
          Already have an account? <Link href="/login" style={{ color: '#111', fontWeight: 500 }}>Sign in</Link>
        </p>
      </div>
    </main>
  )
}
