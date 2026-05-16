import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminLayoutClient from '@/components/admin/AdminLayoutClient'
import { getStoreSettings } from '@/lib/actions/settings'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const [ { data: { user } }, settings ] = await Promise.all([
    supabase.auth.getUser(),
    getStoreSettings()
  ])

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/')
  }

  return (
    <AdminLayoutClient 
      profileName={profile.full_name || user.email || 'Admin'}
      storeName={settings?.store_name}
    >
      {children}
    </AdminLayoutClient>
  )
}
