import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status
    } = body

    // 1. Verifikasi Signature Key (Keamanan)
    // Formula: SHA512(order_id + status_code + gross_amount + server_key)
    const serverKey = process.env.MIDTRANS_SERVER_KEY!
    const hashed = crypto
      .createHash('sha512')
      .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
      .digest('hex')

    if (hashed !== signature_key) {
      return NextResponse.json({ message: 'Invalid signature' }, { status: 403 })
    }

    // 2. Hubungkan ke Supabase (Admin Client/Service Role untuk bypass RLS)
    const supabase = await createAdminClient()

    // 3. Tentukan status pesanan berdasarkan notifikasi Midtrans
    let paymentStatus = 'pending'
    let orderStatus = 'pending'

    if (transaction_status === 'settlement' || transaction_status === 'capture') {
      if (fraud_status === 'challenge') {
        paymentStatus = 'pending'
      } else {
        paymentStatus = 'paid'
        orderStatus = 'confirmed'
      }
    } else if (transaction_status === 'pending') {
      paymentStatus = 'pending'
    } else if (transaction_status === 'deny' || transaction_status === 'expire' || transaction_status === 'cancel') {
      paymentStatus = 'failed'
      orderStatus = 'cancelled'
    }

    // 4. Update Database
    const { error } = await supabase
      .from('orders')
      .update({
        payment_status: paymentStatus,
        order_status: orderStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', order_id)

    if (error) {
      console.error('DB_UPDATE_ERROR:', error)
      return NextResponse.json({ message: 'Failed to update order' }, { status: 500 })
    }

    return NextResponse.json({ message: 'OK' })
  } catch (err) {
    console.error('WEBHOOK_ERROR:', err)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
