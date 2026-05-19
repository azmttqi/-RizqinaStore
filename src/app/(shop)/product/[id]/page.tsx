import { getProduct } from '@/lib/actions/products'
import { formatRupiah } from '@/lib/utils'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Star, Package, Shield, Truck, Zap, ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'
import AddToCartButton from '@/components/shop/AddToCartButton'
import ProductShareButton from '@/components/shop/ProductShareButton'
import ProductReviews, { Review } from '@/components/shop/ProductReviews'
import { getWhatsAppURL } from '@/lib/utils'
import { getStoreSettings } from '@/lib/actions/settings'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params
  try {
    const product = await getProduct(params.id)
    return {
      title: `${product.name} — RizqinaStore`,
      description: product.description || `Beli ${product.name} dengan harga terbaik di RizqinaStore.`,
    }
  } catch {
    return {
      title: 'Produk Tidak Ditemukan — RizqinaStore',
    }
  }
}

export default async function ProductDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const supabase = await createClient()
  let product;
  let reviews: Review[] = [];
  let settings;
  
  try {
    product = await getProduct(params.id)
    settings = await getStoreSettings()
    const { data } = await supabase.from('reviews').select('*').eq('product_id', params.id).order('created_at', { ascending: false })
    if (data) reviews = data
  } catch (error) {
    notFound()
  }

  if (!product || !product.is_active) {
    notFound()
  }

  const stockLevel =
    product.stock === 0 ? 'out' :
    product.stock <= 5 ? 'low' :
    product.stock <= 20 ? 'medium' : 'high'

  const stockColor =
    stockLevel === 'out' ? 'var(--danger)' :
    stockLevel === 'low' ? 'var(--danger)' :
    stockLevel === 'medium' ? 'var(--warning)' : 'var(--success)'

  const stockBg =
    stockLevel === 'out' ? 'var(--danger-light)' :
    stockLevel === 'low' ? 'var(--danger-light)' :
    stockLevel === 'medium' ? 'var(--warning-light)' : 'var(--success-light)'

  return (
    <main style={{ paddingBottom: '6rem' }}>
      <div style={{ maxWidth: '1200px', margin: '2rem auto 0', padding: '0 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'start' }}>
          
          {/* Product Image Section */}
          <div>
            <div
              style={{
                position: 'relative',
                width: '100%',
                paddingTop: '100%', // 1:1 Square ratio for product detail
                background: 'var(--surface-2)',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid var(--border)',
              }}
            >
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  style={{ objectFit: 'contain', padding: '1rem' }}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  Tidak ada gambar
                </div>
              )}
            </div>
            
            {/* Guarantee Badges & Share */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <Shield size={18} color="var(--primary)" />
                  <span>Garansi 100% Ori</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <Truck size={18} color="var(--primary)" />
                  <span>Bisa COD</span>
                </div>
              </div>
              
              <ProductShareButton productName={product.name} productDescription={product.description || ''} />
            </div>
          </div>

          {/* Product Info Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                <span className="badge badge-primary">UMKM Pilihan</span>
                {product.is_preorder && (
                  <span className="badge" style={{ background: 'var(--primary)', color: 'white' }}>
                    📦 Pre-Order (PO: {product.preorder_days || 7} Hari)
                  </span>
                )}
              </div>
              
              <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: '0.5rem' }}>
                {product.name}
              </h1>

              {/* Stats */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--warning)', fontWeight: 600, fontSize: '0.9rem' }}>
                  <Star size={16} fill="currentColor" />
                  <span>{product.avg_rating?.toFixed(1) || '0.0'}</span>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({product.review_count || 0} Penilaian)</span>
                </div>
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--border)' }} />
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Terjual <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{product.sales_count}</span>
                </span>
              </div>
            </div>

            <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Pengaturan Pembelian</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Ketersediaan Stok</span>
                <div
                  style={{
                    background: stockBg,
                    color: stockColor,
                    borderRadius: '99px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    padding: '0.3rem 0.75rem',
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                  }}
                >
                  <Package size={14} />
                  {stockLevel === 'out' ? 'Habis' : stockLevel === 'low' ? `Sisa ${product.stock} (Segera Habis!)` : `Tersedia ${product.stock} pcs`}
                </div>
              </div>
              
              <AddToCartButton product={product} size="lg" />
              
              <a 
                href={getWhatsAppURL(settings?.store_whatsapp || '081234567890', `Halo Admin, saya tertarik dengan produk ${product.name}. Apakah stoknya masih tersedia?`)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  border: '2px solid #25D366', color: '#25D366', background: 'transparent',
                  fontWeight: 600, padding: '0.75rem', borderRadius: '8px', textDecoration: 'none',
                  marginTop: '0.5rem', transition: 'all 0.2s'
                }}
              >
                Tanya Admin via WhatsApp
              </a>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem' }}>
                Deskripsi Produk
              </h2>
              <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>
                {product.description || 'Tidak ada deskripsi untuk produk ini.'}
              </div>
            </div>

            <ProductReviews reviews={reviews} />
          </div>
        </div>
      </div>
    </main>
  )
}
