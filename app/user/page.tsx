'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase-client'
import Navbar from '@/components/Navbar'

export default function UserDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [bids, setBids] = useState<any[]>([])
  const [ownedProducts, setOwnedProducts] = useState<any[]>([])
  const [resalePrices, setResalePrices] = useState<{ [key: string]: string }>({})
  const [resaleMessages, setResaleMessages] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      const { data: profile } = await supabase
        .from('profiles').select('is_admin').eq('id', user.id).single()
      setIsAdmin(profile?.is_admin || false)

      // Fetch user bids
      const { data: bidsData } = await supabase
        .from('bids').select('*, products(title)').eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setBids(bidsData || [])

      // Fetch owned products
      const { data: owned } = await supabase
        .from('products').select('*').eq('owner_id', user.id)
      setOwnedProducts(owned || [])

      setLoading(false)
    }
    getUser()
  }, [])

  const listForResale = async (product: any) => {
    const price = parseFloat(resalePrices[product.id] || '0')
    if (!price || price <= product.purchase_price) {
      setResaleMessages({ ...resaleMessages, [product.id]: `Resale price must be higher than your purchase price ($${product.purchase_price})` })
      return
    }
    const commission = price * 0.10
    const yourPayout = price - commission

    await supabase.from('products').update({
      resale_price: price,
      status: 'resale',
      min_bid: price
    }).eq('id', product.id)

    setResaleMessages({ ...resaleMessages, [product.id]: `✅ Listed for $${price}! You'll receive $${yourPayout.toFixed(2)} after 10% commission.` })

    // Refresh owned products
    const { data: owned } = await supabase
      .from('products').select('*').eq('owner_id', user.id)
    setOwnedProducts(owned || [])
  }

  if (loading) return <p style={{ padding: '40px', textAlign: 'center' }}>Loading...</p>

  const activeBids = bids.filter(b => b.status === 'pending').length
  const wonBids = bids.filter(b => b.status === 'won').length

  return (
    <>
      <Navbar isAdmin={isAdmin} />
      <main style={{ padding: '24px 16px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: 700, color: '#111', marginBottom: '4px' }}>
          My Dashboard
        </h1>
        <p style={{ color: '#888', marginBottom: '24px', fontSize: '14px' }}>Welcome, {user?.email}</p>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '32px' }}>
          {[
            { label: 'Active Bids', value: activeBids },
            { label: 'Won Auctions', value: wonBids },
            { label: 'Products Owned', value: ownedProducts.length },
          ].map(card => (
            <div key={card.label} style={{ background: '#fafafa', border: '1px solid #ececec', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>{card.label}</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: '#111' }}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Owned Products */}
        {ownedProducts.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111', marginBottom: '16px' }}>🏷️ My Products</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {ownedProducts.map(p => {
                const resalePrice = parseFloat(resalePrices[p.id] || '0')
                const commission = resalePrice * 0.10
                const payout = resalePrice - commission
                return (
                  <div key={p.id} style={{ background: '#fff', border: '1px solid #ececec', borderRadius: '10px', padding: '16px' }}>
                    <p style={{ fontWeight: 600, color: '#111', marginBottom: '4px' }}>{p.title}</p>
                    <p style={{ fontSize: '13px', color: '#888', marginBottom: '8px' }}>Purchased for: ${p.purchase_price}</p>
                    <span style={{
                      fontSize: '12px', padding: '3px 8px', borderRadius: '20px',
                      background: p.status === 'active' ? '#fffbeb' : '#f0fff4',
                      color: p.status === 'active' ? '#b7791f' : '#276749'
                    }}>{p.status === 'active' ? '🔄 Listed for resale' : '📦 In your possession'}</span>

                    {p.status !== 'active' && (
                      <div style={{ marginTop: '12px' }}>
                        <p style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>List for resale (10% commission deducted):</p>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                          <input type="number" placeholder="Your resale price"
                            value={resalePrices[p.id] || ''}
                            onChange={e => setResalePrices({ ...resalePrices, [p.id]: e.target.value })}
                            style={{ flex: 1, padding: '8px 10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }} />
                          <button onClick={() => listForResale(p)}
                            style={{ background: '#111', color: '#fff', padding: '8px 14px', borderRadius: '6px', border: 'none', fontSize: '13px', cursor: 'pointer' }}>
                            List
                          </button>
                        </div>
                        {resalePrice > 0 && (
                          <p style={{ fontSize: '12px', color: '#666' }}>
                            You'll receive: <strong>${payout.toFixed(2)}</strong> (after 10% = ${commission.toFixed(2)} commission)
                          </p>
                        )}
                        {resaleMessages[p.id] && (
                          <p style={{ fontSize: '12px', marginTop: '6px', padding: '8px', borderRadius: '6px',
                            background: resaleMessages[p.id].startsWith('✅') ? '#f0fff4' : '#fff5f5',
                            color: resaleMessages[p.id].startsWith('✅') ? '#276749' : '#e53e3e' }}>
                            {resaleMessages[p.id]}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Recent Bids */}
        {bids.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111', marginBottom: '16px' }}>📋 My Bids</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {bids.map(bid => (
                <div key={bid.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa', border: '1px solid #ececec', borderRadius: '8px', padding: '12px' }}>
                  <div>
                    <p style={{ fontWeight: 500, fontSize: '14px', color: '#111' }}>{bid.products?.title || 'Product'}</p>
                    <p style={{ fontSize: '12px', color: '#888' }}>${bid.amount} · {new Date(bid.created_at).toLocaleDateString()}</p>
                  </div>
                  <span style={{
                    fontSize: '12px', padding: '4px 10px', borderRadius: '20px', fontWeight: 500,
                    background: bid.status === 'won' ? '#f0fff4' : bid.status === 'lost' ? '#fff5f5' : '#fffbeb',
                    color: bid.status === 'won' ? '#276749' : bid.status === 'lost' ? '#e53e3e' : '#b7791f'
                  }}>{bid.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isAdmin && (
          <div style={{ marginTop: '8px', padding: '16px', background: '#fafafa', border: '1px solid #ececec', borderRadius: '10px' }}>
            <p style={{ fontWeight: 600, color: '#111', marginBottom: '4px' }}>🛡️ Admin Access</p>
            <p style={{ fontSize: '13px', color: '#888' }}>Use the navbar to manage products and view transactions.</p>
          </div>
        )}

        <div style={{ marginTop: '24px' }}>
          <Link href="/products" style={{
            display: 'block', textAlign: 'center', background: '#111', color: '#fff',
            padding: '14px', borderRadius: '8px', textDecoration: 'none', fontWeight: 500, fontSize: '15px'
          }}>
            Browse & Bid on Products →
          </Link>
        </div>
      </main>
    </>
  )
}
