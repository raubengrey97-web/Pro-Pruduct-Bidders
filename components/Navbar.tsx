'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { useEffect, useState } from 'react'

export default function Navbar({ isAdmin = false }: { isAdmin?: boolean }) {
  const router = useRouter()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    const fetchUnread = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('read', false)
      setUnread(count || 0)
    }
    fetchUnread()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <nav style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 16px', borderBottom: '1px solid #f0f0f0', background: '#fff',
      flexWrap: 'wrap', gap: '8px'
    }}>
      <Link href="/" style={{ fontFamily: 'Georgia, serif', fontSize: '16px', fontWeight: 700, color: '#111', textDecoration: 'none', whiteSpace: 'nowrap' }}>
        Pro Product Bidders
      </Link>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <Link href="/products" style={{ fontSize: '13px', color: '#555', textDecoration: 'none' }}>Auctions</Link>
        <Link href="/my-products" style={{ fontSize: '13px', color: '#555', textDecoration: 'none' }}>My Products</Link>
        <Link href="/user" style={{ fontSize: '13px', color: '#555', textDecoration: 'none' }}>Dashboard</Link>
        {!isAdmin && (
          <>
            <Link href="/profile" style={{ fontSize: '13px', color: '#555', textDecoration: 'none' }}>Profile</Link>
            <Link href="/support" style={{ fontSize: '13px', color: '#555', textDecoration: 'none' }}>Support</Link>
          </>
        )}
        <Link href="/notifications" style={{ fontSize: '13px', color: '#555', textDecoration: 'none', position: 'relative' }}>
          🔔 {unread > 0 && (
            <span style={{
              background: '#e53e3e', color: '#fff', fontSize: '10px',
              padding: '1px 5px', borderRadius: '10px', marginLeft: '2px'
            }}>{unread}</span>
          )}
        </Link>
        {isAdmin && (
          <>
            <Link href="/admin" style={{ fontSize: '13px', color: '#555', textDecoration: 'none' }}>Admin</Link>
            <Link href="/admin/products" style={{ fontSize: '13px', color: '#555', textDecoration: 'none' }}>Manage</Link>
            <Link href="/admin/messages" style={{ fontSize: '13px', color: '#555', textDecoration: 'none' }}>Messages</Link>
          </>
        )}
        <button onClick={handleLogout}
          style={{ background: '#111', color: '#fff', padding: '7px 14px', borderRadius: '6px', border: 'none', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          Logout
        </button>
      </div>
    </nav>
  )
}
