'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { useEffect, useState, useRef } from 'react'

export default function Navbar({ isAdmin = false }: { isAdmin?: boolean }) {
  const router = useRouter()
  const pathname = usePathname()
  const [unread, setUnread] = useState(0)
  const [userEmail, setUserEmail] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserEmail(user.email || '')
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('read', false)
      setUnread(count || 0)
    }
    fetchData()
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const initial = userEmail ? userEmail[0].toUpperCase() : '?'

  const tabs = [
    { href: '/user', icon: '🏠', label: 'Home' },
    { href: '/products', icon: '🔨', label: 'Auctions' },
    { href: '/my-products', icon: '📦', label: 'My Products' },
    { href: '/notifications', icon: '🔔', label: 'Alerts', badge: unread },
    isAdmin
      ? { href: '/admin', icon: '🛡️', label: 'Admin' }
      : { href: '/profile', icon: '👤', label: 'Profile' },
  ]

  return (
    <>
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 16px', borderBottom: '1px solid #e2e8f0', background: '#fff',
        position: 'sticky', top: 0, zIndex: 50,
        boxShadow: '0 1px 4px rgba(30,58,138,0.06)'
      }}>
        <Link href="/" style={{ fontFamily: 'Georgia, serif', fontSize: '16px', fontWeight: 700, color: '#1E3A8A', textDecoration: 'none' }}>
          Pro Product Bidders
        </Link>

        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: '#1E3A8A', color: '#fff',
              border: 'none', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
            {initial}
          </button>

          {dropdownOpen && (
            <div style={{
              position: 'absolute', right: 0, top: '42px', background: '#fff',
              border: '1px solid #e2e8f0', borderRadius: '10px',
              boxShadow: '0 4px 16px rgba(30,58,138,0.10)',
              minWidth: '180px', overflow: 'hidden', zIndex: 60
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', background: '#EFF6FF' }}>
                <p style={{ fontSize: '12px', color: '#1E3A8A', marginBottom: '2px' }}>Signed in as</p>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#1E3A8A', wordBreak: 'break-all' }}>{userEmail}</p>
                {isAdmin && (
                  <span style={{ display: 'inline-block', marginTop: '6px', fontSize: '10px', background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
                    🛡️ Admin
                  </span>
                )}
              </div>
              {!isAdmin && (
                <>
                  <Link href="/profile" onClick={() => setDropdownOpen(false)}
                    style={{ display: 'block', padding: '10px 16px', fontSize: '13px', color: '#1E3A8A', textDecoration: 'none' }}>
                    👤 Profile
                  </Link>
                  <Link href="/support" onClick={() => setDropdownOpen(false)}
                    style={{ display: 'block', padding: '10px 16px', fontSize: '13px', color: '#1E3A8A', textDecoration: 'none' }}>
                    💬 Support
                  </Link>
                </>
              )}
              {isAdmin && (
                <>
                  <Link href="/admin/products" onClick={() => setDropdownOpen(false)}
                    style={{ display: 'block', padding: '10px 16px', fontSize: '13px', color: '#1E3A8A', textDecoration: 'none' }}>
                    ⚙️ Manage Products
                  </Link>
                  <Link href="/admin/messages" onClick={() => setDropdownOpen(false)}
                    style={{ display: 'block', padding: '10px 16px', fontSize: '13px', color: '#1E3A8A', textDecoration: 'none' }}>
                    💬 Messages
                  </Link>
                </>
              )}
              <button onClick={handleLogout}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: '13px', color: '#e53e3e', background: 'none', border: 'none', borderTop: '1px solid #f0f0f0', cursor: 'pointer' }}>
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Bottom tab bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        background: '#fff', borderTop: '2px solid #EFF6FF', padding: '8px 4px',
        zIndex: 50, paddingBottom: 'max(8px, env(safe-area-inset-bottom))'
      }}>
        {tabs.map(tab => {
          const active = pathname === tab.href
          return (
            <Link key={tab.href} href={tab.href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              textDecoration: 'none', flex: 1, position: 'relative', padding: '4px'
            }}>
              <span style={{ fontSize: '20px', filter: active ? 'none' : 'grayscale(0.5) opacity(0.5)' }}>
                {tab.icon}
                {('badge' in tab) && tab.badge! > 0 && (
                  <span style={{
                    position: 'absolute', top: '-2px', right: '18%',
                    background: '#F59E0B', color: '#fff', fontSize: '9px',
                    padding: '1px 4px', borderRadius: '10px', fontWeight: 700
                  }}>{tab.badge}</span>
                )}
              </span>
              <span style={{ fontSize: '10px', color: active ? '#1E3A8A' : '#999', fontWeight: active ? 700 : 400, marginTop: '2px' }}>
                {tab.label}
              </span>
              {active && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#F59E0B', marginTop: '2px' }} />}
            </Link>
          )
        })}
      </div>

      {!isAdmin && (
        <Link href="/support" style={{
          position: 'fixed', bottom: '76px', right: '16px',
          width: '52px', height: '52px', borderRadius: '50%',
          background: '#1E3A8A', color: '#fff', display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontSize: '22px',
          textDecoration: 'none', boxShadow: '0 4px 12px rgba(30,58,138,0.3)',
          zIndex: 55
        }}>
          💬
        </Link>
      )}

      <div style={{ height: '64px' }} />
    </>
  )
                      }
