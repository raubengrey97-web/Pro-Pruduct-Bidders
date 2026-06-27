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

      const { data: bidsData } = await supabase
        .from('bids').select('*, products(title)').eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setBids(bidsData || [])

      const { data: owned } = await supabase
        .from('products').select('*').eq('owner_id', user.id)
      setOwnedProducts(owned || [])

      setLoading(false)
    }
    getUser()
  }, [])

  const listForResale = async (product: any) => {
    const price = parseFloat(resalePrices[product.id] || '0')
    const minPrice = product.purchase_price
    const maxPrice = product.purchase_price + 2

    if (!price || price < minPrice) {
      setResaleMessages({ ...resaleMessages, [product.id]: `❌ Resale price must be at least $${minPrice}` })
      return
    }
    if (price > maxPrice) {
      setResaleMessages({ ...resaleMessages, [product.id]: `❌ Maximum resale price is $${maxPrice} (only $2 above purchase price)` })
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

    const { data: owned } = await supabase
      .from('products').select('*').eq('owner_id', user.id)
    setOwnedProducts(owned || [])
  }

  if (loading) return (
    <p style={{ padding: '40px', textAlign: 'center', color: '#1E3A8A', fontWeight: 600 }}>
      Loading...
    </p>
  )

  const activeBids = bids.filter(b => b.status === 'pending').length
  const wonBids = bids.filter(b => b.status === 'won').length

  return (
    <>
      <Navbar isAdmin={isAdmin} />
      <main style={{ padding: '24px 16px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: 700, color: '#1E3A8A', marginBottom: '4px' }}>
          My Dashboard
        </h1>
        <p style={{ color: '#6B7280', marginBottom: '24px', fontSize: '14px' }}>
          Welcome, {user?.email}
        </p>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '32px' }}>
          {[
            { label: 'Active Bids', value: activeBids },
            { label: 'Won Auctions', value: wonBids },
            { label: 'Products Owned', value: ownedProducts.length },
          ].map(card => (
            <div key={card.label} style={{
              background: '#fff', border: '1px solid #BFDBFE',
              borderRadius: '10px', padding: '16px', textAlign: 'center',
              boxShadow: '0 1px 4px rgba(30,58,138,0.08)'
            }}>
              <p style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>{card.label}</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: '#1E3A8A' }}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Owned Products */}
        {ownedProducts.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1E3A8A', marginBottom: '16px' }}>
              🏷️ My Products
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {ownedProducts.map(p => {
                const resalePrice = parseFloat(resalePrices[p.id] || '0')
                const commission = resalePrice * 0.10
                const payout = resalePrice - commission
                const maxResale = p.purchase_price + 2
                const isOverMax = resalePrice > maxResale
                const isUnderMin = resalePrice > 0 && resalePrice < p.purchase_price

                return (
                  <div key={p.id} style={{
                    background: '#fff', border: '1px solid #BFDBFE',
                    borderRadius: '10px', padding: '16px',
                    boxShadow: '0 1px 4px rgba(30,58,138,0.06)'
                  }}>
                    <p style={{ fontWeight: 600, color: '#1E3A8A', marginBottom: '4px' }}>{p.title}</p>
                    <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>
                      Purchased for: <strong style={{ color: '#F59E0B' }}>${p.purchase_price}</strong>
                    </p>
                    <span style={{
                      fontSize: '12px', padding: '3px 10px', borderRadius: '20px', fontWeight: 500,
                      background: p.status === 'resale' ? '#FEF3C7' : '#D1FAE5',
                      color: p.status === 'resale' ? '#92400E' : '#065F46'
                    }}>
                      {p.status === 'resale' ? '🔄 Listed for resale' : '📦 In your possession'}
                    </span>

                    {p.status !== 'resale' && p.status !== 'active' && (
                      <div style={{ marginTop: '12px' }}>
                        {/* Price range info */}
                        <div style={{
                          background: '#EFF6FF', border: '1px solid #BFDBFE',
                          borderRadius: '8px', padding: '10px', marginBottom: '10px'
                        }}>
                          <p style={{ fontSize: '12px', color: '#1E3A8A', fontWeight: 600, marginBottom: '2px' }}>
                            💰 Resale price range:
                          </p>
                          <p style={{ fontSize: '12px', color: '#6B7280' }}>
                            Min: <strong style={{ color: '#1E3A8A' }}>${p.purchase_price}</strong> ·
                            Max: <strong style={{ color: '#F59E0B' }}>${maxResale}</strong>
                            <span style={{ color: '#6B7280' }}> (only $2 above purchase)</span>
                          </p>
                        </div>

                        <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>
                          List for resale (10% commission deducted):
                        </p>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                          <input
                            type="number"
                            placeholder={`$${p.purchase_price} – $${maxResale}`}
                            value={resalePrices[p.id] || ''}
                            min={p.purchase_price}
                            max={maxResale}
                            onChange={e => {
                              setResalePrices({ ...resalePrices, [p.id]: e.target.value })
                              setResaleMessages({ ...resaleMessages, [p.id]: '' })
                            }}
                            style={{
                              flex: 1, padding: '8px 10px', fontSize: '13px',
                              border: `1px solid ${isOverMax || isUnderMin ? '#e53e3e' : '#BFDBFE'}`,
                              borderRadius: '6px'
                            }}
                          />
                          <button onClick={() => listForResale(p)}
                            style={{
                              background: isOverMax || isUnderMin ? '#6B7280' : '#1E3A8A',
                              color: '#fff', padding: '8px 14px',
                              borderRadius: '6px', border: 'none', fontSize: '13px',
                              cursor: isOverMax || isUnderMin ? 'not-allowed' : 'pointer',
                              fontWeight: 500
                            }}>
                            List
                          </button>
                        </div>

                        {/* Live validation feedback */}
                        {isOverMax && (
                          <p style={{ fontSize: '12px', color: '#e53e3e', marginBottom: '4px' }}>
                            ❌ Max allowed is ${maxResale} (only $2 above purchase price)
                          </p>
                        )}
                        {isUnderMin && (
                          <p style={{ fontSize: '12px', color: '#e53e3e', marginBottom: '4px' }}>
                            ❌ Price must be at least ${p.purchase_price}
                          </p>
                        )}

                        {resalePrice > 0 && !isOverMax && !isUnderMin && (
                          <p style={{ fontSize: '12px', color: '#1E3A8A' }}>
                            You'll receive: <strong style={{ color: '#F59E0B' }}>${payout.toFixed(2)}</strong>
                            <span style={{ color: '#6B7280' }}> (after 10% = ${commission.toFixed(2)} commission)</span>
                          </p>
                        )}

                        {resaleMessages[p.id] && (
                          <p style={{
                            fontSize: '12px', marginTop: '6px', padding: '8px', borderRadius: '6px',
                            background: resaleMessages[p.id].startsWith('✅') ? '#D1FAE5' : '#fff5f5',
                            color: resaleMessages[p.id].startsWith('✅') ? '#065F46' : '#e53e3e'
                          }}>
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
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1E3A8A', marginBottom: '16px' }}>
              📋 My Bids
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {bids.map(bid => (
                <div key={bid.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: '#fff', border: '1px solid #BFDBFE',
                  borderRadius: '8px', padding: '12px 16px',
                  boxShadow: '0 1px 3px rgba(30,58,138,0.05)'
                }}>
                  <div>
                    <p style={{ fontWeight: 500, fontSize: '14px', color: '#1E3A8A' }}>
                      {bid.products?.title || 'Product'}
                    </p>
                    <p style={{ fontSize: '12px', color: '#6B7280' }}>
                      ${bid.amount} · {new Date(bid.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span style={{
                    fontSize: '12px', padding: '4px 10px', borderRadius: '20px', fontWeight: 500,
                    background: bid.status === 'won' ? '#D1FAE5' : bid.status === 'lost' ? '#fff5f5' : '#FEF3C7',
                    color: bid.status === 'won' ? '#065F46' : bid.status === 'lost' ? '#e53e3e' : '#92400E'
                  }}>{bid.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isAdmin && (
          <div style={{
            marginTop: '8px', padding: '16px',
            background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px'
          }}>
            <p style={{ fontWeight: 600, color: '#1E3A8A', marginBottom: '4px' }}>🛡️ Admin Access</p>
            <p style={{ fontSize: '13px', color: '#6B7280' }}>
              Use the bottom bar to manage products and view transactions.
            </p>
          </div>
        )}

        <div style={{ marginTop: '24px' }}>
          <Link href="/products" style={{
            display: 'block', textAlign: 'center',
            background: '#1E3A8A', color: '#fff',
            padding: '14px', borderRadius: '8px',
            textDecoration: 'none', fontWeight: 600, fontSize: '15px',
            boxShadow: '0 2px 8px rgba(30,58,138,0.3)'
          }}>
            Browse & Bid on Products →
          </Link>
        </div>
      </main>
    </>
  )
    }
