'use client'
import React from 'react'
import BottomNavbar from '@/components/BottomNavbar'

export default function SupportPage(){
  return (
    <>
      <main style={{padding:'24px',paddingBottom:120,maxWidth:900,margin:'0 auto'}}>
        <h1>Support & Announcements</h1>
        <div style={{background:'#fff',padding:12,borderRadius:8,border:'1px solid #eee'}}>
          <p>Use this page to send complaints and view announcements/payment proofs.</p>
        </div>
      </main>
      <BottomNavbar />
    </>
  )
}
