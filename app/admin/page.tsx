'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import Navbar from '@/components/Navbar'

export default function Admin() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [bids, setBids] = useState<any[]>([])

  const fetchBids = async () => {
    const { data } = await supabase
      .from('bids')
      .select('*, products(title)')
      .order('created_at', { ascending: false })
    setBids(data || [])
  }

  const updateBidStatus = async (id: string, status: string) => {
    await supabase.from('bids').update({ status }).eq('id', id)
    fetchBids()
  }

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profile } = await supabase
        .from('profiles').select('is_admin').eq('id', user.id).single()
      if (!profile?.is_admin) { router.push('/user'); return }
      setUser(user)
      await fetchBids()
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) return <p style={{ padding: '40px', textAlign: 'center' }}>Loading...</p>

  return (
    <>
      <Navbar isAdmin={true} />
      <main style={{ padding: '24px 16px', maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: 700, color: '#111', marginBottom: '4px' }}>
          Admin Dashboard
        </h1>
        <p style={{ color: '#888', marginBottom: '32px', fontSize: '14px' }}>Logged in as: {user?.email}</p>

        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111', marginBottom: '16px' }}>
          Bids & Payments ({bids.length})
        </h2>

        {bids.length === 0 ? (
          <p style={{ color: '#888' }}>No bids yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {bids.map(bid => (
              <div key={bid.id} style={{ background: '#fff', border: '1px solid #ececec', borderRadius: '10px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <p style={{ fontWeight: 600, color: '#111', marginBottom: '4px' }}>{bid.products?.title || 'Unknown Product'}</p>
                    <p style={{ fontSize: '13px', color: '#888' }}>Bid Amount: <strong>${bid.amount}</strong></p>
                    <p style={{ fontSize: '13px', color: '#888' }}>User: {bid.user_id}</p>
                    <p style={{ fontSize: '13px', color: '#888' }}>Date: {new Date(bid.created_at).toLocaleString()}</p>
                    {bid.payment_ref && (
                      <p style={{ fontSize: '13px', marginTop: '6px', background: '#fffbeb', padding: '6px 10px', borderRadius: '6px', color: '#92400e' }}>
                        💳 Payment Ref: <strong>{bid.payment_ref}</strong>
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500,
                      background: bid.status === 'won' ? '#f0fff4' : bid.status === 'lost' ? '#fff5f5' : '#fffbeb',
                      color: bid.status === 'won' ? '#276749' : bid.status === 'lost' ? '#e53e3e' : '#b7791f'
                    }}>{bid.status}</span>
                    {bid.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => updateBidStatus(bid.id, 'won')}
                          style={{ background: '#111', color: '#fff', padding: '6px 14px', borderRadius: '6px', border: 'none', fontSize: '12px', cursor: 'pointer' }}>
                          ✅ Approve
                        </button>
                        <button onClick={() => updateBidStatus(bid.id, 'lost')}
                          style={{ background: '#fff5f5', color: '#e53e3e', padding: '6px 14px', borderRadius: '6px', border: '1px solid #feb2b2', fontSize: '12px', cursor: 'pointer' }}>
                          ❌ Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
