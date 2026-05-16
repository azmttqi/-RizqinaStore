import { getStoreSettings } from '@/lib/actions/settings'
import StoreSettingsForm from '../../../components/admin/StoreSettingsForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pengaturan Toko — Admin',
}

export default async function AdminSettingsPage() {
  const settings = await getStoreSettings()

  return (
    <div className="admin-container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
          Pengaturan Toko
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Kelola informasi dasar toko Anda di sini.
        </p>
      </div>

      <div className="card" style={{ maxWidth: '800px', padding: '2rem' }}>
        <StoreSettingsForm initialSettings={settings} />
      </div>
    </div>
  )
}
