'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'

export default function Admin() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const { data: userData } = await supabase.auth.getUser()
      setUser(userData.user)

      if (userData.user?.user_metadata?.role === 'admin') {
        const { data } = await supabase
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: false })
        setTransactions(data || [])
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) return <p>Loading...</p>
  if (!user) return <p>Please login first</p>
  if (user.user_metadata?.role !== 'admin') {
    return <p>Access denied. You don’t have admin permissions.</p>
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Admin Dashboard</h1>
      <p>Logged in as: {user.email}</p>
      <button onClick={() => supabase.auth.signOut()}>Logout</button>

      <h2 style={{ marginTop: '30px' }}>Transactions</h2>
      {transactions.length === 0 ? (
        <p>No transactions yet</p>
      ) : (
        <table border={1} cellPadding={8} style={{ borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr>
              <th>TX Code</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <td>{tx.tx_code}</td>
                <td>{tx.amount}</td>
                <td>{tx.status}</td>
                <td>{new Date(tx.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
          }
