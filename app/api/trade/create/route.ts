import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: Request){
  try{
    const body = await req.json()
    const { session_id, amount, side } = body
    // server should verify user session; simplified here: use header user-id
    const userId = req.headers.get('x-user-id')
    if(!userId) return NextResponse.json({ error: 'missing user id header' }, { status: 400 })

    const { data, error } = await supabaseAdmin.rpc('create_trade', { p_user: userId, p_session: session_id, p_amount: amount, p_side: side })
    if(error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true, data })
  }catch(e:any){
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
