import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { User, Phone, MapPin, Save, ArrowLeft } from 'lucide-react'
import { updateProfile } from '@/lib/actions/profile'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pengaturan Akun — RizqinaStore',
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div
      style={{
        maxWidth: '640px',
        margin: '0 auto',
        padding: '2rem 1.5rem',
        minHeight: '80vh',
      }}
    >
      <div style={{ marginBottom: '2rem' }}>
        <Link
          href="/"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '1rem' }}
        >
          <ArrowLeft size={16} />
          Kembali ke Toko
        </Link>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Pengaturan Akun
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Atur informasi profil dan alamat pengiriman default Anda.
        </p>


      </div>

      {/* Profile Form */}
      <div className="card" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Informasi Pribadi</h2>
        <form action={updateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Nama Lengkap */}
          <div className="form-group">
            <label htmlFor="full_name" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={16} /> Nama Lengkap
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              className="input"
              defaultValue={profile?.full_name || ''}
              placeholder="Masukkan nama lengkap Anda"
              required
            />
          </div>

          {/* Nomor WhatsApp */}
          <div className="form-group">
            <label htmlFor="whatsapp" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Phone size={16} /> No. WhatsApp
            </label>
            <input
              id="whatsapp"
              name="whatsapp"
              type="tel"
              className="input"
              defaultValue={profile?.whatsapp || ''}
              placeholder="Contoh: 08123456789"
              required
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Digunakan untuk konfirmasi pesanan via WhatsApp.
            </p>
          </div>

          {/* Alamat Default */}
          <div className="form-group">
            <label htmlFor="address" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={16} /> Alamat Pengiriman Default
            </label>
            <textarea
              id="address"
              name="address"
              className="input"
              defaultValue={profile?.address || ''}
              placeholder="Masukkan alamat lengkap Anda (Jalan, No. Rumah, Kecamatan, Kota, Kode Pos)"
              rows={4}
              required
            />
          </div>

          <div className="divider" style={{ margin: '0.5rem 0' }} />

          <button type="submit" className="btn btn-primary btn-lg" style={{ justifyContent: 'center' }}>
            <Save size={18} />
            Simpan Perubahan
          </button>
        </form>

        <p
          style={{
            marginTop: '1.5rem',
            textAlign: 'center',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            lineHeight: '1.5',
          }}
        >
          💡 Alamat ini akan otomatis terisi saat Anda melakukan Checkout untuk mempercepat proses belanja.
        </p>
      </div>
    </div>
  )
}
