'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getStoreSettings() {
  const supabase = await createClient()
  const { data } = await supabase.from('store_settings').select('*').eq('id', 1).single()
  return data
}

export async function updateStoreSettings(formData: FormData) {
  const supabase = await createClient()
  
  const name = formData.get('name') as string
  const whatsapp = formData.get('whatsapp') as string
  const address = formData.get('address') as string
  const logo_url = formData.get('logo_url') as string

  const { error } = await supabase
    .from('store_settings')
    .update({
      store_name: name,
      store_whatsapp: whatsapp,
      store_address: address,
      store_logo_url: logo_url,
      updated_at: new Date().toISOString()
    })
    .eq('id', 1)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/settings')
  revalidatePath('/')
  return { success: true }
}
