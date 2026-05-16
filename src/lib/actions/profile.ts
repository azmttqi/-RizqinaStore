'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface UpdateProfileData {
  full_name: string
  whatsapp: string
  address: string
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const full_name = formData.get('full_name') as string
  const whatsapp = formData.get('whatsapp') as string
  const address = formData.get('address') as string

  const { error } = await supabase
    .from('profiles')
    .update({ 
      full_name, 
      whatsapp, 
      address,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/settings')
  revalidatePath('/checkout')
  return { success: true }
}
