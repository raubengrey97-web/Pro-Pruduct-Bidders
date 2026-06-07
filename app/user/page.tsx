'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import Navbar from '@/components/Navbar'

export default function UserDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setUser(user)
      }
      setLoading(false)
    }
    getUser()
  }, [])

  if (loading) return <p style={{ padding: '40px', textAlign: 'center' }}>Loading...</p>

  return (
    <>
      <Navbar />
      <main style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: 700, color: '#111', marginBottom: '8px' }}>
          My Dashboard
        </h1>
        <p style={{ color: '#888', marginBottom: '32px' }}>Welcome, {user?.email}</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {[
            { label: 'Active Bids', value: '0' },
            { label: 'Won Auctions', value: '0' },
            { label: 'Transactions', value: '0' },
          ].map(card => (
            <div key={card.label} style={{ background: '#fafafa', border: '1px solid #ececec', borderRadius: '10px', padding: '24px' }}>
              <p style={{ fontSize: '13px', color: '#888', marginBottom: '8px' }}>{card.label}</p>
              <p style={{ fontSize: '28px', fontWeight: 700, color: '#111' }}>{card.value}</p>
            </div>
          ))}
        </div>
      </main>
    </>
  )
}
