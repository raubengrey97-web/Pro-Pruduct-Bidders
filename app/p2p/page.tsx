'use client'
import React, { useEffect, useState } from 'react'
import BottomNavbar from '@/components/BottomNavbar'
import PriceGraph from '@/components/PriceGraph'

export default function P2PPage(){
  const [side,setSide] = useState<'buy'|'sell'>('buy')
  const [arn,setArn] = useState(1)
  async function create(){
    const res = await fetch('/api/p2p/create',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({ side, arn_amount: arn })})
    const j = await res.json()
    alert(j?.error ?? 'Order created')
  }
  return (
    <>
      <main style={{padding:'24px',paddingBottom:120,maxWidth:900,margin:'0 auto'}}>
        <h1>P2P</h1>
        <PriceGraph />
        <div style={{background:'#fff',padding:12,borderRadius:8,border:'1px solid #eee',marginTop:12}}>
          <div>
            <button onClick={()=>setSide('buy')} style={{marginRight:8,background:side==='buy'?'#111':'#f5f5f5',color:side==='buy'?'#fff':'#333'}}>Buy</button>
            <button onClick={()=>setSide('sell')} style={{background:side==='sell'?'#111':'#f5f5f5',color:side==='sell'?'#fff':'#333'}}>Sell</button>
          </div>
          <div style={{marginTop:8}}>
            <label>ARN amount</label>
            <input type="number" value={arn} onChange={e=>setArn(Number(e.target.value))} />
          </div>
          <div style={{marginTop:8}}>
            <button onClick={create}>Create Order</button>
          </div>
        </div>
      </main>
      <BottomNavbar />
    </>
  )
}
