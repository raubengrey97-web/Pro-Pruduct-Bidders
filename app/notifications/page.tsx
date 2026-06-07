'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import Navbar from '@/components/Navbar'

export default function Notifications() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      const { data: profile } = await supabase
        .from('profiles').select('is_admin').eq('id', user.id).single()
      setIsAdmin(profile?.is_admin || false)
      await fetchNotifications(user.id, profile?.is_admin || false)
      setLoading(false)
    }
    init()
  }, [])

  const fetchNotifications = async (userId: string, admin: boolean) => {
    let query = supabase.from('notifications').select('*').order('created_at', { ascending: false })
    if (!admin) query = query.eq('user_id', userId)
    const { data } = await query
    setNotifications(data || [])
  }

  const markAllRead = async () => {
    await supabase.from('notifications')
      .update({ read: true })
      .eq('read', false)
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅'
      case 'warning': return '⚠️'
      case 'error': return '❌'
      case 'bid': return '🔨'
      case 'payment': return '💳'
      case 'payout': return '💸'
      case 'user': return '👤'
      case 'product': return '📦'
      default: return '🔔'
    }
  }

  const getColor = (type: string) => {
    switch (type) {
      case 'success': return { bg: '#f0fff4', border: '#9ae6b4', text: '#276749' }
      case 'warning': return { bg: '#fffbeb', border: '#f6d860', text: '#92400e' }
      case 'error': return { bg: '#fff5f5', border: '#feb2b2', text: '#e53e3e' }
      default: return { bg: '#ebf8ff', border: '#90cdf4', text: '#2b6cb0' }
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  if (loading) return <p style={{ padding: '40px', textAlign: 'center' }}>Loading...</p>

  return (
    <>
      <Navbar isAdmin={isAdmin} />
      <main style={{ padding: '24px 16px', maxWidth: '700px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: 700, color: '#111' }}>
            Notifications
          </h1>
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              style={{ background: 'transparent', border: '1px solid #ddd', color: '#555', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
              Mark all read
            </button>
          )}
        </div>
        <p style={{ color: '#888', fontSize: '14px', marginBottom: '32px' }}>
          {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
        </p>

        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', background: '#fafafa', borderRadius: '12px', border: '1px solid #ececec' }}>
            <p style={{ fontSize: '32px', marginBottom: '12px' }}>🔔</p>
            <p style={{ fontSize: '16px', color: '#888' }}>No notifications yet</p>
            <p style={{ fontSize: '13px', color: '#aaa', marginTop: '4px' }}>Activity on the platform will appear here</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {notifications.map(n => {
              const colors = getColor(n.type)
              return (
                <div key={n.id}
                  onClick={() => !n.read && markRead(n.id)}
                  style={{
                    background: n.read ? '#fff' : colors.bg,
                    border: `1px solid ${n.read ? '#ececec' : colors.border}`,
                    borderRadius: '10px', padding: '14px 16px',
                    cursor: n.read ? 'default' : 'pointer',
                    opacity: n.read ? 0.7 : 1,
                    transition: 'opacity 0.2s'
                  }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '20px', marginTop: '2px' }}>{getIcon(n.type)}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <p style={{ fontWeight: 600, fontSize: '14px', color: n.read ? '#555' : colors.text, marginBottom: '4px' }}>
                          {n.title}
                        </p>
                        {!n.read && (
                          <span style={{ background: colors.text, color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '10px', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                            New
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '13px', color: '#666', lineHeight: 1.5 }}>{n.message}</p>
                      <p style={{ fontSize: '11px', color: '#aaa', marginTop: '6px' }}>
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}
