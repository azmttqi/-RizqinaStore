'use client'

import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export async function signInWithGoogle() {
  const supabase = createClient()
  
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) {
    toast.error(`Login Google gagal: ${error.message}`)
    return false
  }

  return true
}
