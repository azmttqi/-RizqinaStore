'use client'

import { useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import { Product, ProductVariant } from '@/lib/types'
import { useCartStore } from '@/lib/store/cartStore'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { formatRupiah } from '@/lib/utils'

interface AddToCartButtonProps {
  product: Product
  size?: 'sm' | 'md' | 'lg'
}

export default function AddToCartButton({ product, size = 'md' }: AddToCartButtonProps) {
  const { addItem } = useCartStore()
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [quantity, setQuantity] = useState(1)
  
  const hasVariants = product.variants && product.variants.length > 0
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)

  const currentStock = hasVariants ? (selectedVariant?.stock || 0) : product.stock
  const currentPrice = hasVariants ? (selectedVariant?.price || product.price) : product.price
  
  // Jika punya varian, kita anggap habis stok kalau belum pilih varian DAN stok variannya 0
  const isOutOfStock = hasVariants ? (selectedVariant ? selectedVariant.stock === 0 : false) : product.stock === 0

  async function handleAddToCart() {
    if (hasVariants && !selectedVariant) {
      toast.error('Silakan pilih varian terlebih dahulu.')
      return
    }

    if (isOutOfStock) {
      toast.error('Maaf, stok barang sedang kosong.')
      return
    }

    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      toast.error('Silakan daftar atau login terlebih dahulu untuk belanja.')
      router.push('/login')
      return
    }

    addItem(product, quantity, selectedVariant || undefined)
    toast.success(`${quantity} ${product.name} ${selectedVariant ? `(${selectedVariant.name})` : ''} ditambahkan ke keranjang!`, {
      icon: '🛒',
    })
    setLoading(false)
    setQuantity(1)
  }

  const height = size === 'sm' ? '36px' : size === 'lg' ? '54px' : '44px'
  const fontSize = size === 'sm' ? '0.875rem' : size === 'lg' ? '1.1rem' : '1rem'

  const buttonElement = (
    <button
      onClick={handleAddToCart}
      disabled={isOutOfStock || loading}
      className={isOutOfStock ? 'btn' : 'btn btn-primary'}
      style={{
        width: '100%',
        height,
        fontSize,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        fontWeight: 600,
        background: isOutOfStock ? '#4b5563' : undefined,
        color: isOutOfStock ? '#ffffff' : undefined,
        border: isOutOfStock ? 'none' : undefined,
        cursor: isOutOfStock ? 'not-allowed' : 'pointer'
      }}
    >
      <ShoppingCart size={size === 'lg' ? 22 : 18} />
      {isOutOfStock ? 'Stok Sedang Habis' : 'Masukkan Keranjang'}
    </button>
  )

  if (size === 'lg') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Dynamic Price */}
        <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem' }}>
          {hasVariants && !selectedVariant ? (
            `${formatRupiah(Math.min(...product.variants!.map(v => v.price)))} - ${formatRupiah(Math.max(...product.variants!.map(v => v.price)))}`
          ) : (
            formatRupiah(currentPrice)
          )}
        </div>

        {hasVariants && (
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>Pilih Varian:</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {product.variants!.map((variant, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedVariant(variant)
                    setQuantity(1)
                  }}
                  style={{ 
                    padding: '0.5rem 1rem', 
                    fontSize: '0.9rem',
                    background: selectedVariant?.name === variant.name ? 'var(--primary-light)' : 'transparent',
                    border: selectedVariant?.name === variant.name ? '1px solid var(--primary)' : '1px solid var(--border)',
                    color: selectedVariant?.name === variant.name ? 'var(--primary)' : 'var(--text-secondary)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: selectedVariant?.name === variant.name ? 600 : 400,
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {variant.name}
                  {selectedVariant?.name === variant.name && (
                    <div style={{ position: 'absolute', bottom: 0, right: 0, width: 0, height: 0, borderBottom: '16px solid var(--primary)', borderLeft: '16px solid transparent' }}>
                      <span style={{ position: 'absolute', right: '1px', bottom: '-15px', color: 'white', fontSize: '8px', fontWeight: 'bold' }}>✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Kuantitas</span>
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1 || isOutOfStock || (hasVariants && !selectedVariant)}
              style={{ padding: '0.4rem 0.8rem', background: 'var(--surface-2)', borderRight: '1px solid var(--border)', cursor: quantity <= 1 || isOutOfStock || (hasVariants && !selectedVariant) ? 'not-allowed' : 'pointer', opacity: quantity <= 1 || isOutOfStock || (hasVariants && !selectedVariant) ? 0.5 : 1 }}
            >
              -
            </button>
            <span style={{ width: '40px', textAlign: 'center', fontSize: '0.95rem', fontWeight: 600 }}>
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
              disabled={quantity >= currentStock || isOutOfStock || (hasVariants && !selectedVariant)}
              style={{ padding: '0.4rem 0.8rem', background: 'var(--surface-2)', borderLeft: '1px solid var(--border)', cursor: quantity >= currentStock || isOutOfStock || (hasVariants && !selectedVariant) ? 'not-allowed' : 'pointer', opacity: quantity >= currentStock || isOutOfStock || (hasVariants && !selectedVariant) ? 0.5 : 1 }}
            >
              +
            </button>
          </div>
        </div>
        {buttonElement}
      </div>
    )
  }

  return buttonElement
}
