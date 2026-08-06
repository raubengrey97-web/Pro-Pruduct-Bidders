'use client'
import React, { useEffect, useState } from 'react'
import BottomNavbar from '@/components/BottomNavbar'
import { supabase } from '@/lib/supabase-client'

export default function ProfilePage(){
  const [profile,setProfile] = useState<any>(null)
  useEffect(()=>{load()},[])
  async function load(){ const { data } = await supabase.from('profiles').select('*').single(); setProfile(data) }
  return (
    <>
      <main style={{padding:'24px',paddingBottom:120,maxWidth:900,margin:'0 auto'}}>
        <h1>Profile</h1>
        <div style={{background:'#fff',padding:12,borderRadius:8,border:'1px solid #eee'}}>
          <p><strong>Email:</strong> {profile?.email}</p>
          <p><strong>Secret ID:</strong> {profile?.secret_id}</p>
          <p><strong>Phone:</strong> {profile?.phone_number}</p>
          <p><strong>Name:</strong> {profile?.full_name}</p>
        </div>
      </main>
      <BottomNavbar />
    </>
  )
}
