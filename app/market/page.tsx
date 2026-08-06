'use client'
import React, { useEffect, useState } from 'react'
import BottomNavbar from '@/components/BottomNavbar'
import Countdown from '@/components/Countdown'
import PriceGraph from '@/components/PriceGraph'

export default function MarketPage(){
  const [session,setSession] = useState<any>(null)
  const [amount,setAmount] = useState(1500)
  const [side,setSide] = useState<'rise'|'fall'>('rise')

  useEffect(()=>{
    // fetch current open session (simplified)
    fetch('/api/session/current').then(r=>r.json()).then(setSession).catch(()=>null)
  },[])

  async function place(){
    try{
      const res = await fetch('/api/trade/create',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({ session_id: session?.id, amount, side })})
      const j = await res.json()
      alert(j?.error??'Trade placed')
    }catch(e:any){alert(e.message)}
  }

  return (
    <>
      <main style={{padding:'24px',paddingBottom:120,maxWidth:900,margin:'0 auto'}}>
        <h1>Market</h1>
        <PriceGraph />
        <div style={{display:'flex',alignItems:'center',gap:12,marginTop:12}}>
          <div>Session ends in: <strong><Countdown endsAt={session?.ends_at} /></strong></div>
          <div style={{marginLeft:'auto'}}>{session?.status || 'no session'}</div>
        </div>

        <div style={{marginTop:18,background:'#fff',padding:12,borderRadius:8,border:'1px solid #eee'}}>
          <label style={{display:'block',fontSize:13}}>Amount (UGX)</label>
          <input type="number" value={amount} onChange={e=>setAmount(Number(e.target.value))} style={{padding:8,width:160}} />
          <div style={{marginTop:8}}>
            <button onClick={()=>setSide('rise')} style={{marginRight:8,background:side==='rise'?"#111":"#f5f5f5",color:side==='rise'?"#fff":"#333",padding:'8px 12px'}}>Rise</button>
            <button onClick={()=>setSide('fall')} style={{background:side==='fall'?"#111":"#f5f5f5",color:side==='fall'?"#fff":"#333",padding:'8px 12px'}}>Fall</button>
          </div>
          <div style={{marginTop:12}}>
            <button onClick={place} style={{background:'#276749',color:'#fff',padding:'10px 16px',borderRadius:8}}>Place Trade</button>
          </div>
        </div>
      </main>
      <BottomNavbar />
    </>
  )
}
