'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function submitReview(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const orderId = formData.get('order_id') as string
  const productIds = formData.getAll('product_id') as string[]
  
  const reviews = productIds.map(productId => {
    const rating = parseInt(formData.get(`rating_${productId}`) as string, 10)
    const comment = formData.get(`comment_${productId}`) as string
    
    return {
      user_id: user.id,
      order_id: orderId,
      product_id: productId,
      rating,
      comment: comment || null
    }
  })

  const { error } = await supabase
    .from('reviews')
    .insert(reviews)

  if (error) {
    if (error.code === '23505') {
       throw new Error('Anda sudah memberikan ulasan untuk pesanan ini.')
    }
    throw new Error(error.message)
  }

  revalidatePath('/')
  revalidatePath(`/orders`)
  
  redirect('/orders?review_success=true')
}
