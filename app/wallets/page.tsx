'use client'
import React, { useEffect, useState } from 'react'
import BottomNavbar from '@/components/BottomNavbar'
import { supabase } from '@/lib/supabase-client'

export default function WalletsPage(){
  const [profile,setProfile] = useState<any>(null)
  useEffect(()=>{load()},[])
  async function load(){ const { data } = await supabase.from('profiles').select('*').single(); setProfile(data) }
  return (
    <>
      <main style={{padding:'24px',paddingBottom:120,maxWidth:900,margin:'0 auto'}}>
        <h1>Wallets</h1>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12}}>
          <div style={{background:'#fff',padding:12,borderRadius:8,border:'1px solid #eee'}}>
            <p>G-Wallet</p>
            <p style={{fontWeight:700}}>UGX {profile?.g_wallet_balance ?? '0.00'}</p>
          </div>
          <div style={{background:'#fff',padding:12,borderRadius:8,border:'1px solid #eee'}}>
            <p>M-Wallet (ARN)</p>
            <p style={{fontWeight:700}}>{profile?.m_wallet_balance ?? '0.000000'}</p>
          </div>
        </div>
      </main>
      <BottomNavbar />
    </>
  )
}
