'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import Navbar from '@/components/Navbar'

export default function Admin() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'bids' | 'products' | 'users'>('bids')
  const [bids, setBids] = useState<any[]>([])
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [earnings, setEarnings] = useState({ total: 0, pending: 0, thisMonth: 0 })

  const fetchAll = async () => {
    const { data: bidsData } = await supabase
      .from('bids')
      .select('*, products(title, original_price)')
      .order('created_at', { ascending: false })

    const { data: profilesData } = await supabase
      .from('profiles').select('*')

    const mergedBids = (bidsData || []).map((bid: any) => ({
      ...bid,
      profiles: (profilesData || []).find((p: any) => p.id === bid.user_id) || null
    }))

    setBids(mergedBids)
    setUsers(profilesData || [])

    const { data: productsData } = await supabase
      .from('products').select('*').order('created_at', { ascending: false })
    setAllProducts(productsData || [])

    const wonBids = mergedBids.filter((b: any) => b.status === 'won')
    const total = wonBids.reduce((sum: number, b: any) => sum + (b.amount * 0.10), 0)
    const pendingPayouts = wonBids
      .filter((b: any) => !b.payout_sent)
      .reduce((sum: number, b: any) => sum + (b.amount * 0.90), 0)
    const thisMonth = wonBids
      .filter((b: any) => new Date(b.created_at).getMonth() === new Date().getMonth())
      .reduce((sum: number, b: any) => sum + (b.amount * 0.10), 0)
    setEarnings({ total, pending: pendingPayouts, thisMonth })
  }

  const approveBid = async (bid: any) => {
    const commissionAmount = bid.amount * 0.10
    const payoutAmount = bid.amount * 0.90

    await supabase.from('bids').update({ status: 'won', payout_amount: payoutAmount }).eq('id', bid.id)

    await supabase.from('products').update({
      owner_id: bid.user_id,
      status: 'sold',
      purchase_price: bid.amount,
      held_since: new Date().toISOString()
    }).eq('id', bid.product_id)

    await supabase.from('commissions').insert({
      bid_id: bid.id,
      product_id: bid.product_id,
      user_id: bid.user_id,
      sale_amount: bid.amount,
      commission_amount: commissionAmount,
      user_payout: payoutAmount,
      type: 'purchase'
    })

    await supabase.from('bids').update({ status: 'lost' })
      .eq('product_id', bid.product_id).neq('id', bid.id)

    // Notify winning buyer
    await supabase.from('notifications').insert({
      user_id: bid.user_id,
      title: '🎉 Bid Approved!',
      message: `Your bid of UGX ${bid.amount} on ${bid.products?.title} was approved! The product is now yours.`,
      type: 'success'
    })

    fetchAll()
  }

  const rejectBid = async (id: string) => {
    const rejectedBid = bids.find((b: any) => b.id === id)
    await supabase.from('bids').update({ status: 'lost' }).eq('id', id)

    if (rejectedBid) {
      await supabase.from('notifications').insert({
        user_id: rejectedBid.user_id,
        title: 'Bid Rejected',
        message: `Your bid of UGX ${rejectedBid.amount} on ${rejectedBid.products?.title} was rejected. Payment not verified.`,
        type: 'error'
      })
    }

    fetchAll()
  }

  const markPayoutSent = async (bid: any) => {
    await supabase.from('bids').update({
      payout_sent: true,
      payout_sent_at: new Date().toISOString()
    }).eq('id', bid.id)

    await supabase.from('notifications').insert({
      user_id: bid.user_id,
      title: '💸 Payout Sent!',
      message: `Your payout of UGX ${(bid.amount * 0.90).toFixed(2)} has been sent to your mobile money account.`,
      type: 'payout'
    })

    fetchAll()
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profile } = await supabase
        .from('profiles').select('is_admin').eq('id', user.id).single()
      if (!profile?.is_admin) { router.push('/user'); return }
      setUser(user)
      await fetchAll()
      setLoading(false)
    }
    init()
  }, [])

  if (loading) return <p style={{ padding: '40px', textAlign: 'center' }}>Loading...</p>

  const tabStyle = (tab: string) => ({
    padding: '8px 16px', borderRadius: '6px', border: 'none', fontSize: '13px',
    fontWeight: 500, cursor: 'pointer',
    background: activeTab === tab ? '#111' : '#f5f5f5',
    color: activeTab === tab ? '#fff' : '#555'
  })

  return (
    <>
      <Navbar isAdmin={true} />
      <main style={{ padding: '24px 16px', maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: 700, color: '#111', marginBottom: '4px' }}>
          Admin Dashboard
        </h1>
        <p style={{ color: '#888', marginBottom: '24px', fontSize: '14px' }}>Logged in as: {user?.email}</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '32px' }}>
          {[
            { label: 'Total Earnings', value: `UGX ${earnings.total.toFixed(2)}`, color: '#276749' },
            { label: 'This Month', value: `UGX ${earnings.thisMonth.toFixed(2)}`, color: '#2b6cb0' },
            { label: 'Pending Payouts', value: `UGX ${earnings.pending.toFixed(2)}`, color: '#c05621' },
          ].map(card => (
            <div key={card.label} style={{ background: '#fff', border: '1px solid #ececec', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
              <p style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>{card.label}</p>
              <p style={{ fontSize: '20px', fontWeight: 700, color: card.color }}>{card.value}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button style={tabStyle('bids')} onClick={() => setActiveTab('bids')}>
            Bids ({bids.filter((b: any) => b.status === 'pending').length} pending)
          </button>
          <button style={tabStyle('products')} onClick={() => setActiveTab('products')}>
            Products ({allProducts.length})
          </button>
          <button style={tabStyle('users')} onClick={() => setActiveTab('users')}>
            Users ({users.length})
          </button>
        </div>

        {activeTab === 'bids' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {bids.length === 0 && <p style={{ color: '#888' }}>No bids yet.</p>}
            {bids.map((bid: any) => {
              const commission = (bid.amount * 0.10).toFixed(2)
              const payout = (bid.amount * 0.90).toFixed(2)
              const seller = bid.profiles
              return (
                <div key={bid.id} style={{ background: '#fff', border: '1px solid #ececec', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, color: '#111', marginBottom: '4px' }}>{bid.products?.title || 'Product'}</p>
                      <p style={{ fontSize: '13px', color: '#888' }}>
                        Bid: <strong>UGX {bid.amount}</strong> · Your 10%: <strong style={{ color: '#276749' }}>UGX {commission}</strong> · Pay seller: <strong style={{ color: '#c05621' }}>UGX {payout}</strong>
                      </p>
                      <p style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>{new Date(bid.created_at).toLocaleString()}</p>
                      {bid.payment_ref && (
                        <p style={{ fontSize: '13px', marginTop: '8px', background: '#fffbeb', padding: '6px 10px', borderRadius: '6px', color: '#92400e' }}>
                          💳 Payment Ref: <strong>{bid.payment_ref}</strong>
                        </p>
                      )}
                      {bid.status === 'won' && (
                        <div style={{ marginTop: '8px', background: bid.payout_sent ? '#f0fff4' : '#fff5f5', border: `1px solid ${bid.payout_sent ? '#9ae6b4' : '#feb2b2'}`, borderRadius: '8px', padding: '10px' }}>
                          {bid.payout_sent ? (
                            <p style={{ fontSize: '12px', color: '#276749' }}>✅ Payout sent on {new Date(bid.payout_sent_at).toLocaleDateString()}</p>
                          ) : (
                            <>
                              <p style={{ fontSize: '12px', fontWeight: 600, color: '#c05621', marginBottom: '6px' }}>⚠️ Send UGX {payout} to seller:</p>
                              {seller?.phone_number ? (
                                <div style={{ fontSize: '13px', color: '#444', lineHeight: 1.8 }}>
                                  <p>📱 <strong>{seller.phone_provider} Money:</strong> {seller.phone_number}</p>
                                  <p>👤 <strong>Name:</strong> {seller.phone_name}</p>
                                  <p>📧 <strong>Email:</strong> {seller.email}</p>
                                </div>
                              ) : (
                                <p style={{ fontSize: '12px', color: '#e53e3e' }}>⚠️ Seller has not added mobile money details. Email: {seller?.email}</p>
                              )}
                            </>
                          )}
                        </div>
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
                          <button onClick={() => approveBid(bid)}
                            style={{ background: '#111', color: '#fff', padding: '6px 14px', borderRadius: '6px', border: 'none', fontSize: '12px', cursor: 'pointer' }}>
                            ✅ Approve
                          </button>
                          <button onClick={() => rejectBid(bid.id)}
                            style={{ background: '#fff5f5', color: '#e53e3e', padding: '6px 14px', borderRadius: '6px', border: '1px solid #feb2b2', fontSize: '12px', cursor: 'pointer' }}>
                            ❌ Reject
                          </button>
                        </div>
                      )}
                      {bid.status === 'won' && !bid.payout_sent && (
                        <button onClick={() => markPayoutSent(bid)}
                          style={{ background: '#f0fff4', color: '#276749', padding: '6px 14px', borderRadius: '6px', border: '1px solid #9ae6b4', fontSize: '12px', cursor: 'pointer' }}>
                          💸 Mark Payout Sent
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {activeTab === 'products' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {allProducts.length === 0 && <p style={{ color: '#888' }}>No products yet.</p>}
            {allProducts.map((p: any) => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '1px solid #ececec', borderRadius: '10px', padding: '16px' }}>
                <div>
                  <p style={{ fontWeight: 600, color: '#111', marginBottom: '4px' }}>{p.title}</p>
                  <p style={{ fontSize: '13px', color: '#888' }}>Original: UGX {p.original_price} · Min bid: UGX {p.min_bid}</p>
                </div>
                <span style={{
                  padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500,
                  background: p.status === 'active' ? '#f0fff4' : p.status === 'sold' ? '#ebf8ff' : '#fff5f5',
                  color: p.status === 'active' ? '#276749' : p.status === 'sold' ? '#2b6cb0' : '#e53e3e'
                }}>{p.status}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {users.length === 0 && <p style={{ color: '#888' }}>No users yet.</p>}
            {users.map((u: any) => (
              <div key={u.id} style={{ background: '#fff', border: '1px solid #ececec', borderRadius: '10px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <p style={{ fontWeight: 500, color: '#111', marginBottom: '4px' }}>{u.email}</p>
                    <p style={{ fontSize: '12px', color: '#aaa', marginBottom: '4px' }}>Joined: {new Date(u.created_at).toLocaleDateString()}</p>
                    {u.phone_number ? (
                      <p style={{ fontSize: '12px', color: '#555' }}>📱 {u.phone_provider}: {u.phone_number} — {u.phone_name}</p>
                    ) : (
                      <p style={{ fontSize: '12px', color: '#e53e3e' }}>⚠️ No mobile money details</p>
                    )}
                  </div>
                  <span style={{
                    padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500,
                    background: u.is_admin ? '#fefcbf' : '#f5f5f5',
                    color: u.is_admin ? '#744210' : '#555'
                  }}>{u.is_admin ? '🛡️ Admin' : 'User'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
