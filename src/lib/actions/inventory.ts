'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addInventoryLogAction(data: {
  productId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  costPrice?: number;
  note?: string;
}) {
  const supabase = await createClient()

  // 1. Simpan log riwayat
  const { error: logError } = await supabase
    .from('inventory_logs')
    .insert({
      product_id: data.productId,
      type: data.type,
      quantity: data.quantity,
      cost_price: data.costPrice,
      note: data.note
    })

  if (logError) {
    console.error('INVENTORY_LOG_ERROR:', logError)
    return { success: false, error: 'Gagal mencatat riwayat inventori.' }
  }

  // 2. Ambil stok saat ini untuk dikalkulasi
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('stock')
    .eq('id', data.productId)
    .single()

  if (fetchError || !product) {
    return { success: false, error: 'Produk tidak ditemukan.' }
  }

  // 3. Kalkulasi stok baru
  // IN = Menambah, OUT = Mengurangi, ADJUSTMENT = Bisa + atau - tergantung input quantity
  let newStock = product.stock + data.quantity
  if (data.type === 'OUT' && data.quantity > 0) {
    newStock = product.stock - data.quantity
  }

  // 4. Update tabel produk (Stok & Harga Modal terbaru jika ada)
  const updateData: any = { stock: newStock }
  if (data.costPrice) {
    updateData.original_price = data.costPrice
  }

  const { error: updateError } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', data.productId)

  if (updateError) {
    return { success: false, error: 'Gagal memperbarui stok produk.' }
  }

  revalidatePath('/admin/products')
  revalidatePath(`/product/${data.productId}`)
  
  return { success: true, newStock }
}

export async function getInventoryLogs(productId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('inventory_logs')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}
