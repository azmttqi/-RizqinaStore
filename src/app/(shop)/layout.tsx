import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getStoreSettings } from '@/lib/actions/settings'
import Navbar from '@/components/shop/Navbar'

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const [ { data: authData }, settings ] = await Promise.all([
    supabase.auth.getUser(),
    getStoreSettings()
  ])

  let profile = null
  if (authData?.user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()
    profile = data
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Suspense fallback={<div style={{ height: '64px', borderBottom: '1px solid var(--border)' }} />}>
        <Navbar profile={profile} />
      </Suspense>
      <main>{children}</main>
      <footer
        style={{
          borderTop: '1px solid var(--border)',
          background: 'var(--surface)',
          padding: '4rem 1.5rem',
          color: 'var(--text-secondary)',
          marginTop: '4rem',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '3rem', textAlign: 'left' }}>
          {/* Brand & Address */}
          <div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '1.25rem', fontFamily: 'Outfit, sans-serif' }}>
              {settings?.store_name || 'RizqinaStore'}
            </h3>
            {settings?.store_address && (
              <div style={{ fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Alamat Toko</p>
                <p>{settings.store_address}</p>
              </div>
            )}
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '1.25rem', fontSize: '1rem' }}>Hubungi Kami</h4>
            <p style={{ fontSize: '0.9rem' }}>
              WhatsApp: <a href={`https://wa.me/${settings?.store_whatsapp?.replace(/\D/g, '')}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>{settings?.store_whatsapp || '081234567890'}</a>
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '1.25rem', fontSize: '1rem' }}>Layanan</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
              <span>Bisa COD</span>
              <span>Garansi 100% Ori</span>
              <span>Dukungan UMKM Lokal</span>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: '1200px', margin: '3rem auto 0', paddingTop: '2rem', borderTop: '1px solid var(--border)', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <p>© {new Date().getFullYear()} {settings?.store_name || 'RizqinaStore'} · Dibuat dengan ❤️ untuk UMKM Indonesia</p>
        </div>
      </footer>
    </div>
  )
}
