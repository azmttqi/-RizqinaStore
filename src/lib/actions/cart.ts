'use server'

import { createClient } from '@/lib/supabase/server'
import { CartItem } from '@/lib/types'

/**
 * Sinkronisasi keranjang lokal ke Supabase
 */
export async function syncCartToDB(items: CartItem[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('profiles')
    .update({ cart_data: items })
    .eq('id', user.id)

  if (error) return { error: error.message }
  return { success: true }
}

/**
 * Ambil keranjang dari Supabase
 */
export async function getCartFromDB() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('profiles')
    .select('cart_data')
    .eq('id', user.id)
    .single()

  if (error) return { error: error.message }
  return { items: (data.cart_data || []) as CartItem[] }
}
