'use client'

import { useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import { Product } from '@/lib/types'
import { useCartStore } from '@/lib/store/cartStore'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

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

  const isOutOfStock = product.stock === 0

  async function handleAddToCart() {
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

    addItem(product, quantity)
    toast.success(`${quantity} ${product.name} ditambahkan ke keranjang!`, {
      icon: '🛒',
    })
    setLoading(false)
    setQuantity(1) // Reset setelah ditambah
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Kuantitas</span>
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1 || isOutOfStock}
              style={{ padding: '0.4rem 0.8rem', background: 'var(--surface-2)', borderRight: '1px solid var(--border)', cursor: quantity <= 1 || isOutOfStock ? 'not-allowed' : 'pointer', opacity: quantity <= 1 || isOutOfStock ? 0.5 : 1 }}
            >
              -
            </button>
            <span style={{ width: '40px', textAlign: 'center', fontSize: '0.95rem', fontWeight: 600 }}>
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
              disabled={quantity >= product.stock || isOutOfStock}
              style={{ padding: '0.4rem 0.8rem', background: 'var(--surface-2)', borderLeft: '1px solid var(--border)', cursor: quantity >= product.stock || isOutOfStock ? 'not-allowed' : 'pointer', opacity: quantity >= product.stock || isOutOfStock ? 0.5 : 1 }}
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
