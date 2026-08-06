import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: Request){
  try{
    const body = await req.json()
    const { offer_id } = body
    const userId = req.headers.get('x-user-id')
    if(!userId) return NextResponse.json({ error: 'missing user id header' }, { status: 400 })
    const { data, error } = await supabaseAdmin.rpc('rent_mining_offer', { p_user: userId, p_offer: offer_id })
    if(error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true, data })
  }catch(e:any){
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
