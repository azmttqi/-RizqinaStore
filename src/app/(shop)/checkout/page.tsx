'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/lib/store/cartStore'
import { checkoutAction } from '@/lib/actions/checkout'
import { formatRupiah } from '@/lib/utils'
import { toast } from 'sonner'
import {
  User, MapPin, Phone, ShoppingBag, ArrowLeft, Truck, CheckCircle, ImageOff
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import type { Metadata } from 'next'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getSelectedItems, getTotalPrice, clearSelectedItems } = useCartStore()
  const [loading, setLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showEmbed, setShowEmbed] = useState(false)
  const [paymentSubMethod, setPaymentSubMethod] = useState<string>('')
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({})
  
  const selectedItems = getSelectedItems()
  const [isMounted, setIsMounted] = useState(false)

  const [form, setForm] = useState({
    consumerName: '',
    consumerAddress: '',
    consumerWhatsapp: '',
    notes: '',
  })
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'qris'>('cod')
  
  const supabase = createClient()

  const totalPrice = getTotalPrice()

  // Redirect jika cart kosong & Auto-fill profil
  useEffect(() => {
    setIsMounted(true)

    if (selectedItems.length === 0 && !isSuccess) {
      router.push('/')
      return
    }

    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, whatsapp, address')
          .eq('id', session.user.id)
          .single()
        
        if (profile) {
          setForm(prev => ({
            ...prev,
            consumerName: profile.full_name || '',
            consumerWhatsapp: profile.whatsapp || '',
            consumerAddress: profile.address || '',
          }))
        }
      }
    }

    loadProfile()
  }, [selectedItems.length, router, supabase, isSuccess])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault()

    if (!form.consumerName.trim()) {
      toast.error('Nama tidak boleh kosong.')
      return
    }
    if (!form.consumerAddress.trim()) {
      toast.error('Alamat tidak boleh kosong.')
      return
    }
    if (!form.consumerWhatsapp.trim()) {
      toast.error('Nomor WhatsApp tidak boleh kosong.')
      return
    }

    if (paymentMethod === 'qris' && !paymentSubMethod) {
      toast.error('Silakan pilih Bank atau E-Wallet terlebih dahulu.')
      return
    }

    setLoading(true)

    try {
      const result = await checkoutAction({
        consumerName: form.consumerName.trim(),
        consumerAddress: form.consumerAddress.trim(),
        consumerWhatsapp: form.consumerWhatsapp.trim(),
        paymentMethod: paymentMethod,
        paymentSubMethod: paymentMethod === 'qris' ? paymentSubMethod : undefined,
        notes: form.notes.trim() || undefined,
        items: selectedItems,
      })

      if (!result.success) {
        toast.error(result.error || 'Terjadi kesalahan.')
        setLoading(false)
        return
      }

      // Jika pesanan menggunakan Midtrans (ada snapToken)
      if (result.snapToken && (window as any).snap) {
        setShowEmbed(true)
        setLoading(false)
        
        // Beri waktu sejenak agar DOM merender div #snap-container
        setTimeout(() => {
          ;(window as any).snap.embed(result.snapToken, {
            embedId: 'snap-container',
            onSuccess: (res: any) => {
              toast.success('Pembayaran Berhasil!')
              setIsSuccess(true)
              clearSelectedItems()
              router.push(`/checkout/success?order_id=${result.orderId}`)
            },
            onPending: (res: any) => {
              toast.info('Menunggu Pembayaran...')
              setIsSuccess(true)
              clearSelectedItems()
              router.push(`/checkout/success?order_id=${result.orderId}`)
            },
            onError: (res: any) => {
              toast.error('Pembayaran Gagal!')
              setIsSuccess(true)
              clearSelectedItems()
              router.push(`/checkout/success?order_id=${result.orderId}`)
            }
          })
        }, 100)
        return
      }

      // Jika COD atau tidak ada snapToken, langsung redirect
      setIsSuccess(true)
      clearSelectedItems()
      toast.success('Pesanan berhasil dibuat!')
      router.push(`/checkout/success?order_id=${result.orderId}`)
    } catch (err) {
      console.error(err)
      toast.error('Terjadi kesalahan. Silakan coba lagi.')
      setLoading(false)
    }
  }


  if (!isMounted) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-spin" style={{ width: '32px', height: '32px', border: '4px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
      </div>
    )
  }

  if (selectedItems.length === 0 && !isSuccess) {
    return null // Will redirect
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <Link
          href="/"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
            color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem',
            marginBottom: '1rem',
          }}
        >
          <ArrowLeft size={16} />
          Kembali ke Toko
        </Link>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Checkout</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          Lengkapi data pengiriman Anda
        </p>
      </div>

      {/* Form Container (Satu Kolom ala Shopee) */}
      <form id="checkout-form" onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
        
        {/* 1. Alamat Pengiriman & Info Konsumen */}
        <div className="card" style={{ padding: '1.5rem', borderTop: '4px solid var(--primary)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
            <MapPin size={20} />
            Alamat Pengiriman
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="consumerName">Nama Lengkap *</label>
                <input
                  id="consumerName" name="consumerName" type="text" className="input"
                  placeholder="Nama Penerima" value={form.consumerName} onChange={handleChange} required
                />
              </div>
              <div className="form-group">
                <label htmlFor="consumerWhatsapp">Nomor WhatsApp *</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id="consumerWhatsapp" name="consumerWhatsapp" type="tel" className="input"
                    placeholder="08xxxxxxxxxx" value={form.consumerWhatsapp} onChange={handleChange} required
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="consumerAddress">Alamat Lengkap *</label>
              <textarea
                id="consumerAddress" name="consumerAddress" className="input"
                placeholder="Jl. Contoh No. 1, RT/RW, Kelurahan, Kecamatan, Kota, Provinsi"
                value={form.consumerAddress} onChange={handleChange} required rows={2}
              />
            </div>
          </div>
        </div>

        {/* 2. Produk Dipesan */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingBag size={18} />
            Produk Dipesan
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {selectedItems.map((item) => (
              <div key={item.product.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px dashed var(--border)' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: 'var(--surface-2)', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                  {item.product.image_url && !imgErrors[item.product.id] ? (
                    <Image
                      src={item.product.image_url} alt={item.product.name} fill style={{ objectFit: 'cover' }}
                      sizes="60px" onError={() => setImgErrors(prev => ({ ...prev, [item.product.id]: true }))}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                      <ImageOff size={16} strokeWidth={1.5} />
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.25rem' }}>{item.product.name}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{formatRupiah(item.product.price)}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>x{item.quantity}</p>
                  <p style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.25rem' }}>{formatRupiah(item.product.price * item.quantity)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label htmlFor="notes">Catatan Pesanan (opsional)</label>
            <input
              id="notes" name="notes" className="input" type="text"
              placeholder="Silakan tinggalkan pesan..."
              value={form.notes} onChange={handleChange}
            />
          </div>
        </div>

        {/* 3. Metode Pembayaran */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Truck size={18} />
            Metode Pembayaran
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            <div
              onClick={() => setPaymentMethod('cod')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem',
                background: paymentMethod === 'cod' ? 'rgba(var(--primary-rgb), 0.08)' : 'var(--card)',
                border: paymentMethod === 'cod' ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `1.5px solid ${paymentMethod === 'cod' ? 'var(--primary)' : 'var(--text-muted)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {paymentMethod === 'cod' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }} />}
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>COD (Bayar di Tempat)</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Bayar saat barang sampai</p>
              </div>
            </div>

            <div
              onClick={() => setPaymentMethod('qris')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem',
                background: paymentMethod === 'qris' ? 'rgba(var(--primary-rgb), 0.08)' : 'var(--card)',
                border: paymentMethod === 'qris' ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `1.5px solid ${paymentMethod === 'qris' ? 'var(--primary)' : 'var(--text-muted)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {paymentMethod === 'qris' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }} />}
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>Transfer / QRIS / E-Wallet</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Otomatis (Midtrans)</p>
              </div>
            </div>
          </div>

          {/* Sub-metode Pembayaran Midtrans */}
          {paymentMethod === 'qris' && (
            <div className="animate-fade-in" style={{ marginTop: '1rem', padding: '1.25rem', background: 'var(--surface-1)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '1rem' }}>Pilih Metode Pembayaran Otomatis</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
                {[
                  { id: 'bca_va', label: 'BCA Virtual Account' },
                  { id: 'mandiri_va', label: 'Mandiri Virtual Account' },
                  { id: 'bni_va', label: 'BNI Virtual Account' },
                  { id: 'bri_va', label: 'BRI Virtual Account' },
                  { id: 'gopay', label: 'GoPay' },
                  { id: 'shopeepay', label: 'ShopeePay' },
                  { id: 'qris', label: 'QRIS (Semua E-Wallet)' },
                ].map((method) => (
                  <div
                    key={method.id}
                    onClick={() => setPaymentSubMethod(method.id)}
                    style={{
                      padding: '0.875rem',
                      border: paymentSubMethod === method.id ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                      borderRadius: '8px',
                      background: paymentSubMethod === method.id ? 'rgba(var(--primary-rgb), 0.05)' : 'var(--card)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `1.5px solid ${paymentSubMethod === method.id ? 'var(--primary)' : 'var(--text-muted)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {paymentSubMethod === method.id && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }} />}
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: paymentSubMethod === method.id ? 600 : 400 }}>{method.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 4. Rincian Pembayaran / Midtrans Embed */}
        {showEmbed ? (
          <div className="card animate-fade-in" style={{ padding: '1.5rem', background: 'var(--surface-2)', marginTop: '0.5rem', border: '1px solid var(--border)', borderRadius: '12px' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '1.5rem', fontWeight: 600, fontSize: '1.1rem' }}>
              Pilih Pembayaran Anda
            </h3>
            <div id="snap-container" style={{ width: '100%', minHeight: '500px', borderRadius: '8px', overflow: 'hidden' }}></div>
          </div>
        ) : (
          <div className="card" style={{ padding: '1.5rem', background: 'var(--surface-2)', marginTop: '0.5rem', border: '1px solid var(--border)', borderRadius: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal Produk</span>
                <span>{formatRupiah(totalPrice)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal Pengiriman</span>
                <span style={{ color: 'var(--success)' }}>Gratis (COD)</span>
              </div>
              <div className="divider" style={{ margin: '0.5rem 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>Total Pembayaran</span>
                <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.5rem', fontFamily: 'Outfit, sans-serif' }}>
                  {formatRupiah(totalPrice)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', fontWeight: 700 }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                  <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                  Memproses Pesanan...
                </span>
              ) : (
                paymentMethod === 'cod' ? 'Buat Pesanan Sekarang' : 'Buat Pesanan & Bayar'
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
