'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import Navbar from '@/components/Navbar'

export default function AdminProducts() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    title: '', description: '', photo_url: '',
    original_price: '', min_bid: '', days_in_system: '30'
  })

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profile } = await supabase
        .from('profiles').select('is_admin').eq('id', user.id).single()
      if (!profile?.is_admin) { router.push('/user'); return }
      setIsAdmin(true)
      await fetchProducts()
      setLoading(false)
    }
    init()
  }, [])

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products').select('*').order('created_at', { ascending: false })
    setProducts(data || [])
  }

  const handleSubmit = async () => {
    if (!form.title || !form.original_price || !form.min_bid) {
      setMessage('Please fill in title, original price and minimum bid.')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('products').insert({
      title: form.title,
      description: form.description,
      photo_url: form.photo_url,
      original_price: parseFloat(form.original_price),
      min_bid: parseFloat(form.min_bid),
      days_in_system: parseInt(form.days_in_system),
      status: 'active'
    })
    if (error) {
      setMessage('Error: ' + error.message)
    } else {
      setMessage('✅ Product added successfully!')
      setForm({ title: '', description: '', photo_url: '', original_price: '', min_bid: '', days_in_system: '30' })
      await fetchProducts()
    }
    setSaving(false)
  }

  const deleteProduct = async (id: string) => {
    await supabase.from('products').delete().eq('id', id)
    await fetchProducts()
  }

  const activateProduct = async (id: string) => {
    await supabase.from('products')
      .update({ status: 'auction' })
      .eq('id', id)
    await fetchProducts()
  }

  const deactivateProduct = async (id: string) => {
    await supabase.from('products')
      .update({ status: 'active' })
      .eq('id', id)
    await fetchProducts()
  }

  if (loading) return <p style={{ padding: '40px', textAlign: 'center' }}>Loading...</p>

  const inputStyle = {
    width: '100%', padding: '10px 12px', border: '1px solid #ddd',
    borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' as const
  }
  const labelStyle = { fontSize: '13px', fontWeight: 500, color: '#444', display: 'block', marginBottom: '6px' }

  return (
    <>
      <Navbar isAdmin={true} />
      <main style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: 700, color: '#111', marginBottom: '8px' }}>
          Manage Products
        </h1>
        <p style={{ color: '#888', marginBottom: '40px' }}>Add and manage products available for bidding</p>

        {/* Add Product Form */}
        <div style={{ background: '#fafafa', border: '1px solid #ececec', borderRadius: '12px', padding: '32px', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', color: '#111' }}>Add New Product</h2>

          {message && (
            <p style={{ marginBottom: '16px', padding: '10px', borderRadius: '6px', fontSize: '13px',
              background: message.startsWith('✅') ? '#f0fff4' : '#fff5f5',
              color: message.startsWith('✅') ? '#276749' : '#e53e3e' }}>
              {message}
            </p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Product Title *</label>
              <input style={inputStyle} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. iPhone 15 Pro" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Description</label>
              <textarea style={{ ...inputStyle, height: '80px', resize: 'vertical' }}
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the product..." />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Photo URL</label>
              <input style={inputStyle} value={form.photo_url} onChange={e => setForm({ ...form, photo_url: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <label style={labelStyle}>Original Price ($) *</label>
              <input style={inputStyle} type="number" value={form.original_price} onChange={e => setForm({ ...form, original_price: e.target.value })} placeholder="0.00" />
            </div>
            <div>
              <label style={labelStyle}>Minimum Bid ($) *</label>
              <input style={inputStyle} type="number" value={form.min_bid} onChange={e => setForm({ ...form, min_bid: e.target.value })} placeholder="0.00" />
            </div>
            <div>
              <label style={labelStyle}>Days in System</label>
              <input style={inputStyle} type="number" value={form.days_in_system} onChange={e => setForm({ ...form, days_in_system: e.target.value })} />
            </div>
          </div>

          <button onClick={handleSubmit} disabled={saving}
            style={{ marginTop: '24px', background: '#111', color: '#fff', padding: '12px 28px', borderRadius: '6px', border: 'none', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
            {saving ? 'Adding...' : '+ Add Product'}
          </button>
        </div>

        {/* Products List */}
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#111' }}>
          All Products ({products.length})
        </h2>
        {products.length === 0 ? (
          <p style={{ color: '#888' }}>No products yet. Add your first one above.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {products.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#fff', border: '1px solid #ececec', borderRadius: '10px', padding: '16px' }}>
                {p.photo_url && <img src={p.photo_url} alt={p.title} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px' }} />}
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, color: '#111', marginBottom: '4px' }}>{p.title}</p>
                  <p style={{ fontSize: '13px', color: '#888' }}>Original: ${p.original_price} · Min bid: ${p.min_bid} · {p.days_in_system} days</p>
                </div>
                <span style={{
                  padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500,
                  background: p.status === 'active' ? '#f0fff4' : '#fff5f5',
                  color: p.status === 'active' ? '#276749' : '#e53e3e'
                }}>{p.status}</span>
                
                {p.status === 'auction' && !p.owner_id && (
                  <button
                    onClick={() => deactivateProduct(p.id)}
                    style={{ padding: '6px 12px', background: '#fee', color: '#c53030', border: '1px solid #fcc', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    Deactivate
                  </button>
                )}

                {p.status !== 'auction' && !p.owner_id && (
                  <button
                    onClick={() => activateProduct(p.id)}
                    style={{ padding: '6px 12px', background: '#f0fff4', color: '#276749', border: '1px solid #c6f6d5', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    Activate
                  </button>
                )}

                {p.owner_id && (
                  <span style={{ fontSize: '12px', color: '#888' }}>
                    Owned by user
                  </span>
                )}

                <button onClick={() => deleteProduct(p.id)}
                  style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: '#fff5f5', color: '#e53e3e', fontSize: '12px', cursor: 'pointer' }}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
       }
