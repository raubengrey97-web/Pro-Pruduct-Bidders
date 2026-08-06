'use client'
import React from 'react'
import Link from 'next/link'

export default function BottomNavbar(){
  return (
    <nav style={{position:'fixed',bottom:0,left:0,right:0,height:72,display:'flex',justifyContent:'space-around',alignItems:'center',background:'#fff',borderTop:'1px solid #eee',padding:'10px env(safe-area-inset-left)  env(safe-area-inset-bottom)'}}>
      <Link href="/market">Market</Link>
      <Link href="/wallets">Wallets</Link>
      <Link href="/mining">Mining</Link>
      <Link href="/profile">Profile</Link>
      <Link href="/support">Support</Link>
    </nav>
  )
}
