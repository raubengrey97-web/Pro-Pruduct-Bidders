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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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

  const navLinks = [
    { href: '/products', label: 'Auctions' },
    { href: '/my-products', label: 'My Products' },
    { href: '/user', label: 'Dashboard' },
  ]
  const adminLinks = [
    { href: '/admin', label: 'Admin' },
    { href: '/admin/products', label: 'Manage' },
    { href: '/admin/messages', label: 'Messages' },
  ]

  const linkStyle = (href: string) => ({
    fontSize: '13px',
    color: pathname === href ? '#111' : '#777',
    fontWeight: pathname === href ? 700 : 400,
    textDecoration: 'none',
    borderBottom: pathname === href ? '2px solid #111' : '2px solid transparent',
    paddingBottom: '2px',
    transition: 'all 0.2s'
  })

  return (
    <nav style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '14px 16px', borderBottom: '1px solid #f0f0f0', background: '#fff',
      position: 'sticky', top: 0, zIndex: 50
    }}>
      <Link href="/" style={{ fontFamily: 'Georgia, serif', fontSize: '16px', fontWeight: 700, color: '#111', textDecoration: 'none', whiteSpace: 'nowrap' }}>
        Pro Product Bidders
      </Link>

      {/* Desktop links */}
      <div className="navbar-desktop-links" style={{ display: 'none', gap: '18px', alignItems: 'center', flexWrap: 'wrap' }}>
        {navLinks.map(link => (
          <Link key={link.href} href={link.href} style={linkStyle(link.href)}>{link.label}</Link>
        ))}
        {isAdmin && adminLinks.map(link => (
          <Link key={link.href} href={link.href} style={linkStyle(link.href)}>{link.label}</Link>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Notification bell */}
        <Link href="/notifications" style={{ position: 'relative', textDecoration: 'none', fontSize: '18px' }}>
          🔔
          {unread > 0 && (
            <span style={{
              position: 'absolute', top: '-4px', right: '-6px',
              background: '#e53e3e', color: '#fff', fontSize: '10px',
              padding: '1px 5px', borderRadius: '10px', fontWeight: 600
            }}>{unread}</span>
          )}
        </Link>

        {/* Avatar dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: isAdmin ? '#111' : '#444', color: '#fff',
              border: 'none', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
            {initial}
          </button>

          {dropdownOpen && (
            <div style={{
              position: 'absolute', right: 0, top: '42px', background: '#fff',
              border: '1px solid #ececec', borderRadius: '10px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              minWidth: '180px', overflow: 'hidden', zIndex: 60
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
                <p style={{ fontSize: '12px', color: '#888', marginBottom: '2px' }}>Signed in as</p>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#111', wordBreak: 'break-all' }}>{userEmail}</p>
                {isAdmin && (
                  <span style={{ display: 'inline-block', marginTop: '6px', fontSize: '10px', background: '#fefcbf', color: '#744210', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
                    🛡️ Admin
                  </span>
                )}
              </div>
              {!isAdmin && (
                <>
                  <Link href="/profile" onClick={() => setDropdownOpen(false)}
                    style={{ display: 'block', padding: '10px 16px', fontSize: '13px', color: '#333', textDecoration: 'none' }}>
                    👤 Profile
                  </Link>
                  <Link href="/support" onClick={() => setDropdownOpen(false)}
                    style={{ display: 'block', padding: '10px 16px', fontSize: '13px', color: '#333', textDecoration: 'none' }}>
                    💬 Support
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

        {/* Hamburger - mobile only */}
        <button className="navbar-hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{ display: 'flex', background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', padding: '4px' }}>
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div style={{
          position: 'absolute', top: '60px', left: 0, right: 0, background: '#fff',
          borderBottom: '1px solid #ececec', boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          display: 'flex', flexDirection: 'column', padding: '8px 0', zIndex: 50
        }}>
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)}
              style={{
                padding: '12px 20px', fontSize: '14px',
                color: pathname === link.href ? '#111' : '#555',
                fontWeight: pathname === link.href ? 700 : 400,
                textDecoration: 'none',
                background: pathname === link.href ? '#fafafa' : 'transparent'
              }}>
              {link.label}
            </Link>
          ))}
          {isAdmin && adminLinks.map(link => (
            <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)}
              style={{
                padding: '12px 20px', fontSize: '14px',
                color: pathname === link.href ? '#111' : '#555',
                fontWeight: pathname === link.href ? 700 : 400,
                textDecoration: 'none',
                background: pathname === link.href ? '#fafafa' : 'transparent'
              }}>
              {link.label}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          .navbar-desktop-links { display: flex !important; }
          .navbar-hamburger { display: none !important; }
        }
      `}</style>
    </nav>
  )
      }
