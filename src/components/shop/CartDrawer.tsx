'use client'

import Link from 'next/link'
import Image from 'next/image'
import { X, Minus, Plus, ShoppingCart, Trash2, ArrowRight, ImageOff } from 'lucide-react'
import { useCartStore } from '@/lib/store/cartStore'
import { formatRupiah } from '@/lib/utils'
import { Profile } from '@/lib/types'
import { useState } from 'react'

interface CartDrawerProps {
  profile: Profile | null
}

export default function CartDrawer({ profile }: CartDrawerProps) {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    toggleItemSelection,
    toggleAllSelection,
    getTotalItems,
    getTotalPrice,
  } = useCartStore()
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({})

  const totalItems = getTotalItems()
  const totalPrice = getTotalPrice()
  const selectedItemsCount = items.filter(i => i.selected !== false).length
  const allSelected = items.length > 0 && selectedItemsCount === items.length

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeCart}
        style={{
          position: 'fixed', inset: 0, zIndex: 98,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Drawer */}
      <div
        className="animate-slide-in-right"
        style={{
          position: 'fixed', right: 0, top: 0, bottom: 0, zIndex: 99,
          width: '100%', maxWidth: '420px',
          background: 'var(--surface)',
          borderLeft: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <ShoppingCart size={20} color="var(--primary)" />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600 }}>
              Keranjang Belanja
            </h2>
            {totalItems > 0 && (
              <span
                className="badge badge-primary"
              >
                {totalItems} item
              </span>
            )}
          </div>
          <button onClick={closeCart} className="btn btn-ghost" style={{ padding: '0.375rem' }}>
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }}>
          {items.length === 0 ? (
            <div
              style={{
                height: '100%', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '1rem',
                color: 'var(--text-muted)',
              }}
            >
              <ShoppingCart size={56} strokeWidth={1} />
              <p style={{ fontSize: '0.95rem' }}>Keranjang masih kosong</p>
              <button onClick={closeCart} className="btn btn-primary btn-sm">
                Mulai Belanja
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {/* Select All Checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)', gap: '0.5rem' }}>
                <input 
                  type="checkbox" 
                  checked={allSelected} 
                  onChange={(e) => toggleAllSelection(e.target.checked)}
                  style={{ width: '1.1rem', height: '1.1rem', cursor: 'pointer', accentColor: 'var(--primary)' }}
                />
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Pilih Semua</span>
              </div>
              {items.map((item) => {
                const itemId = item.id || item.product.id
                const stockAvailable = item.variant ? item.variant.stock : item.product.stock
                return (
                <div
                  key={itemId}
                  style={{
                    display: 'flex', gap: '0.875rem', alignItems: 'center',
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px', padding: '0.75rem',
                  }}
                >
                  {/* Checkbox */}
                  <input 
                    type="checkbox" 
                    checked={item.selected !== false}
                    onChange={() => toggleItemSelection(itemId)}
                    style={{ width: '1.1rem', height: '1.1rem', cursor: 'pointer', accentColor: 'var(--primary)', flexShrink: 0 }}
                  />
                  {/* Image */}
                  <div
                    style={{
                      width: '72px', height: '72px', borderRadius: '8px',
                      background: 'var(--surface-2)', overflow: 'hidden',
                      flexShrink: 0, position: 'relative',
                    }}
                  >
                    {item.product.image_url && !imgErrors[item.product.id] ? (
                      <Image
                        src={item.product.image_url}
                        alt={item.product.name}
                        fill style={{ objectFit: 'cover' }}
                        sizes="72px"
                        onError={() => setImgErrors(prev => ({ ...prev, [item.product.id]: true }))}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        <ImageOff size={20} strokeWidth={1.5} />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, lineHeight: '1.3', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.product.name} {item.variant && <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>({item.variant.name})</span>}
                    </p>
                    {item.product.is_preorder && (
                      <div style={{ marginBottom: '0.25rem' }}>
                        <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '0.65rem', padding: '0.1rem 0.3rem' }}>
                          PO {item.product.preorder_days || 7} Hari
                        </span>
                      </div>
                    )}
                    <p style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 700, marginBottom: '0.5rem' }}>
                      {formatRupiah(item.variant ? item.variant.price : item.product.price)}
                    </p>

                    {/* Quantity Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.5rem',
                          background: 'var(--surface-2)', borderRadius: '8px',
                          padding: '0.2rem',
                        }}
                      >
                        <button
                          onClick={() => updateQuantity(itemId, item.quantity - 1)}
                          className="btn btn-ghost"
                          style={{ padding: '0.25rem', width: '28px', height: '28px', borderRadius: '6px' }}
                        >
                          <Minus size={14} />
                        </button>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, minWidth: '20px', textAlign: 'center' }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(itemId, item.quantity + 1)}
                          disabled={item.quantity >= stockAvailable}
                          className="btn btn-ghost"
                          style={{ padding: '0.25rem', width: '28px', height: '28px', borderRadius: '6px' }}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(itemId)}
                        className="btn btn-ghost"
                        style={{ padding: '0.25rem', color: 'var(--danger)' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderTop: '1px solid var(--border)',
              background: 'var(--surface)',
            }}
          >
            <div
              style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: '1rem',
              }}
            >
              <span style={{ color: 'var(--text-secondary)' }}>
                Total Belanja {selectedItemsCount > 0 ? `(${selectedItemsCount} item)` : ''}
              </span>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)', fontFamily: 'Outfit, sans-serif' }}>
                {formatRupiah(totalPrice)}
              </span>
            </div>

            {profile ? (
              <Link
                href={selectedItemsCount > 0 ? "/checkout" : "#"}
                onClick={(e) => {
                  if (selectedItemsCount === 0) {
                    e.preventDefault()
                    return
                  }
                  closeCart()
                }}
                className={`btn btn-primary btn-lg ${selectedItemsCount === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Lanjut ke Checkout
                <ArrowRight size={18} />
              </Link>
            ) : (
              <Link
                href={selectedItemsCount > 0 ? "/login?redirect=/checkout" : "#"}
                onClick={(e) => {
                  if (selectedItemsCount === 0) {
                    e.preventDefault()
                    return
                  }
                  closeCart()
                }}
                className={`btn btn-primary btn-lg ${selectedItemsCount === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Login untuk Checkout
                <ArrowRight size={18} />
              </Link>
            )}
          </div>

        )}
      </div>
    </>
  )
}
