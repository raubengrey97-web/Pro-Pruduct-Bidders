'use client'
import React, { useEffect, useState } from 'react'

export default function Countdown({endsAt}:{endsAt?:string}){
  const [now,setNow] = useState(Date.now())
  useEffect(()=>{
    const t = setInterval(()=>setNow(Date.now()),250)
    return ()=>clearInterval(t)
  },[])
  if(!endsAt) return <span>--</span>
  const diff = new Date(endsAt).getTime() - now
  if(diff<=0) return <span>0s</span>
  const s = Math.ceil(diff/1000)
  return <span>{s}s</span>
}
