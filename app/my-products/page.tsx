'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import Navbar from '@/components/Navbar'

export default function MyProducts() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<any[]>([])
  const [resalePrices, setResalePrices] = useState<{ [key: string]: string }>({})
  const [messages, setMessages] = useState<{ [key: string]: string }>({})

  const calcMinResalePrice = (purchasePrice: number, heldSince: string) => {
    const days = Math.floor((Date.now() - new Date(heldSince).getTime()) / (1000 * 60 * 60 * 24))
    const minPrice = purchasePrice * Math.pow(1.02, days)
    return { days, minPrice: parseFloat(minPrice.toFixed(2)) }
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      const { data: profile } = await supabase
        .from('profiles').select('is_admin').eq('id', user.id).single()
      setIsAdmin(profile?.is_admin || false)
      const { data } = await supabase
        .from('products').select('*').eq('owner_id', user.id)
        .order('held_since', { ascending: false })
      setProducts(data || [])
      setLoading(false)
    }
    init()
  }, [])

  const listForResale = async (product: any) => {
    const price = parseFloat(resalePrices[product.id] || '0')
    const { minPrice } = calcMinResalePrice(product.purchase_price, product.held_since || product.created_at)
    if (!price || price < minPrice) {
      setMessages({ ...messages, [product.id]: `Minimum resale price is $${minPrice} (2% per day growth)` })
      return
    }
    const commission = price * 0.10
    const payout = price - commission
    await supabase.from('products').update({
      resale_price: price,
      status: 'resale',
      min_bid: price
    }).eq('id', product.id)
    setMessages({ ...messages, [product.id]: `✅ Listed for $${price}! After 10% commission you'll receive $${payout.toFixed(2)}` })
    const { data } = await supabase
      .from('products').select('*').eq('owner_id', user.id)
    setProducts(data || [])
  }

  const unlist = async (product: any) => {
    await supabase.from('products').update({ status: 'sold', min_bid: product.purchase_price }).eq('id', product.id)
    const { data } = await supabase.from('products').select('*').eq('owner_id', user.id)
    setProducts(data || [])
    setMessages({ ...messages, [product.id]: 'Product unlisted.' })
  }

  if (loading) return <p style={{ padding: '40px', textAlign: 'center' }}>Loading...</p>

  return (
    <>
      <Navbar isAdmin={isAdmin} />
      <main style={{ padding: '24px 16px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: 700, color: '#111', marginBottom: '4px' }}>
          My Products
        </h1>
        <p style={{ color: '#888', fontSize: '14px', marginBottom: '32px' }}>
          Products grow in value by <strong>2% per day</strong>. List for resale anytime above the minimum price.
        </p>

        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#888', background: '#fafafa', borderRadius: '12px', border: '1px solid #ececec' }}>
            <p style={{ fontSize: '18px', marginBottom: '8px' }}>No products yet</p>
            <p style={{ fontSize: '14px' }}>Win an auction to own your first product!</p>
            <button onClick={() => router.push('/products')}
              style={{ marginTop: '16px', background: '#111', color: '#fff', padding: '10px 24px', borderRadius: '6px', border: 'none', fontSize: '14px', cursor: 'pointer' }}>
              Browse Auctions
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {products.map(p => {
              const heldFrom = p.held_since || p.created_at
              const { days, minPrice } = calcMinResalePrice(p.purchase_price, heldFrom)
              const resalePrice = parseFloat(resalePrices[p.id] || '0')
              const commission = resalePrice * 0.10
              const payout = resalePrice - commission
              const profit = payout - p.purchase_price
              const isListed = p.status === 'active'

              return (
                <div key={p.id} style={{ background: '#fff', border: '1px solid #ececec', borderRadius: '12px', overflow: 'hidden' }}>
                  {p.photo_url && <img src={p.photo_url} alt={p.title} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />}
                  <div style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <h3 style={{ fontWeight: 700, fontSize: '16px', color: '#111', marginBottom: '4px' }}>{p.title}</h3>
                        <p style={{ fontSize: '13px', color: '#888' }}>Purchased for: <strong>${p.purchase_price}</strong></p>
                      </div>
                      <span style={{
                        fontSize: '12px', padding: '4px 10px', borderRadius: '20px', fontWeight: 500, whiteSpace: 'nowrap',
                        background: isListed ? '#fffbeb' : '#f0fff4',
                        color: isListed ? '#b7791f' : '#276749'
                      }}>
                        {isListed ? '🔄 Listed' : '📦 Owned'}
                      </span>
                    </div>

                    {/* Value growth info */}
                    <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', color: '#888' }}>Days held</span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#111' }}>{days} days</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', color: '#888' }}>Current min resale</span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#276749' }}>${minPrice.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12px', color: '#888' }}>Value growth</span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#276749' }}>
                          +${(minPrice - p.purchase_price).toFixed(2)} (+{((minPrice - p.purchase_price) / p.purchase_price * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </div>

                    {messages[p.id] && (
                      <p style={{ fontSize: '12px', marginBottom: '12px', padding: '8px', borderRadius: '6px',
                        background: messages[p.id].startsWith('✅') ? '#f0fff4' : '#fff5f5',
                        color: messages[p.id].startsWith('✅') ? '#276749' : '#e53e3e' }}>
                        {messages[p.id]}
                      </p>
                    )}

                    {isListed ? (
                      <div>
                        <p style={{ fontSize: '13px', color: '#888', marginBottom: '8px' }}>
                          Listed at: <strong>${p.resale_price?.toLocaleString()}</strong>
                        </p>
                        <button onClick={() => unlist(p)}
                          style={{ width: '100%', background: '#fff5f5', color: '#e53e3e', padding: '10px', borderRadius: '6px', border: '1px solid #feb2b2', fontSize: '13px', cursor: 'pointer' }}>
                          Unlist Product
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>
                          Set your resale price (min ${minPrice.toLocaleString()}):
                        </p>
                        <input type="number"
                          placeholder={`Min $${minPrice.toLocaleString()}`}
                          value={resalePrices[p.id] || ''}
                          onChange={e => setResalePrices({ ...resalePrices, [p.id]: e.target.value })}
                          style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', marginBottom: '8px' }} />
                        {resalePrice > 0 && (
                          <div style={{ background: '#f0fff4', padding: '10px', borderRadius: '6px', marginBottom: '8px', fontSize: '12px' }}>
                            <p style={{ color: '#276749', marginBottom: '2px' }}>💰 You receive: <strong>${payout.toFixed(2)}</strong></p>
                            <p style={{ color: '#888' }}>After 10% commission (${commission.toFixed(2)})</p>
                            <p style={{ color: profit > 0 ? '#276749' : '#e53e3e', marginTop: '4px' }}>
                              {profit > 0 ? '📈' : '📉'} Profit: <strong>${profit.toFixed(2)}</strong> vs your purchase
                            </p>
                          </div>
                        )}
                        <button onClick={() => listForResale(p)}
                          style={{ width: '100%', background: '#111', color: '#fff', padding: '10px', borderRadius: '6px', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                          List for Resale
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </>
  )
    }
