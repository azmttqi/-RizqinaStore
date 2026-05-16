import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // Keamanan: Cek header Authorization untuk mencegah sembarang orang memicu cron
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const supabase = await createClient()
  
  // Tentukan batas waktu (misal: 7 hari yang lalu)
  const daysLimit = 7
  const dateLimit = new Date()
  dateLimit.setDate(dateLimit.getDate() - daysLimit)

  // 1. Cari pesanan yang statusnya 'shipped' dan sudah melewati batas waktu
  const { data: oldOrders, error: fetchError } = await supabase
    .from('orders')
    .select('id')
    .eq('order_status', 'shipped')
    .lt('shipped_at', dateLimit.toISOString())

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!oldOrders || oldOrders.length === 0) {
    return NextResponse.json({ message: 'Tidak ada pesanan yang perlu di-update.' })
  }

  // 2. Update semua pesanan tersebut menjadi 'delivered'
  const orderIds = oldOrders.map(o => o.id)
  const { error: updateError } = await supabase
    .from('orders')
    .update({ order_status: 'delivered' })
    .in('id', orderIds)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ 
    message: `Berhasil menyelesaikan ${orderIds.length} pesanan secara otomatis.`,
    updatedIds: orderIds
  })
}
