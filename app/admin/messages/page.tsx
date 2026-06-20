'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import Navbar from '@/components/Navbar'

export default function AdminMessages() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<any[]>([])
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({})

  const fetchMessages = async () => {
    const { data: msgs } = await supabase
      .from('support_messages').select('*')
      .order('created_at', { ascending: false })
    const { data: profiles } = await supabase.from('profiles').select('*')
    const merged = (msgs || []).map((m: any) => ({
      ...m,
      profile: (profiles || []).find((p: any) => p.id === m.user_id) || null
    }))
    setMessages(merged)
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profile } = await supabase
        .from('profiles').select('is_admin').eq('id', user.id).single()
      if (!profile?.is_admin) { router.push('/user'); return }
      await fetchMessages()
      setLoading(false)
    }
    init()
  }, [])

  const sendReply = async (msg: any) => {
    const reply = replyText[msg.id]?.trim()
    if (!reply) return
    await supabase.from('support_messages').update({
      admin_reply: reply,
      status: 'resolved',
      replied_at: new Date().toISOString()
    }).eq('id', msg.id)

    await supabase.from('notifications').insert({
      user_id: msg.user_id,
      title: '💬 Admin Replied',
      message: `Reply to "${msg.subject}": ${reply}`,
      type: 'success'
    })

    setReplyText({ ...replyText, [msg.id]: '' })
    await fetchMessages()
  }

  if (loading) return <p style={{ padding: '40px', textAlign: 'center' }}>Loading...</p>

  const openCount = messages.filter(m => m.status === 'open').length

  return (
    <>
      <Navbar isAdmin={true} />
      <main style={{ padding: '24px 16px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: 700, color: '#111', marginBottom: '4px' }}>
          Support Messages
        </h1>
        <p style={{ color: '#888', fontSize: '14px', marginBottom: '32px' }}>
          {openCount} open · {messages.length} total
        </p>

        {messages.length === 0 ? (
          <p style={{ color: '#888' }}>No messages yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {messages.map(m => (
              <div key={m.id} style={{ background: '#fff', border: '1px solid #ececec', borderRadius: '10px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '14px', color: '#111' }}>{m.subject}</p>
                    <p style={{ fontSize: '12px', color: '#888' }}>{m.profile?.email || 'Unknown user'}</p>
                  </div>
                  <span style={{
                    fontSize: '11px', padding: '3px 8px', borderRadius: '20px', fontWeight: 500,
                    background: m.status === 'resolved' ? '#f0fff4' : '#fffbeb',
                    color: m.status === 'resolved' ? '#276749' : '#b7791f'
                  }}>
                    {m.status === 'resolved' ? '✅ Resolved' : '🟡 Open'}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#444', marginBottom: '8px', lineHeight: 1.5, background: '#fafafa', padding: '10px', borderRadius: '6px' }}>
                  {m.message}
                </p>
                <p style={{ fontSize: '11px', color: '#aaa', marginBottom: '10px' }}>{new Date(m.created_at).toLocaleString()}</p>

                {m.admin_reply ? (
                  <div style={{ background: '#ebf8ff', borderRadius: '8px', padding: '10px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: '#2b6cb0', marginBottom: '4px' }}>Your reply:</p>
                    <p style={{ fontSize: '13px', color: '#444' }}>{m.admin_reply}</p>
                  </div>
                ) : (
                  <div>
                    <textarea
                      placeholder="Type your reply..."
                      value={replyText[m.id] || ''}
                      onChange={e => setReplyText({ ...replyText, [m.id]: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', marginBottom: '8px', height: '60px', resize: 'vertical' }}
                    />
                    <button onClick={() => sendReply(m)}
                      style={{ background: '#111', color: '#fff', padding: '8px 16px', borderRadius: '6px', border: 'none', fontSize: '12px', cursor: 'pointer' }}>
                      Send Reply
                    </button>
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
