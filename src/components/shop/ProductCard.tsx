'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Product } from '@/lib/types'
import { useCartStore } from '@/lib/store/cartStore'
import { formatRupiah } from '@/lib/utils'
import { ShoppingCart, Package, ImageOff, Star } from 'lucide-react'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore()
  const [imageError, setImageError] = useState(false)
  const supabase = createClient()
  const router = useRouter()

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

  async function handleAddToCart() {
    // Cek status login
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      toast.error('Silakan daftar atau login terlebih dahulu untuk belanja.')
      router.push('/login')
      return
    }

    if (product.stock === 0) {
      toast.error('Stok habis!')
      return
    }
    addItem(product)
    toast.success(`${product.name} ditambahkan ke keranjang!`, {
      icon: '🛒',
    })
  }

  return (
    <div
      className="card card-hover animate-fade-in"
      style={{
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
      }}
    >
      {/* Product Image & Title Link */}
      <Link href={`/product/${product.id}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div
          style={{
            position: 'relative',
            width: '100%',
            paddingTop: '75%', // 4:3 ratio
            background: 'var(--surface-2)',
            overflow: 'hidden',
          }}
        >
          {product.image_url && !imageError ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              style={{ objectFit: 'cover', transition: 'transform 0.3s ease' }}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onError={() => setImageError(true)}
            />
          ) : (
            <div
              style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: '0.5rem', color: 'var(--text-muted)',
              }}
            >
              <ImageOff size={32} strokeWidth={1.5} />
              <span style={{ fontSize: '0.75rem' }}>No Image</span>
            </div>
          )}

          {/* Stock Badge */}
          <div
            style={{
              position: 'absolute', top: '0.625rem', right: '0.625rem',
              background: stockBg,
              color: stockColor,
              borderRadius: '99px',
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.2rem 0.5rem',
              display: 'flex', alignItems: 'center', gap: '0.25rem',
            }}
          >
            <Package size={10} />
            {stockLevel === 'out' ? 'Habis' :
             stockLevel === 'low' ? `Sisa ${product.stock}` :
             `Stok ${product.stock}`}
          </div>
        </div>

        {/* Content Wrapper for Link */}
        <div style={{ padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(0.5rem, 2vw, 0.75rem) 0', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <h3
            className="product-title"
            style={{
              fontWeight: 600,
              color: 'var(--text-primary)',
              lineHeight: '1.2',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: '2.4em', // Consistent height for 2 lines
            }}
          >
            {product.name}
          </h3>
        </div>
      </Link>

      {/* Rest of Content */}
      <div style={{ padding: '0 clamp(0.5rem, 2vw, 0.75rem) clamp(0.5rem, 2vw, 0.75rem)', display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, justifyContent: 'flex-end' }}>

        {/* Rating & Sold Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <Star size={10} fill={product.avg_rating ? "var(--warning)" : "none"} color={product.avg_rating ? "var(--warning)" : "currentColor"} />
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
              {product.avg_rating?.toFixed(1) || '0.0'}
            </span>
          </div>
          <div style={{ width: '1px', height: '8px', background: 'var(--border)' }} />
          <span>Terjual {product.sales_count || 0}</span>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
          <p
            className="product-price"
            style={{
              fontWeight: 700,
              color: 'var(--primary)',
              fontFamily: 'Outfit, sans-serif',
              marginBottom: '0.5rem',
            }}
          >
            {formatRupiah(product.price)}
          </p>

          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="btn btn-primary btn-sm"
            style={{ width: '100%', padding: '0.5rem' }}
          >
            <ShoppingCart size={14} />
            <span className="md-inline">{product.stock === 0 ? 'Habis' : 'Beli'}</span>
            <span className="md-hidden">{product.stock === 0 ? 'Habis' : '+ Keranjang'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
