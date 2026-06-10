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

    await supabase.from('notifications').insert({
      user_id: bid.user_id,
      title: '🎉 Bid Approved!',
      message: `Your bid of $${bid.amount} on ${bid.products?.title} was approved! The product is now yours.`,
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
        message: `Your bid of $${rejectedBid.amount} on ${rejectedBid.products?.title} was rejected. Payment not verified.`,
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
      message: `Your payout of $${(bid.amount * 0.90).toFixed(2)} has been sent to your mobile money account.`,
      type: 'payout'
    })

    fetchAll()
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } = await supabase.auth.getUser()
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

  if (loading) return <p style={{
