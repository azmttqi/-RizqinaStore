'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function getProducts(includeInactive = false, search?: string) {
  const supabase = await createClient()
  let query = supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (!includeInactive) {
    query = query.eq('is_active', true)
  }

  if (search) {
    // Cari di nama atau deskripsi
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getProduct(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createProduct(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const file = formData.get('image') as File | null
  let imageUrl: string | null = null

  // Upload gambar ke Supabase Storage
  if (file && file.size > 0) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, file, { contentType: file.type })

    if (uploadError) {
      throw new Error(`Gagal upload gambar: ${uploadError.message}`)
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(uploadData.path)

    imageUrl = publicUrl
  }

  const variants = JSON.parse(formData.get('variants') as string || '[]')
  const stock = variants.length > 0 
    ? variants.reduce((acc: number, v: any) => acc + (v.stock || 0), 0)
    : parseInt(formData.get('stock') as string || '0', 10)

  const { error } = await supabase.from('products').insert({
    name: formData.get('name') as string,
    description: formData.get('description') as string || null,
    category: formData.get('category') as string || null,
    price: parseFloat(formData.get('price') as string),
    cost_price: parseFloat(formData.get('cost_price') as string || '0'),
    stock,
    image_url: imageUrl,
    is_active: formData.get('is_active') === 'true',
    is_preorder: formData.get('is_preorder') === 'true',
    preorder_days: formData.get('is_preorder') === 'true' ? parseInt(formData.get('preorder_days') as string, 10) : 0,
    variants,
  })

  if (error) throw new Error(`Gagal membuat produk: ${error.message}`)

  revalidatePath('/')
  revalidatePath('/admin/products')
  redirect('/admin/products')
}

export async function updateProduct(id: string, formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const file = formData.get('image') as File | null
  let imageUrl: string | undefined = undefined

  if (file && file.size > 0) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, file, { contentType: file.type })

    if (uploadError) {
      throw new Error(`Gagal upload gambar: ${uploadError.message}`)
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(uploadData.path)

    imageUrl = publicUrl
  }

  const variants = JSON.parse(formData.get('variants') as string || '[]')
  const stock = variants.length > 0 
    ? variants.reduce((acc: number, v: any) => acc + (v.stock || 0), 0)
    : parseInt(formData.get('stock') as string || '0', 10)

  const updateData: Record<string, unknown> = {
    name: formData.get('name') as string,
    description: formData.get('description') as string || null,
    category: formData.get('category') as string || null,
    price: parseFloat(formData.get('price') as string),
    cost_price: parseFloat(formData.get('cost_price') as string || '0'),
    stock,
    is_active: formData.get('is_active') === 'true',
    is_preorder: formData.get('is_preorder') === 'true',
    preorder_days: formData.get('is_preorder') === 'true' ? parseInt(formData.get('preorder_days') as string, 10) : 0,
    variants,
  }

  if (imageUrl !== undefined) {
    updateData.image_url = imageUrl
  }

  const { error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', id)

  if (error) throw new Error(`Gagal update produk: ${error.message}`)

  revalidatePath('/')
  revalidatePath('/admin/products')
  redirect('/admin/products')
}

export async function toggleProductStatus(id: string, currentStatus: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('products')
    .update({ is_active: !currentStatus })
    .eq('id', id)

  if (error) throw new Error(`Gagal mengubah status produk: ${error.message}`)

  revalidatePath('/')
  revalidatePath('/admin/products')
}

export async function updateOrderStatus(
  orderId: string,
  status: string,
  resi?: string,
  courier?: string
) {
  const supabase = await createClient()
  
  // Mapping paksa untuk memastikan tidak ada teks Indonesia yang masuk ke Enum DB
  const statusMap: Record<string, string> = {
    'Menunggu': 'pending',
    'Dikonfirmasi': 'confirmed',
    'Konfirmasi': 'confirmed',
    'Dikirim': 'shipped',
    'Kirim': 'shipped',
    'Sampai': 'delivered',
    'Terkirim': 'delivered',
    'Selesai': 'delivered',
    'Dibatalkan': 'cancelled',
    'Batal': 'cancelled'
  }

  // Jika status yang masuk ada di map (Bahasa Indonesia), konversi ke Inggris
  // Jika tidak ada di map, gunakan status asli (asumsi sudah Inggris)
  const finalStatus = statusMap[status] || status.toLowerCase()

  // Cek status saat ini terlebih dahulu untuk mencegah double-cancellation
  const { data: currentOrder, error: fetchError } = await supabase
    .from('orders')
    .select('order_status')
    .eq('id', orderId)
    .single()

  if (fetchError || !currentOrder) {
    throw new Error('Pesanan tidak ditemukan.')
  }

  if (currentOrder.order_status === finalStatus) {
    return // Tidak ada perubahan
  }

  const { error } = await supabase
    .from('orders')
    .update({ 
      order_status: finalStatus,
      shipping_resi: resi || null,
      shipping_courier: courier || null,
      shipped_at: finalStatus === 'shipped' ? new Date().toISOString() : undefined
    })
    .eq('id', orderId)

  if (error) {
    console.error('DB_UPDATE_ERROR:', error)
    throw new Error(`Gagal update status: ${error.message} (Value: ${finalStatus})`)
  }

  // Jika pesanan dibatalkan (dan sebelumnya bukan dibatalkan), kembalikan stok barang
  if (finalStatus === 'cancelled' && currentOrder.order_status !== 'cancelled') {
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', orderId)
      
    if (!itemsError && orderItems && orderItems.length > 0) {
      // Gunakan Promise.all untuk eksekusi yang lebih cepat
      await Promise.all(orderItems.map(async (item) => {
        // Ambil stok saat ini dengan query terpisah untuk akurasi
        const { data: product } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.product_id)
          .single()
          
        if (product) {
          return supabase
            .from('products')
            .update({ stock: product.stock + item.quantity })
            .eq('id', item.product_id)
        }
      }))
    }
  }

  revalidatePath('/admin/orders')
  revalidatePath('/admin/products')
  revalidatePath('/')
}

export async function deleteProduct(id: string) {
  const supabase = await createClient()

  // 1. Cek apakah ada order yang menggunakan produk ini
  const { count, error: countError } = await supabase
    .from('order_items')
    .select('*', { count: 'exact', head: true })
    .eq('product_id', id)

  if (countError) throw new Error('Gagal memeriksa riwayat produk.')

  if (count && count > 0) {
    return { 
      success: false, 
      error: 'Produk tidak bisa dihapus karena sudah pernah terjual. Silakan gunakan opsi "Nonaktifkan" agar produk tersembunyi dari toko.' 
    }
  }

  // 2. Hapus produk
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) throw new Error(`Gagal menghapus produk: ${error.message}`)

  revalidatePath('/admin/products')
  revalidatePath('/')
  return { success: true }
}
