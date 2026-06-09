'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import Navbar from '@/components/Navbar'

export default function AdminBids() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [bids, setBids] = useState<any[]>([])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profile } = await supabase
        .from('profiles').select('is_admin').eq('id', user.id).single()
      if (!profile?.is_admin) { router.push('/user'); return }
      await fetchBids()
      setLoading(false)
    }
    init()
  }, [])

  const fetchBids = async () => {
    const { data } = await supabase
      .from('bids')
      .select(`
        *,
        profiles:user_id (email, mobile_number, account_name),
        products (title)
      `)
      .order('created_at', { ascending: false })
    setBids(data || [])
  }

  const approveBid = async (bid: any) => {
    const { error } = await supabase
      .from('products')
      .update({
        owner_id: bid.user_id,
        purchase_price: bid.amount,
        status: 'owned'
      })
      .eq('id', bid.product_id)

    if (!error) {
      await supabase.from('bids').update({ status: 'approved' }).eq('id', bid.id)
      await supabase.from('bids')
        .update({ status: 'rejected' })
        .eq('product_id', bid.product_id)
        .neq('id', bid.id)
        .eq('status', 'pending')
      alert('Bid approved. Product transferred.')
      await fetchBids()
    }
  }

  const rejectBid = async (bidId: string) => {
    await supabase.from('bids').update({ status: 'rejected' }).eq('id', bidId)
    await fetchBids()
  }

  const markRefunded = async (bidId: string) => {
    await supabase.from('bids').update({ status: 'refunded' }).eq('id', bidId)
    await fetchBids()
  }

  if (loading) return <p style={{ padding: '40px', textAlign: 'center' }}>Loading...</p>

  return (
    <>
      <Navbar isAdmin={true} />
      <main style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>
          Manage Bids
        </h1>
        <p style={{ color: '#888', marginBottom: '40px' }}>Verify payments and approve winners</p>

        {bids.length === 0 ? (
          <p style={{ color: '#888' }}>No bids yet</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {bids.map(bid => (
              <div key={bid.id} style={{ background: '#fff', border: '1px solid #ececec', borderRadius: '10px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>{bid.products?.title}</p>
                    <p style={{ fontSize: '13px', color: '#888' }}>
                      Bid: ${bid.amount} · Ref: {bid.payment_reference}
                    </p>
                  </div>
                  <span style={{
                    padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500,
                    background: bid.status === 'approved' ? '#f0fff4' : bid.status === 'rejected' ? '#fff5f5' : bid.status === 'refunded' ? '#e0e7ff' : '#fffbeb',
                    color: bid.status === 'approved' ? '#276749' : bid.status === 'rejected' ? '#e53e3e' : bid.status === 'refunded' ? '#4338ca' : '#b45309'
                  }}>{bid.status}</span>
                </div>

                <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px', lineHeight: 1.6 }}>
                  <p><strong>Bidder:</strong> {bid.profiles?.email}</p>
                  <p><strong>📱 Mobile:</strong> {bid.profiles?.mobile_number || <span style={{ color: '#e53e3e' }}>Not set</span>}</p>
                  <p><strong>👤 Account Name:</strong> {bid.profiles?.account_name || <span style={{ color: '#e53e3e' }}>Not set</span>}</p>
                </div>

                {bid.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => approveBid(bid)}
                      style={{ padding: '8px 16px', background: '#f0fff4', color: '#276749', border: '1px solid #c6f6d5', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
                    >
                      ✅ Approve
                    </button>
                    <button
                      onClick={() => rejectBid(bid.id)}
                      style={{ padding: '8px 16px', background: '#fff5f5', color: '#e53e3e', border: '1px solid #fcc', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
                    >
                      ❌ Reject
                    </button>
                  </div>
                )}

                {bid.status === 'rejected' && (
                  <button
                    onClick={() => markRefunded(bid.id)}
                    style={{ padding: '8px 16px', background: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
                  >
                    💸 Mark Refunded
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
        }
