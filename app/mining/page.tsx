'use client'
import React, { useEffect, useState } from 'react'
import BottomNavbar from '@/components/BottomNavbar'
import { supabase } from '@/lib/supabase-client'

export default function MiningPage(){
  const [offers,setOffers] = useState<any[]>([])
  useEffect(()=>{load()},[])
  async function load(){ const { data } = await supabase.from('mining_offers').select('*').order('created_at',{ascending:false}); setOffers(data||[]) }
  async function rent(id:string){
    const res = await fetch('/api/mining/rent',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({ offer_id: id })})
    const j = await res.json()
    alert(j?.error ?? 'Rent requested')
  }
  return (
    <>
      <main style={{padding:'24px',paddingBottom:120,maxWidth:900,margin:'0 auto'}}>
        <h1>Mining</h1>
        <div style={{display:'grid',gridTemplateColumns:'1fr',gap:12}}>
          {offers.map(o=> (
            <div key={o.id} style={{background:'#fff',border:'1px solid #eee',padding:12,borderRadius:8}}>
              <div style={{display:'flex',justifyContent:'space-between'}}>
                <div>
                  <p style={{fontWeight:600}}>{o.name}</p>
                  <p style={{fontSize:13,color:'#666'}}>{o.arn_per_hour} ARN/hr · {o.duration_hours} hrs</p>
                </div>
                <div>
                  <p style={{fontWeight:700}}>UGX {o.price_ugx}</p>
                  <button onClick={()=>rent(o.id)} style={{marginTop:8}}>Rent</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
      <BottomNavbar />
    </>
  )
}
