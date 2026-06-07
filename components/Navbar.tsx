'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'

export default function Navbar({ isAdmin = false }: { isAdmin?: boolean }) {
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <nav style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '16px 32px', borderBottom: '1px solid #f0f0f0', background: '#fff'
    }}>
      <Link href="/" style={{ fontFamily: 'Georgia, serif', fontSize: '18px', fontWeight: 700, color: '#111', textDecoration: 'none' }}>
        Pro Product Bidders
      </Link>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <Link href="/user" style={{ fontSize: '14px', color: '#555', textDecoration: 'none' }}>Dashboard</Link>
        {isAdmin && <Link href="/admin" style={{ fontSize: '14px', color: '#555', textDecoration: 'none' }}>Admin</Link>}
        <button onClick={handleLogout}
          style={{ background: '#111', color: '#fff', padding: '8px 18px', borderRadius: '6px', border: 'none', fontSize: '13px', cursor: 'pointer' }}>
          Logout
        </button>
      </div>
    </nav>
  )
      }
