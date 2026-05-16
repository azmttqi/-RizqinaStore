import { getProducts } from '@/lib/actions/products'
import ProductCard from '@/components/shop/ProductCard'
import RealtimeStockProvider from '@/components/shop/RealtimeStockProvider'
import { ShoppingBag, Zap, Shield, Truck, SearchX } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Katalog Produk — RizqinaStore',
  description: 'Temukan produk UMKM berkualitas dengan harga terjangkau.',
}

// Revalidate setiap 60 detik (Realtime akan trigger lebih cepat)
export const revalidate = 60

export default async function Home({ 
  searchParams 
}: { 
  searchParams: Promise<{ search?: string }> 
}) {
  const { search } = await searchParams
  const products = await getProducts(false, search)
  const error = null // getProducts throws on error, or we can wrap it

  const features = [
    { icon: <Shield size={20} />, label: 'Terpercaya', desc: 'Produk berkualitas terjamin' },
    { icon: <Truck size={20} />, label: 'COD Tersedia', desc: 'Bayar saat barang tiba' },
    { icon: <Zap size={20} />, label: 'Proses Cepat', desc: 'Pesanan diproses hari yang sama' },
  ]

  return (
    <>
      {/* Realtime listener (client component) */}
      <RealtimeStockProvider />

      {/* Hero Section */}
      <section
        style={{
          background: 'radial-gradient(ellipse 100% 80% at 50% -20%, rgba(108,99,255,0.2) 0%, transparent 60%), var(--background)',
          padding: 'clamp(3rem, 10vh, 5rem) 1.25rem clamp(2rem, 8vh, 4rem)',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <div
            className="badge badge-primary"
            style={{ marginBottom: '1rem', fontSize: '0.75rem' }}
          >
            <ShoppingBag size={12} style={{ marginRight: '4px' }} />
            Produk UMKM Lokal
          </div>

          <h1
            style={{
              fontSize: 'clamp(1.75rem, 8vw, 3.5rem)',
              fontWeight: 800,
              lineHeight: 1.1,
              marginBottom: '1rem',
              color: 'var(--text-primary)',
            }}
          >
            Belanja Produk
            <br />
            <span
              style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, #9B8BFF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Berkualitas Tinggi
            </span>
          </h1>

          <p style={{ 
            fontSize: 'clamp(0.9rem, 3vw, 1.05rem)', 
            color: 'var(--text-secondary)', 
            lineHeight: 1.5, 
            marginBottom: '2rem',
            maxWidth: '540px',
            marginInline: 'auto'
          }}>
            Temukan pilihan produk terbaik dari UMKM lokal. Harga bersaing,
            kualitas terjamin, dan dukungan langsung via WhatsApp.
          </p>

          {/* Feature Pills */}
          <div
            style={{
              display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            {features.map((f) => (
              <div
                key={f.label}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  padding: '0.4rem 0.875rem',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '99px',
                  fontSize: '0.75rem', color: 'var(--text-secondary)',
                }}
              >
                <span style={{ color: 'var(--primary)' }}>{f.icon}</span>
                <strong style={{ color: 'var(--text-primary)' }}>{f.label}</strong>
                <span className="hidden-mobile">· {f.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
        {/* Section Header */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '2rem',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              Semua Produk
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {products?.length || 0} produk tersedia
            </p>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div
            style={{
              padding: '2rem', textAlign: 'center',
              background: 'var(--danger-light)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 'var(--radius)', color: 'var(--danger)',
            }}
          >
            Gagal memuat produk. Silakan refresh halaman.
          </div>
        )}

        {/* Empty State */}
        {!error && (!products || products.length === 0) && (
          <div
            style={{
              padding: '5rem 2rem', textAlign: 'center',
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
            }}
          >
            {search ? (
              <>
                <SearchX size={56} strokeWidth={1} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                <h3 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Produk tidak ditemukan
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                  Tidak ada hasil untuk kata kunci "{search}". Coba kata kunci lain.
                </p>
                <a href="/" className="btn btn-secondary btn-sm">Hapus Pencarian</a>
              </>
            ) : (
              <>
                <ShoppingBag size={56} strokeWidth={1} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                <h3 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Belum ada produk
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Admin belum menambahkan produk apapun.
                </p>
              </>
            )}
          </div>
        )}

        {/* Product Grid */}
        {products && products.length > 0 && (
          <div className="product-grid">
            {products.map((product, idx) => (
              <div
                key={product.id}
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
