'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import Navbar from '@/components/Navbar'

export default function Products() {
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [bidAmounts, setBidAmounts] = useState<{ [key: string]: string }>({})
  const [senderNumbers, setSenderNumbers] = useState<{ [key: string]: string }>({})
  const [sentAts, setSentAts] = useState<{ [key: string]: string }>({})
  const [messages, setMessages] = useState<{ [key: string]: string }>({})
  const [showPayment, setShowPayment] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      const { data: profile } = await supabase
        .from('profiles').select('is_admin').eq('id', user.id).single()
      setIsAdmin(profile?.is_admin || false)
      const { data } = await supabase
        .from('products')
        .select('*')
        .or('status.eq.active,status.eq.auction,status.eq.resale')
        .order('created_at', { ascending: false })
      setProducts(data || [])
      setLoading(false)
    }
    init()
  }, [])

  const placeBid = (product: any) => {
    const amount = parseFloat(bidAmounts[product.id] || '0')
    if (!amount || amount < product.min_bid) {
      setMessages({ ...messages, [product.id]: `Minimum bid is $${product.min_bid}` })
      return
    }
    setShowPayment({ ...showPayment, [product.id]: true })
    setMessages({ ...messages, [product.id]: '' })
  }

  const submitPaymentRef = async (product: any) => {
    const amount = parseFloat(bidAmounts[product.id] || '0')
    const senderNumber = senderNumbers[product.id]?.trim()
    const sentAt = sentAts[product.id]?.trim()

    if (!senderNumber) {
      setMessages({ ...messages, [product.id]: 'Please enter your phone number.' })
      return
    }
    if (!sentAt) {
      setMessages({ ...messages, [product.id]: 'Please enter the time sent.' })
      return
    }

    const { error } = await supabase.from('bids').insert({
      product_id: product.id,
      user_id: user.id,
      amount,
      sender_number: senderNumber,
      sent_at: sentAt,
      status: 'pending'
    })
    if (error) {
      setMessages({ ...messages, [product.id]: 'Error: ' + error.message })
    } else {
      const { data: adminProfiles } = await supabase
        .from('profiles').select('id').eq('is_admin', true)

      if (adminProfiles) {
        for (const admin of adminProfiles) {
          await supabase.from('notifications').insert({
            user_id: admin.id,
            title: 'New Bid Submitted',
            message: `A bid of $${amount} was placed on ${product.title}. Phone: ${senderNumber}, Time: ${sentAt}`,
            type: 'payment'
          })
        }
      }

      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'Bid Submitted Successfully',
        message: `Your bid of $${amount} on ${product.title} is pending admin verification.`,
        type: 'info'
      })

      setMessages({ ...messages, [product.id]: '✅ Bid submitted! Admin will verify your payment and confirm.' })
      setShowPayment({ ...showPayment, [product.id]: false })
      setBidAmounts({ ...bidAmounts, [product.id]: '' })
      setSenderNumbers({ ...senderNumbers, [product.id]: '' })
      setSentAts({ ...sentAts, [product.id]: '' })
    }
  }

  if (loading) return (
    <p style={{ padding: '40px', textAlign: 'center', color: '#1E3A8A', fontWeight: 600 }}>
      Loading...
    </p>
  )

  return (
    <>
      <Navbar isAdmin={isAdmin} />
      <main style={{ padding: '24px 16px 120px 16px', maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: 700, color: '#1E3A8A', marginBottom: '4px' }}>
          Live Auctions
        </h1>
        <p style={{ color: '#6B7280', marginBottom: '32px', fontSize: '14px' }}>
          Browse products, place a bid and pay to confirm
        </p>

        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px', color: '#6B7280', background: '#EFF6FF', borderRadius: '12px', border: '1px solid #BFDBFE' }}>
            <p style={{ fontSize: '18px', color: '#1E3A8A' }}>No active products yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {products.map(p => (
              <div key={p.id} style={{
                background: '#fff', border: '1px solid #BFDBFE',
                borderRadius: '12px', overflow: 'hidden',
                boxShadow: '0 1px 4px rgba(30,58,138,0.06)'
              }}>
                {p.photo_url ? (
                  <img src={p.photo_url} alt={p.title} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '140px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#BFDBFE', fontSize: '13px' }}>
                    No image
                  </div>
                )}
                <div style={{ padding: '16px' }}>
                  <h3 style={{ fontWeight: 700, fontSize: '16px', color: '#1E3A8A', marginBottom: '6px' }}>{p.title}</h3>
                  {p.description && (
                    <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '12px', lineHeight: 1.5 }}>{p.description}</p>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div>
                      <p style={{ fontSize: '11px', color: '#6B7280', marginBottom: '2px' }}>Original Price</p>
                      <p style={{ fontSize: '15px', fontWeight: 600, color: '#1E3A8A' }}>${p.original_price}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '11px', color: '#6B7280', marginBottom: '2px' }}>Min Bid</p>
                      <p style={{ fontSize: '15px', fontWeight: 700, color: '#F59E0B' }}>${p.min_bid}</p>
                    </div>
                  </div>
                  <p style={{ fontSize: '11px', color: '#6B7280', marginBottom: '12px' }}>
                    ⏱ {p.days_in_system} days · 💰 10% commission on resale
                  </p>

                  {messages[p.id] && (
                    <p style={{
                      fontSize: '12px', marginBottom: '10px', padding: '8px', borderRadius: '6px',
                      background: messages[p.id].startsWith('✅') ? '#D1FAE5' : '#fff5f5',
                      color: messages[p.id].startsWith('✅') ? '#065F46' : '#e53e3e'
                    }}>
                      {messages[p.id]}
                    </p>
                  )}

                  {!showPayment[p.id] && !messages[p.id]?.startsWith('✅') && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="number"
                        placeholder={`Min $${p.min_bid}`}
                        value={bidAmounts[p.id] || ''}
                        onChange={e => setBidAmounts({ ...bidAmounts, [p.id]: e.target.value })}
                        style={{ flex: 1, padding: '8px 10px', border: '1px solid #BFDBFE', borderRadius: '6px', fontSize: '13px' }}
                      />
                      <button onClick={() => placeBid(p)}
                        style={{ background: '#1E3A8A', color: '#fff', padding: '8px 16px', borderRadius: '6px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                        Bid
                      </button>
                    </div>
                  )}

                  {showPayment[p.id] && (
                    <div style={{ marginTop: '8px', background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: '10px', padding: '14px' }}>
                      <p style={{ fontWeight: 700, fontSize: '13px', color: '#92400E', marginBottom: '10px' }}>
                        💳 Pay <strong style={{ color: '#1E3A8A' }}>${bidAmounts[p.id]}</strong> to confirm your bid
                      </p>
                      <div style={{ background: '#fff', borderRadius: '8px', padding: '10px', marginBottom: '12px', border: '1px solid #BFDBFE' }}>
                        <p style={{ fontSize: '13px', color: '#1E3A8A', fontWeight: 600, marginBottom: '6px' }}>Send payment to:</p>
                        <p style={{ fontSize: '13px', color: '#444', lineHeight: 1.8 }}>
                          📱 <strong>Airtel Money:</strong> 0707021395 — Richard Njagala
                        </p>
                        <p style={{ fontSize: '13px', color: '#444', lineHeight: 1.8 }}>
                          📱 <strong>MTN MoMo:</strong> 0775077218 — Irene
                        </p>
                      </div>
                      <p style={{ fontSize: '12px', color: '#92400E', marginBottom: '8px', fontWeight: 500 }}>
                        📌 After paying, enter your phone number and time sent:
                      </p>
                      <input
                        type="tel"
                        placeholder="Phone number you sent from: 0701234567"
                        value={senderNumbers[p.id] || ''}
                        onChange={e => setSenderNumbers({ ...senderNumbers, [p.id]: e.target.value })}
                        style={{ width: '100%', padding: '8px 10px', border: '1px solid #BFDBFE', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', marginBottom: '8px' }}
                      />
                      <input
                        type="text"
                        placeholder="Time sent: e.g. 2:30 PM"
                        value={sentAts[p.id] || ''}
                        onChange={e => setSentAts({ ...sentAts, [p.id]: e.target.value })}
                        style={{ width: '100%', padding: '8px 10px', border: '1px solid #BFDBFE', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', marginBottom: '8px' }}
                      />
                      <button onClick={() => submitPaymentRef(p)}
                        style={{ width: '100%', background: '#1E3A8A', color: '#fff', padding: '10px', borderRadius: '6px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginBottom: '6px' }}>
                        ✅ Submit Payment Reference
                      </button>
                      <button onClick={() => setShowPayment({ ...showPayment, [p.id]: false })}
                        style={{ width: '100%', background: 'transparent', color: '#6B7280', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px', cursor: 'pointer' }}>
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
    }
