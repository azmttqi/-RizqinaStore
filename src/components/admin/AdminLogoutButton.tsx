'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { LogOut } from 'lucide-react'

export default function AdminLogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Berhasil keluar.')
    router.push('/')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="btn btn-ghost"
      style={{
        width: '100%', justifyContent: 'flex-start', fontSize: '0.875rem',
        gap: '0.625rem', padding: '0.5rem 0.75rem',
        color: 'var(--danger)', marginTop: '0.25rem',
      }}
    >
      <LogOut size={16} />
      Keluar
    </button>
  )
}
