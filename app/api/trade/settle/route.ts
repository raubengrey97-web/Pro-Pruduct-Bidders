import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: Request){
  try{
    const { session_id } = await req.json()
    const { data, error } = await supabaseAdmin.rpc('process_trade_session', { p_session_id: session_id })
    if(error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true, data })
  }catch(e:any){
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
