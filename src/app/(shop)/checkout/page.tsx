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
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({})
  
  const selectedItems = getSelectedItems()
  const [isSuccess, setIsSuccess] = useState(false)
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

  const [showSnap, setShowSnap] = useState(false)
  const [snapToken, setSnapToken] = useState<string | null>(null)

  // Efek untuk memicu Snap Embed saat container sudah siap di DOM
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 10;

    const initSnap = () => {
      if (showSnap && snapToken && (window as any).snap) {
        const container = document.getElementById('snap-container');
        if (container) {
          try {
            ;(window as any).snap.embed(snapToken, {
              embedId: 'snap-container',
              onSuccess: (res: any) => {
                toast.success('Pembayaran Berhasil!')
                clearSelectedItems()
                router.push(`/checkout/success?order_id=${res.order_id}`)
              },
              onPending: (res: any) => {
                toast.info('Menunggu Pembayaran...')
                clearSelectedItems()
                router.push(`/checkout/success?order_id=${res.order_id}`)
              },
              onError: (res: any) => {
                toast.error('Pembayaran Gagal!')
                setShowSnap(false)
              },
              onClose: () => {
                setShowSnap(false)
                toast.info('Silakan pilih metode pembayaran lain atau coba lagi.')
              }
            })
          } catch (err) {
            console.error('Snap embed error:', err);
            if (retryCount < maxRetries) {
              retryCount++;
              setTimeout(initSnap, 500);
            }
          }
        } else if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(initSnap, 500);
        }
      } else if (showSnap && retryCount < maxRetries) {
        retryCount++;
        setTimeout(initSnap, 500);
      }
    };

    if (showSnap) {
      initSnap();
    }
  }, [showSnap, snapToken, router, clearSelectedItems])

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

    setLoading(true)

    try {
      const result = await checkoutAction({
        consumerName: form.consumerName.trim(),
        consumerAddress: form.consumerAddress.trim(),
        consumerWhatsapp: form.consumerWhatsapp.trim(),
        paymentMethod: paymentMethod,
        notes: form.notes.trim() || undefined,
        items: selectedItems,
      })

      if (!result.success) {
        toast.error(result.error || 'Terjadi kesalahan.')
        setLoading(false)
        return
      }

      // JIKA PILIH QRIS/MIDTRANS
      if (result.snapToken && (window as any).snap) {
        setSnapToken(result.snapToken)
        setShowSnap(true)
        setLoading(false)
        return
      }

      // JIKA COD
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
      {showSnap ? (
        <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Pilih Metode Pembayaran</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Silakan selesaikan pembayaran Anda di bawah ini.
            </p>
            <div id="snap-container" style={{ minHeight: '600px', width: '100%', background: 'var(--surface-1)', borderRadius: '12px' }}></div>
            <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
              <button onClick={() => setShowSnap(false)} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                <ArrowLeft size={18} />
                Kembali & Ubah Pesanan
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
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

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }} className="flex-col md:flex-row">
        {/* Left: Form */}
        <form id="checkout-form" onSubmit={handleCheckout} style={{ flex: '1 1 0%', display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
          {/* Info Konsumen */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2
              style={{
                fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}
            >
              <User size={18} color="var(--primary)" />
              Informasi Penerima
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="consumerName">Nama Lengkap *</label>
                <input
                  id="consumerName"
                  name="consumerName"
                  type="text"
                  className="input"
                  placeholder="Masukkan nama lengkap"
                  value={form.consumerName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="consumerWhatsapp">Nomor WhatsApp *</label>
                <div style={{ position: 'relative' }}>
                  <Phone
                    size={16}
                    style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                  />
                  <input
                    id="consumerWhatsapp"
                    name="consumerWhatsapp"
                    type="tel"
                    className="input"
                    placeholder="08xxxxxxxxxx"
                    value={form.consumerWhatsapp}
                    onChange={handleChange}
                    required
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Alamat */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2
              style={{
                fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}
            >
              <MapPin size={18} color="var(--primary)" />
              Alamat Pengiriman
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="consumerAddress">Alamat Lengkap *</label>
                <textarea
                  id="consumerAddress"
                  name="consumerAddress"
                  className="input"
                  placeholder="Jl. Contoh No. 1, RT/RW, Kelurahan, Kecamatan, Kota, Provinsi"
                  value={form.consumerAddress}
                  onChange={handleChange}
                  required
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label htmlFor="notes">
                  Catatan{' '}
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opsional)</span>
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  className="input"
                  placeholder="Catatan tambahan untuk penjual..."
                  value={form.notes}
                  onChange={handleChange}
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Metode Pembayaran */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2
              style={{
                fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}
            >
              <Truck size={18} color="var(--primary)" />
              Metode Pembayaran
            </h2>

            {/* Metode Pembayaran */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div
                onClick={() => setPaymentMethod('cod')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '1.25rem',
                  background: paymentMethod === 'cod' ? 'rgba(var(--primary-rgb), 0.08)' : 'var(--card)',
                  border: paymentMethod === 'cod' ? '2px solid var(--primary)' : '1px solid var(--border)',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative'
                }}
              >
                <div
                  style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: paymentMethod === 'cod' ? 'var(--primary)' : 'var(--surface-2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: paymentMethod === 'cod' ? 'white' : 'var(--text-muted)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Truck size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.125rem' }}>COD (Bayar di Tempat)</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Bayar tunai aman saat barang sampai.
                  </p>
                </div>
                <div style={{
                  width: '20px', height: '20px', borderRadius: '50%',
                  border: `2px solid ${paymentMethod === 'cod' ? 'var(--primary)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: paymentMethod === 'cod' ? 'var(--primary)' : 'transparent'
                }}>
                  {paymentMethod === 'cod' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }} />}
                </div>
              </div>

              <div
                onClick={() => setPaymentMethod('qris')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '1.25rem',
                  background: paymentMethod === 'qris' ? 'rgba(var(--primary-rgb), 0.08)' : 'var(--card)',
                  border: paymentMethod === 'qris' ? '2px solid var(--primary)' : '1px solid var(--border)',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative'
                }}
              >
                <div
                  style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: paymentMethod === 'qris' ? 'var(--primary)' : 'var(--surface-2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: paymentMethod === 'qris' ? 'white' : 'var(--text-muted)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <CheckCircle size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.125rem' }}>Pembayaran Otomatis</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    QRIS, GoPay, ShopeePay, & Virtual Account.
                  </p>
                </div>
                <div style={{
                  width: '20px', height: '20px', borderRadius: '50%',
                  border: `2px solid ${paymentMethod === 'qris' ? 'var(--primary)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: paymentMethod === 'qris' ? 'var(--primary)' : 'transparent'
                }}>
                  {paymentMethod === 'qris' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }} />}
                </div>
              </div>
            </div>
          </div>

          {/* Submit - Mobile */}
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ display: 'none' }}
            id="submit-checkout"
          >
            {loading ? 'Memproses...' : 'Buat Pesanan'}
          </button>
        </form>

        {/* Right: Order Summary */}
        <div style={{ position: 'sticky', top: '80px', flexShrink: 0 }} className="w-full md:w-[360px]">
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingBag size={18} color="var(--primary)" />
              Ringkasan Pesanan
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.25rem' }}>
              {selectedItems.map((item) => (
                <div key={item.product.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '52px', height: '52px', borderRadius: '8px',
                      background: 'var(--surface-2)', overflow: 'hidden',
                      flexShrink: 0, position: 'relative',
                    }}
                  >
                    {item.product.image_url && !imgErrors[item.product.id] ? (
                      <Image
                        src={item.product.image_url}
                        alt={item.product.name}
                        fill style={{ objectFit: 'cover' }}
                        sizes="52px"
                        onError={() => setImgErrors(prev => ({ ...prev, [item.product.id]: true }))}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        <ImageOff size={16} strokeWidth={1.5} />
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.825rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.product.name}
                    </p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {item.quantity}x · {formatRupiah(item.product.price)}
                    </p>
                  </div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, flexShrink: 0 }}>
                    {formatRupiah(item.product.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className="divider" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                <span>{formatRupiah(totalPrice)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Ongkos Kirim</span>
                <span style={{ color: 'var(--success)' }}>COD</span>
              </div>
              <div className="divider" style={{ margin: '0.25rem 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                <span>Total</span>
                <span style={{ color: 'var(--primary)', fontFamily: 'Outfit, sans-serif', fontSize: '1.15rem' }}>
                  {formatRupiah(totalPrice)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              form="checkout-form"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                  Memproses Pesanan...
                </span>
              ) : (
                <>
                  <CheckCircle size={18} />
                  {paymentMethod === 'cod' ? 'Buat Pesanan — COD' : 'Bayar Sekarang'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  )
}
