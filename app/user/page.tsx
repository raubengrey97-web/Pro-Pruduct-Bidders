'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [bids, setBids] = useState<any[]>([])
  const [bidAmount, setBidAmount] = useState('')

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      const { data: productsData } = await supabase
       .from('products')
       .select('*')
       .eq('status', 'active')
       .order('created_at', { ascending: false })
      setProducts(productsData || [])

      if (user) {
        const { data: bidsData } = await supabase
         .from('bids')
         .select('*')
         .eq('user_id', user.id)
         .order('created_at', { ascending: false })
        setBids(bidsData || [])
      }
    }
    fetchData()
  }, [user])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const placeBid = async (productId: string, minBid: number) => {
    if (!bidAmount || parseInt(bidAmount) < minBid) {
      alert(`Bid must be at least $${minBid}`)
      return
    }
    const { error } = await supabase.from('bids').insert([{
      product_id: productId,
      user_id: user.id,
      amount: parseInt(bidAmount)
    }])
    if (error) alert(error.message)
    else {
      alert('Bid placed!')
      setBidAmount('')
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>User Dashboard</h1>
      {user && <p>Welcome {user.email}</p>}
      <button onClick={handleLogout}>Logout</button>

      <h2 style={{ marginTop: '40px' }}>Browse Products</h2>
      {products.length === 0? (
        <div style={{ padding: '20px', border: '1px dashed #ccc', borderRadius: '8px' }}>
          <p>No active products yet.</p>
          <p style={{ fontSize: '14px', color: '#666' }}>
            Check back soon or ask an admin to add products.
          </p>
        </div>
      ) : (
        products.map(p => (
          <div key={p.id} style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '15px', borderRadius: '8px' }}>
            <h3>{p.title}</h3>
            {p.photo_url && <img src={p.photo_url} alt={p.title} width="200" style={{ borderRadius: '4px' }} />}
            <p><strong>Starting price:</strong> ${p.original_price}</p>
            <p><strong>Min bid:</strong> ${p.min_bid}</p>
            <p><strong>Days left:</strong> {p.days_in_system}</p>

            <div style={{ marginTop: '10px' }}>
              <input
                type="number"
                placeholder={`Min $${p.min_bid}`}
                value={bidAmount}
                onChange={e => setBidAmount(e.target.value)}
                style={{ marginRight: '10px', padding: '5px' }}
              />
              <button onClick={() => placeBid(p.id, p.min_bid)}>Place Bid</button>
            </div>
          </div>
        ))
      )}

      <h2 style={{ marginTop: '40px' }}>Your Bids</h2>
      {bids.length === 0? (
        <p>You haven’t placed any bids yet.</p>
      ) : (
        bids.map(b => (
          <div key={b.id} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
            <p>Bid: ${b.amount} - Status: {b.status || 'Pending'}</p>
          </div>
        ))
      )}
    </div>
  )
      }
