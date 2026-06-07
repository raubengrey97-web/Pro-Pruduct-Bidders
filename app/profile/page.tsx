'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import Navbar from '@/components/Navbar'

export default function Profile() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    phone_number: '',
    phone_provider: 'Airtel',
    phone_name: ''
  })

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      const { data: profile } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()
      setIsAdmin(profile?.is_admin || false)
      if (profile) {
        setForm({
          phone_number: profile.phone_number || '',
          phone_provider: profile.phone_provider || 'Airtel',
          phone_name: profile.phone_name || ''
        })
      }
      setLoading(false)
    }
    init()
  }, [])

  const handleSave = async () => {
    if (!form.phone_number || !form.phone_name) {
      setMessage('Please fill in all fields.')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      phone_number: form.phone_number.trim(),
      phone_provider: form.phone_provider,
      phone_name: form.phone_name.trim()
    }).eq('id', user.id)
    if (error) {
      setMessage('Error saving: ' + error.message)
    } else {
      setMessage('✅ Profile saved successfully!')
    }
    setSaving(false)
  }

  if (loading) return <p style={{ padding: '40px', textAlign: 'center' }}>Loading...</p>

  const inputStyle = {
    width: '100%', padding: '10px 12px', border: '1px solid #ddd',
    borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' as const
  }
  const labelStyle = { fontSize: '13px', fontWeight: 500, color: '#444', display: 'block', marginBottom: '6px' }

  return (
    <>
      <Navbar isAdmin={isAdmin} />
      <main style={{ padding: '24px 16px', maxWidth: '500px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: 700, color: '#111', marginBottom: '4px' }}>
          My Profile
        </h1>
        <p style={{ color: '#888', fontSize: '14px', marginBottom: '32px' }}>
          Add your mobile money details so the admin can send you payouts when you sell a product.
        </p>

        <div style={{ background: '#fff', border: '1px solid #ececec', borderRadius: '12px', padding: '24px' }}>
          <p style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>
            📧 Account: <strong>{user?.email}</strong>
          </p>

          {message && (
            <p style={{ marginBottom: '16px', padding: '10px', borderRadius: '6px', fontSize: '13px',
              background: message.startsWith('✅') ? '#f0fff4' : '#fff5f5',
              color: message.startsWith('✅') ? '#276749' : '#e53e3e' }}>
              {message}
            </p>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Mobile Money Provider</label>
            <select value={form.phone_provider}
              onChange={e => setForm({ ...form, phone_provider: e.target.value })}
              style={{ ...inputStyle, background: '#fff' }}>
              <option value="Airtel">Airtel Money</option>
              <option value="MTN">MTN MoMo</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Mobile Money Number</label>
            <input type="tel" placeholder="e.g. 0707021395"
              value={form.phone_number}
              onChange={e => setForm({ ...form, phone_number: e.target.value })}
              style={inputStyle} />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Account Name (as registered)</label>
            <input type="text" placeholder="e.g. John Doe"
              value={form.phone_name}
              onChange={e => setForm({ ...form, phone_name: e.target.value })}
              style={inputStyle} />
          </div>

          <div style={{ background: '#fffbeb', border: '1px solid #f6d860', borderRadius: '8px', padding: '12px', marginBottom: '20px' }}>
            <p style={{ fontSize: '12px', color: '#92400e' }}>
              ⚠️ Make sure these details are correct. The admin will use them to send your payout when your product is sold.
            </p>
          </div>

          <button onClick={handleSave} disabled={saving}
            style={{ width: '100%', background: '#111', color: '#fff', padding: '12px', borderRadius: '6px', border: 'none', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
            {saving ? 'Saving...' : 'Save Payment Details'}
          </button>
        </div>

        {form.phone_number && form.phone_name && (
          <div style={{ marginTop: '16px', background: '#f0fff4', border: '1px solid #9ae6b4', borderRadius: '10px', padding: '16px' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#276749', marginBottom: '8px' }}>✅ Your payout details:</p>
            <p style={{ fontSize: '13px', color: '#444' }}><strong>{form.phone_provider} Money:</strong> {form.phone_number}</p>
            <p style={{ fontSize: '13px', color: '#444' }}><strong>Name:</strong> {form.phone_name}</p>
          </div>
        )}
      </main>
    </>
  )
        }
