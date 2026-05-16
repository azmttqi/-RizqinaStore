'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { CartItem } from '@/lib/types'

interface CheckoutData {
  consumerName: string
  consumerAddress: string
  consumerWhatsapp: string
  paymentMethod: 'cod' | 'qris'
  notes?: string
  items: CartItem[]
}

interface CheckoutResult {
  success: boolean
  orderId?: string
  snapToken?: string
  error?: string
}

export async function checkoutAction(data: CheckoutData): Promise<CheckoutResult> {
  const supabase = await createClient()

  // 1. Verifikasi user sudah login
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Anda harus login untuk melakukan checkout.' }
  }

  // 2. Validasi item tidak kosong
  if (!data.items || data.items.length === 0) {
    return { success: false, error: 'Keranjang belanja kosong.' }
  }

  // 3. Cek stok terbaru dari database (anti overselling)
  const productIds = data.items.map((item) => item.product.id)
  const { data: latestProducts, error: stockError } = await supabase
    .from('products')
    .select('id, name, stock, price, is_active')
    .in('id', productIds)

  if (stockError || !latestProducts) {
    return { success: false, error: 'Gagal memverifikasi stok produk.' }
  }

  // 4. Validasi setiap item
  for (const cartItem of data.items) {
    const freshProduct = latestProducts.find((p) => p.id === cartItem.product.id)

    if (!freshProduct) {
      return { success: false, error: `Produk "${cartItem.product.name}" tidak ditemukan.` }
    }

    if (!freshProduct.is_active) {
      return { success: false, error: `Produk "${freshProduct.name}" sudah tidak tersedia.` }
    }

    if (freshProduct.stock < cartItem.quantity) {
      return {
        success: false,
        error: `Stok "${freshProduct.name}" tidak mencukupi. Tersisa: ${freshProduct.stock} item.`,
      }
    }
  }

  // 5. Hitung total dengan harga terkini dari DB
  const totalAmount = data.items.reduce((total, cartItem) => {
    const freshProduct = latestProducts.find((p) => p.id === cartItem.product.id)!
    return total + freshProduct.price * cartItem.quantity
  }, 0)

  // 6. Buat order di database
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      consumer_name: data.consumerName,
      consumer_address: data.consumerAddress,
      consumer_whatsapp: data.consumerWhatsapp,
      payment_method: data.paymentMethod,
      payment_status: 'pending',
      order_status: 'pending',
      total_amount: totalAmount,
      notes: data.notes || null,
    })
    .select('id')
    .single()

  if (orderError || !order) {
    console.error('ORDER_CREATE_ERROR:', orderError)
    return { success: false, error: `Gagal membuat pesanan: ${orderError?.message || 'Unknown error'}` }
  }

  // 7. Insert order items
  const orderItems = data.items.map((cartItem) => {
    const freshProduct = latestProducts.find((p) => p.id === cartItem.product.id)!
    return {
      order_id: order.id,
      product_id: cartItem.product.id,
      quantity: cartItem.quantity,
      price_snapshot: freshProduct.price,
      product_name_snapshot: freshProduct.name,
    }
  })

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)

  if (itemsError) {
    console.error('ITEMS_INSERT_ERROR:', itemsError)
    // Rollback: hapus order yang sudah dibuat
    await supabase.from('orders').delete().eq('id', order.id)
    return { success: false, error: `Gagal menyimpan detail pesanan: ${itemsError.message}` }
  }

  // 8. Kurangi stok setiap produk (ATOMIC - hanya setelah order berhasil)
  // Kita gunakan adminClient untuk bypass RLS (karena consumer tidak punya hak akses update stok produk)
  const adminSupabase = await createAdminClient()
  for (const cartItem of data.items) {
    const freshProduct = latestProducts.find((p) => p.id === cartItem.product.id)!
    
    // Coba via RPC dulu
    const { error: rpcError } = await adminSupabase.rpc('decrement_stock', {
      product_id: cartItem.product.id,
      qty: cartItem.quantity,
    })

    if (rpcError) {
      console.warn('RPC decrement_stock failed, falling back to manual update:', rpcError.message)
      
      // Fallback: update langsung via admin client
      const { error: manualError } = await adminSupabase
        .from('products')
        .update({ stock: freshProduct.stock - cartItem.quantity })
        .eq('id', cartItem.product.id)

      if (manualError) {
        console.error('Manual stock update failed:', manualError)
        // Kita tidak batalkan order jika stok gagal update (untuk menghindari kegagalan total), 
        // tapi log ini sangat penting untuk admin.
      }
    }
  }

  // 9. INTEGRASI MIDTRANS
  let snapToken = undefined
  if (data.paymentMethod !== 'cod') {
    try {
      const { snap } = await import('@/lib/midtrans')
      
      const parameter = {
        transaction_details: {
          order_id: order.id,
          gross_amount: totalAmount,
        },
        customer_details: {
          first_name: data.consumerName,
          email: user.email,
          phone: data.consumerWhatsapp,
        },
        item_details: data.items.map(item => ({
          id: item.product.id,
          price: item.product.price,
          quantity: item.quantity,
          name: item.product.name.slice(0, 50),
        })),
      }

      const transaction = await snap.createTransaction(parameter)
      snapToken = transaction.token

      // Simpan snap token ke database untuk referensi nanti
      const { error: tokenError } = await supabase
        .from('orders')
        .update({ midtrans_token: snapToken })
        .eq('id', order.id)
      
      if (tokenError) {
        console.error('MIDTRANS_TOKEN_UPDATE_ERROR:', tokenError)
      }
        
    } catch (err) {
      console.error('MIDTRANS_ERROR:', err)
      // Kita tidak menghentikan flow jika Midtrans gagal, tapi kita log error-nya
    }
  }

  revalidatePath('/')
  revalidatePath('/admin/orders')

  // Kirim notifikasi ke Admin (Log/API)
  try {
    const { sendAdminNotification } = await import('@/lib/notifications')
    await sendAdminNotification({
      orderId: order.id,
      consumerName: data.consumerName,
      consumerAddress: data.consumerAddress,
      consumerWhatsapp: data.consumerWhatsapp,
      totalAmount: totalAmount,
      paymentMethod: data.paymentMethod,
      items: data.items.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price
      }))
    })
  } catch (err) {
    console.error('Notification Error:', err)
  }

  return { success: true, orderId: order.id, snapToken }
}

export async function confirmDeliveryAction(orderId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  // 1. Verifikasi pesanan ada dan statusnya 'shipped'
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('order_status, user_id')
    .eq('id', orderId)
    .single()

  if (fetchError || !order) {
    return { success: false, error: 'Pesanan tidak ditemukan.' }
  }

  if (order.order_status !== 'shipped') {
    return { success: false, error: 'Pesanan belum dikirim atau sudah selesai.' }
  }

  // 2. Update status ke delivered
  const { error } = await supabase
    .from('orders')
    .update({ order_status: 'delivered' })
    .eq('id', orderId)

  if (error) {
    return { success: false, error: 'Gagal mengonfirmasi pesanan.' }
  }

  revalidatePath('/admin/orders')
  revalidatePath('/')
  
  return { success: true }
}

export async function submitReviewAction(data: {
  orderId: string;
  productId: string;
  rating: number;
  comment: string;
  consumerName: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  // Ambil user ID jika ada (untuk keamanan RLS)
  const { data: { user } } = await supabase.auth.getUser()
  
  const { error } = await supabase
    .from('reviews')
    .insert({
      order_id: data.orderId,
      product_id: data.productId,
      rating: data.rating,
      comment: data.comment,
      consumer_name: data.consumerName,
      user_id: user?.id || null
    })

  if (error) {
    console.error('REVIEW_ERROR:', error)
    return { success: false, error: `Gagal mengirim ulasan: ${error.message}` }
  }

  // --- UPDATE STATISTIK PRODUK ---
  // 1. Ambil semua rating untuk produk ini
  const { data: allReviews } = await supabase
    .from('reviews')
    .select('rating')
    .eq('product_id', data.productId)

  if (allReviews && allReviews.length > 0) {
    const count = allReviews.length
    const average = allReviews.reduce((sum, r) => sum + r.rating, 0) / count

    // 2. Update kolom di tabel products
    await supabase
      .from('products')
      .update({
        avg_rating: average,
        review_count: count
      })
      .eq('id', data.productId)
  }

  revalidatePath(`/product/${data.productId}`)
  return { success: true }
}
