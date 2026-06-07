'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import Navbar from '@/components/Navbar'

export default function Admin() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<any[]>([])

  const fetchTransactions = async () => {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
    setTransactions(data || [])
  }

  const approveTx = async (id: string) => {
    await supabase
      .from('transactions')
      .update({ status: 'confirmed' })
      .eq('id', id)
    fetchTransactions()
  }

  useEffect(() => {
    const fetchData = async () => {
      const { data: userData } = await supabase.auth.getUser()
      setUser(userData.user)
      if (userData.user?.user_metadata?.role === 'admin') {
        await fetchTransactions()
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) return <p style={{ padding: '40px', textAlign: 'center' }}>Loading...</p>
  if (!user) {
    router.push('/login')
    return null
  }
  if (user.user_metadata?.role !== 'admin') {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Access denied. You don't have admin permissions.</p>
      </div>
    )
  }

  return (
    <>
      <Navbar isAdmin={true} />
      <main style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: 700, color: '#111', marginBottom: '8px' }}>
          Admin Dashboard
        </h1>
        <p style={{ color: '#888', marginBottom: '32px' }}>Logged in as: {user.email}</p>

        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111', marginBottom: '16px' }}>Transactions</h2>
        {transactions.length === 0 ? (
          <p style={{ color: '#888' }}>No transactions yet</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '2px solid #ececec' }}>
                <th style={{ padding: '12px', textAlign: 'left', color: '#555' }}>TX Code</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#555' }}>Amount</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#555' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#555' }}>Date</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#555' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} style={{ borderBottom: '1px solid #ececec' }}>
                  <td style={{ padding: '12px' }}>{tx.tx_code}</td>
                  <td style={{ padding: '12px' }}>{tx.amount}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      background: tx.status === 'confirmed' ? '#f0fff4' : '#fffbeb',
                      color: tx.status === 'confirmed' ? '#276749' : '#b7791f',
                      padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500
                    }}>
                      {tx.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: '#888' }}>{new Date(tx.created_at).toLocaleString()}</td>
                  <td style={{ padding: '12px' }}>
                    {tx.status === 'pending' ? (
                      <button onClick={() => approveTx(tx.id)} style={{
                        background: '#111', color: '#fff', border: 'none',
                        padding: '6px 14px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer'
                      }}>
                        Approve
                      </button>
                    ) : (
                      <span style={{ color: '#888', fontSize: '13px' }}>✓ Confirmed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </>
  )
}
