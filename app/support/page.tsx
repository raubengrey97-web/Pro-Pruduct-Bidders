'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import Navbar from '@/components/Navbar'

export default function Support() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<any[]>([])
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState('')

  const fetchMessages = async (userId: string) => {
    const { data } = await supabase
      .from('support_messages').select('*').eq('user_id', userId)
      .order('created_at', { ascending: false })
    setMessages(data || [])
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      const { data: profile } = await supabase
        .from('profiles').select('is_admin').eq('id', user.id).single()
      setIsAdmin(profile?.is_admin || false)
      await fetchMessages(user.id)
      setLoading(false)
    }
    init()
  }, [])

  const sendMessage = async () => {
    if (!subject.trim() || !message.trim()) {
      setNotice('Please fill in subject and message.')
      return
    }
    setSending(true)
    const { error } = await supabase.from('support_messages').insert({
      user_id: user.id,
      subject: subject.trim(),
      message: message.trim(),
      status: 'open'
    })
    if (error) {
      setNotice('Error: ' + error.message)
    } else {
      const { data: adminProfiles } = await supabase
        .from('profiles').select('id').eq('is_admin', true)
      if (adminProfiles) {
        for (const admin of adminProfiles) {
          await supabase.from('notifications').insert({
            user_id: admin.id,
            title: '📩 New Support Message',
            message: `${user.email} sent: "${subject.trim()}"`,
            type: 'warning'
          })
        }
      }
      setNotice('✅ Message sent! Admin will respond soon.')
      setSubject('')
      setMessage('')
      await fetchMessages(user.id)
    }
    setSending(false)
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
      <main style={{ padding: '24px 16px', maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: 700, color: '#111', marginBottom: '4px' }}>
          Support
        </h1>
        <p style={{ color: '#888', fontSize: '14px', marginBottom: '32px' }}>
          Have an issue or question? Send us a message and we'll get back to you.
        </p>

        <div style={{ background: '#fff', border: '1px solid #ececec', borderRadius: '12px', padding: '24px', marginBottom: '32px' }}>
          {notice && (
            <p style={{ marginBottom: '16px', padding: '10px', borderRadius: '6px', fontSize: '13px',
              background: notice.startsWith('✅') ? '#f0fff4' : '#fff5f5',
              color: notice.startsWith('✅') ? '#276749' : '#e53e3e' }}>
              {notice}
            </p>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Subject</label>
            <input value={subject} onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Payment not approved"
              style={inputStyle} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Message</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)}
              placeholder="Describe your issue or question..."
              style={{ ...inputStyle, height: '100px', resize: 'vertical' }} />
          </div>

          <button onClick={sendMessage} disabled={sending}
            style={{ width: '100%', background: '#111', color: '#fff', padding: '12px', borderRadius: '6px', border: 'none', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
            {sending ? 'Sending...' : 'Send Message'}
          </button>
        </div>

        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111', marginBottom: '16px' }}>
          Your Messages ({messages.length})
        </h2>

        {messages.length === 0 ? (
          <p style={{ color: '#888', fontSize: '14px' }}>No messages yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.map(m => (
              <div key={m.id} style={{ background: '#fff', border: '1px solid #ececec', borderRadius: '10px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <p style={{ fontWeight: 600, fontSize: '14px', color: '#111' }}>{m.subject}</p>
                  <span style={{
                    fontSize: '11px', padding: '3px 8px', borderRadius: '20px', fontWeight: 500, whiteSpace: 'nowrap', marginLeft: '8px',
                    background: m.status === 'resolved' ? '#f0fff4' : '#fffbeb',
                    color: m.status === 'resolved' ? '#276749' : '#b7791f'
                  }}>
                    {m.status === 'resolved' ? '✅ Resolved' : '🟡 Open'}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#666', marginBottom: '8px', lineHeight: 1.5 }}>{m.message}</p>
                <p style={{ fontSize: '11px', color: '#aaa', marginBottom: m.admin_reply ? '12px' : 0 }}>
                  {new Date(m.created_at).toLocaleString()}
                </p>
                {m.admin_reply && (
                  <div style={{ background: '#ebf8ff', borderRadius: '8px', padding: '10px', marginTop: '8px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: '#2b6cb0', marginBottom: '4px' }}>🛡️ Admin reply:</p>
                    <p style={{ fontSize: '13px', color: '#444', lineHeight: 1.5 }}>{m.admin_reply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
