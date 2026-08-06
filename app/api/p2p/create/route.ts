import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: Request){
  try{
    const body = await req.json()
    const { side, arn_amount } = body
    const userId = req.headers.get('x-user-id')
    if(!userId) return NextResponse.json({ error: 'missing user id header' }, { status: 400 })
    // compute ugx value from latest arn price
    const q = await supabaseAdmin.from('arn_price_history').select('price_ugx').order('recorded_at',{ascending:false}).limit(1).maybeSingle()
    const price = q.data?.price_ugx ?? 0
    const ugx = Number(price) * Number(arn_amount)
    const expires = new Date(Date.now() + 24*60*60*1000).toISOString()
    const { error } = await supabaseAdmin.from('p2p_orders').insert([{ user_id: userId, provided_secret_id: '***', side, arn_amount: arn_amount, ugx_value: ugx, expires_at: expires }])
    if(error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true })
  }catch(e:any){
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
