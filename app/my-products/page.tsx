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

  const fetchProducts = async (userId: string) => {
    const { data } = await supabase
      .from('products').select('*').eq('owner_id', userId)
      .order('held_since', { ascending: false })
    setProducts(data || [])
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      const { data: profile } = await supabase
        .from('profiles').select('is_admin').eq('id', user.id).single()
      setIsAdmin(profile?.is_admin || false)
      await fetchProducts(user.id)
      setLoading(false)
    }
    init()
  }, [])

  const listForResale = async (product: any) => {
    const price = parseFloat(resalePrices[product.id] || '0')
    const { minPrice } = calcMinResalePrice(product.purchase_price, product.held_since || product.created_at)
    const maxPrice = product.purchase_price + 2

    if (!price || price < minPrice) {
      setMessages({ ...messages, [product.id]: `❌ Minimum resale price is $${minPrice} (2% per day growth)` })
      return
    }
    if (price > maxPrice) {
      setMessages({ ...messages, [product.id]: `❌ Maximum resale price is $${maxPrice} (only $2 above purchase price)` })
      return
    }

    const commission = price * 0.10
    const payout = price - commission
    const { error } = await supabase.from('products').update({
      resale_price: price,
      status: 'resale',
      min_bid: price
    }).eq('id', product.id).eq('owner_id', user.id)

    if (error) {
      setMessages({ ...messages, [product.id]: `❌ Error: ${error.message}` })
      return
    }

    setMessages({ ...messages, [product.id]: `✅ Listed for $${price}! After 10% commission you'll receive $${payout.toFixed(2)}` })
    setResalePrices({ ...resalePrices, [product.id]: '' })
    await fetchProducts(user.id)
  }

  const unlist = async (product: any) => {
    const { error } = await supabase.from('products').update({
      status: 'owned',
      min_bid: null,
      resale_price: null
    }).eq('id', product.id).eq('owner_id', user.id)

    if (error) {
      setMessages({ ...messages, [product.id]: `❌ Error: ${error.message}` })
      return
    }

    await fetchProducts(user.id)
    setMessages({ ...messages, [product.id]: 'Product unlisted.' })
  }

  if (loading) return (
    <p style={{ padding: '40px', textAlign: 'center', color: '#1E3A8A', fontWeight: 600 }}>
      Loading...
    </p>
  )

  return (
    <>
      <Navbar isAdmin={isAdmin} />
      <main style={{ padding: '24px 16px 120px 16px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: 700, color: '#1E3A8A', marginBottom: '4px' }}>
          My Products
        </h1>
        <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '32px' }}>
          Products grow in value by <strong style={{ color: '#F59E0B' }}>2% per day</strong>. Max resale is <strong style={{ color: '#F59E0B' }}>$2 above</strong> your purchase price.
        </p>

        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280', background: '#EFF6FF', borderRadius: '12px', border: '1px solid #BFDBFE' }}>
            <p style={{ fontSize: '18px', marginBottom: '8px', color: '#1E3A8A' }}>No products yet</p>
            <p style={{ fontSize: '14px' }}>Win an auction to own your first product!</p>
            <button onClick={() => router.push('/products')}
              style={{ marginTop: '16px', background: '#1E3A8A', color: '#fff', padding: '10px 24px', borderRadius: '6px', border: 'none', fontSize: '14px', cursor: 'pointer', fontWeight: 500 }}>
              Browse Auctions
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {products.map(p => {
              const heldFrom = p.held_since || p.created_at
              const { days, minPrice } = calcMinResalePrice(p.purchase_price, heldFrom)
              const maxPrice = p.purchase_price + 2
              const resalePrice = parseFloat(resalePrices[p.id] || '0')
              const commission = resalePrice * 0.10
              const payout = resalePrice - commission
              const profit = payout - p.purchase_price
              const isListed = p.status === 'resale'
              const isOverMax = resalePrice > maxPrice
              const isUnderMin = resalePrice > 0 && resalePrice < minPrice

              return (
                <div key={p.id} style={{
                  background: '#fff', border: '1px solid #BFDBFE',
                  borderRadius: '12px', overflow: 'hidden',
                  boxShadow: '0 1px 4px rgba(30,58,138,0.06)'
                }}>
                  {p.photo_url && (
                    <img src={p.photo_url} alt={p.title} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                  )}
                  <div style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <h3 style={{ fontWeight: 700, fontSize: '16px', color: '#1E3A8A', marginBottom: '4px' }}>{p.title}</h3>
                        <p style={{ fontSize: '13px', color: '#6B7280' }}>
                          Purchased for: <strong style={{ color: '#F59E0B' }}>${p.purchase_price}</strong>
                        </p>
                      </div>
                      <span style={{
                        fontSize: '12px', padding: '4px 10px', borderRadius: '20px', fontWeight: 500, whiteSpace: 'nowrap',
                        background: isListed ? '#FEF3C7' : '#D1FAE5',
                        color: isListed ? '#92400E' : '#065F46'
                      }}>
                        {isListed ? '🔄 Listed' : '📦 Owned'}
                      </span>
                    </div>

                    <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', color: '#6B7280' }}>Days held</span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#1E3A8A' }}>{days} days</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', color: '#6B7280' }}>Min resale price</span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#065F46' }}>${minPrice.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', color: '#6B7280' }}>Max resale price</span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#F59E0B' }}>${maxPrice.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12px', color: '#6B7280' }}>Value growth</span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#065F46' }}>
                          +${(minPrice - p.purchase_price).toFixed(2)} (+{((minPrice - p.purchase_price) / p.purchase_price * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </div>

                    {messages[p.id] && (
                      <p style={{
                        fontSize: '12px', marginBottom: '12px', padding: '8px', borderRadius: '6px',
                        background: messages[p.id].startsWith('✅') ? '#D1FAE5' : '#fff5f5',
                        color: messages[p.id].startsWith('✅') ? '#065F46' : '#e53e3e'
                      }}>
                        {messages[p.id]}
                      </p>
                    )}

                    {isListed ? (
                      <div>
                        <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>
                          Listed at: <strong style={{ color: '#F59E0B' }}>${p.resale_price?.toLocaleString()}</strong>
                        </p>
                        <button onClick={() => unlist(p)}
                          style={{ width: '100%', background: '#fff5f5', color: '#e53e3e', padding: '10px', borderRadius: '6px', border: '1px solid #feb2b2', fontSize: '13px', cursor: 'pointer' }}>
                          Unlist Product
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>
                          Set resale price (min <strong style={{ color: '#1E3A8A' }}>${minPrice}</strong> · max <strong style={{ color: '#F59E0B' }}>${maxPrice}</strong>):
                        </p>
                        <input type="number"
                          placeholder={`$${minPrice} – $${maxPrice}`}
                          value={resalePrices[p.id] || ''}
                          min={minPrice}
                          max={maxPrice}
                          onChange={e => {
                            setResalePrices({ ...resalePrices, [p.id]: e.target.value })
                            setMessages({ ...messages, [p.id]: '' })
                          }}
                          style={{
                            width: '100%', padding: '10px', fontSize: '13px',
                            boxSizing: 'border-box', marginBottom: '6px',
                            border: `1px solid ${isOverMax || isUnderMin ? '#e53e3e' : '#BFDBFE'}`,
                            borderRadius: '6px'
                          }} />

                        {isOverMax && (
                          <p style={{ fontSize: '12px', color: '#e53e3e', marginBottom: '6px' }}>
                            ❌ Max allowed is ${maxPrice} (only $2 above purchase price)
                          </p>
                        )}
                        {isUnderMin && (
                          <p style={{ fontSize: '12px', color: '#e53e3e', marginBottom: '6px' }}>
                            ❌ Minimum price is ${minPrice} (2% daily growth)
                          </p>
                        )}

                        {resalePrice > 0 && !isOverMax && !isUnderMin && (
                          <div style={{ background: '#D1FAE5', padding: '10px', borderRadius: '6px', marginBottom: '8px', fontSize: '12px' }}>
                            <p style={{ color: '#065F46', marginBottom: '2px' }}>
                              💰 You receive: <strong style={{ color: '#F59E0B' }}>${payout.toFixed(2)}</strong>
                            </p>
                            <p style={{ color: '#6B7280' }}>After 10% commission (${commission.toFixed(2)})</p>
                            <p style={{ color: profit > 0 ? '#065F46' : '#e53e3e', marginTop: '4px' }}>
                              {profit > 0 ? '📈' : '📉'} Profit: <strong>${profit.toFixed(2)}</strong> vs your purchase
                            </p>
                          </div>
                        )}

                        <button onClick={() => listForResale(p)}
                          disabled={isOverMax || isUnderMin}
                          style={{
                            width: '100%', padding: '10px', borderRadius: '6px',
                            border: 'none', fontSize: '13px', fontWeight: 500,
                            cursor: isOverMax || isUnderMin ? 'not-allowed' : 'pointer',
                            background: isOverMax || isUnderMin ? '#6B7280' : '#1E3A8A',
                            color: '#fff'
                          }}>
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
