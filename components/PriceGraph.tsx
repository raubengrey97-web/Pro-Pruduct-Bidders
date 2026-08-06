'use client'
import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'

export default function PriceGraph(){
  const [data,setData] = useState<{x:string,y:number}[]>([])
  useEffect(()=>{fetchData(); const t = setInterval(fetchData,5000); return ()=>clearInterval(t)},[])
  async function fetchData(){
    const { data } = await supabase.from('arn_price_history').select('*').order('recorded_at',{ascending:true}).limit(200)
    if(data) setData(data.map((d:any)=>({ x: d.recorded_at, y: Number(d.price_ugx) })))
  }
  return (
    <div style={{height:180,background:'#fff',border:'1px solid #ececec',borderRadius:8,padding:12}}>
      <p style={{fontSize:12,color:'#666'}}>Arncoin price (latest {data.length})</p>
      <div style={{height:120,display:'flex',alignItems:'center',justifyContent:'center',color:'#999'}}>Graph placeholder</div>
    </div>
  )
}
