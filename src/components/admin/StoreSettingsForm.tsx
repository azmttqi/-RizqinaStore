'use client'

import { useState } from 'react'
import { updateStoreSettings } from '@/lib/actions/settings'
import { toast } from 'sonner'
import { Save, Loader2 } from 'lucide-react'

interface StoreSettingsFormProps {
  initialSettings: any
}

export default function StoreSettingsForm({ initialSettings }: StoreSettingsFormProps) {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    const result = await updateStoreSettings(formData)
    setLoading(false)

    if (result.success) {
      toast.success('Pengaturan toko berhasil diperbarui!')
    } else {
      toast.error('Gagal memperbarui pengaturan: ' + result.error)
    }
  }

  return (
    <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="form-group">
        <label htmlFor="name">Nama Toko</label>
        <input
          id="name"
          name="name"
          type="text"
          className="input"
          defaultValue={initialSettings?.store_name}
          required
          placeholder="Contoh: RizqinaStore"
        />
      </div>

      <div className="form-group">
        <label htmlFor="whatsapp">WhatsApp Admin (Format: 08xx / 62xx)</label>
        <input
          id="whatsapp"
          name="whatsapp"
          type="text"
          className="input"
          defaultValue={initialSettings?.store_whatsapp}
          required
          placeholder="Contoh: 081234567890"
        />
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Nomor ini akan digunakan untuk tombol "Tanya Admin" dan notifikasi.
        </p>
      </div>

      <div className="form-group">
        <label htmlFor="address">Alamat Toko / Titik Pengiriman</label>
        <textarea
          id="address"
          name="address"
          className="input"
          defaultValue={initialSettings?.store_address}
          rows={3}
          placeholder="Alamat lengkap toko untuk keperluan operasional"
        />
      </div>

      <div className="form-group">
        <label htmlFor="logo_url">URL Logo Toko (Opsional)</label>
        <input
          id="logo_url"
          name="logo_url"
          type="url"
          className="input"
          defaultValue={initialSettings?.store_logo_url}
          placeholder="https://example.com/logo.png"
        />
      </div>

      <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
          style={{ width: '100%', maxWidth: '200px' }}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save size={18} />
              Simpan Perubahan
            </>
          )}
        </button>
      </div>
    </form>
  )
}
