import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatRupiah, generateWAMessage, getWhatsAppURL } from '@/lib/utils'
import { CheckCircle2, MessageCircle, Package, ArrowLeft, Clock } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import ConfirmDeliveryButton from '@/components/ConfirmDeliveryButton'
import ProductRating from '@/components/ProductRating'
import PayNowButton from '@/components/shop/PayNowButton'

export const metadata: Metadata = {
  title: 'Pesanan Berhasil! — RizqinaStore',
}

interface SuccessPageProps {
  searchParams: Promise<{ order_id?: string }>
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const { order_id } = await searchParams

  if (!order_id) {
    redirect('/')
  }

  const supabase = await createClient()

  // Ambil detail order + items dan pengaturan toko
  const [ { data: order, error }, { data: settings } ] = await Promise.all([
    supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          quantity,
          price_snapshot,
          product_name_snapshot
        )
      `)
      .eq('id', order_id)
      .single(),
    supabase.from('store_settings').select('store_whatsapp').eq('id', 1).single()
  ])

  // Ambil ulasan yang sudah pernah dibuat untuk order ini
  const { data: existingReviews } = await supabase
    .from('reviews')
    .select('product_id, rating, comment')
    .eq('order_id', order_id)

  if (error || !order) {
    redirect('/')
  }

  // Generate WhatsApp message
  const waMessage = generateWAMessage({
    id: order.id,
    consumer_name: order.consumer_name,
    consumer_address: order.consumer_address,
    consumer_whatsapp: order.consumer_whatsapp,
    payment_method: order.payment_method,
    total_amount: order.total_amount,
    items: order.order_items.map((item: { product_name_snapshot: string; quantity: number; price_snapshot: number }) => ({
      product_name_snapshot: item.product_name_snapshot,
      quantity: item.quantity,
      price_snapshot: item.price_snapshot,
    })),
  })

  const adminWANumber = settings?.store_whatsapp || '6281234567890'
  const waURL = getWhatsAppURL(adminWANumber, waMessage)

  const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'Menunggu Konfirmasi', color: 'var(--warning)', bg: 'var(--warning-light)' },
    confirmed: { label: 'Dikonfirmasi', color: 'var(--success)', bg: 'var(--success-light)' },
    shipped: { label: 'Dikirim', color: 'var(--primary)', bg: 'var(--primary-light)' },
    delivered: { label: 'Terkirim', color: 'var(--success)', bg: 'var(--success-light)' },
  }
  const currentStatus = statusLabels[order.order_status] || statusLabels.pending

  const isPendingMidtrans = order.payment_method !== 'cod' && order.payment_status === 'pending'

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        background: isPendingMidtrans 
          ? 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(245, 158, 11, 0.08) 0%, transparent 60%), var(--background)'
          : 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(16, 185, 129, 0.08) 0%, transparent 60%), var(--background)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '560px', animationDelay: '0s' }} className="animate-fade-in">
        {/* Header Icon & Title */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '88px', height: '88px', borderRadius: '50%',
              background: isPendingMidtrans ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              border: isPendingMidtrans ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)',
              marginBottom: '1.5rem',
              boxShadow: isPendingMidtrans ? '0 0 40px rgba(245, 158, 11, 0.15)' : '0 0 40px rgba(16, 185, 129, 0.15)',
              position: 'relative',
            }}
          >
            {isPendingMidtrans ? (
              <Clock size={44} color="var(--warning)" strokeWidth={2.5} />
            ) : (
              <CheckCircle2 size={44} color="var(--success)" strokeWidth={2.5} />
            )}
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>
            {isPendingMidtrans ? 'Menunggu Pembayaran' : 'Pesanan Berhasil'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '400px', margin: '0 auto' }}>
            {isPendingMidtrans 
              ? `Halo ${order.consumer_name}, pesanan Anda sudah tersimpan. Silakan selesaikan pembayaran agar kami dapat memprosesnya.`
              : `Terima kasih, ${order.consumer_name}. Pesanan Anda telah kami terima dan sedang diproses.`
            }
          </p>
        </div>

        {/* Order Card */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
          {/* Order ID & Status */}
          <div
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: '1.25rem', paddingBottom: '1.25rem',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                No. Order
              </p>
              <p style={{ fontWeight: 700, fontFamily: 'Outfit, sans-serif', letterSpacing: '0.05em' }}>
                #{order.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <span
              className="badge"
              style={{
                background: currentStatus.bg,
                color: currentStatus.color,
                gap: '0.25rem',
              }}
            >
              <Clock size={10} />
              {currentStatus.label}
            </span>
          </div>

          {/* Items */}
          <div style={{ marginBottom: '1.25rem' }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Detail Produk
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {order.order_items.map((item: { id: string; product_name_snapshot: string; quantity: number; price_snapshot: number }) => (
                <div
                  key={item.id}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Package size={14} color="var(--text-muted)" />
                    <span style={{ fontSize: '0.875rem' }}>
                      {item.product_name_snapshot}
                      <span style={{ color: 'var(--text-muted)', marginLeft: '0.25rem' }}>
                        ×{item.quantity}
                      </span>
                    </span>
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                    {formatRupiah(item.price_snapshot * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="divider" />

          {/* Totals & Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Alamat</span>
              <span style={{ fontSize: '0.875rem', textAlign: 'right', maxWidth: '55%' }}>
                {order.consumer_address}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Pembayaran</span>
              <span className={`badge ${order.payment_method === 'cod' ? 'badge-secondary' : 'badge-primary'}`} style={{ fontSize: '0.75rem' }}>
                {order.payment_method === 'cod' ? 'COD' : 'Otomatis (Midtrans)'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Status Bayar</span>
              <span className={`badge ${order.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.75rem' }}>
                {order.payment_status === 'paid' ? 'Lunas' : 'Menunggu Pembayaran'}
              </span>
            </div>
            <div className="divider" style={{ margin: '0.25rem 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
              <span>Total Bayar</span>
              <span style={{ color: 'var(--primary)', fontFamily: 'Outfit, sans-serif', fontSize: '1.1rem' }}>
                {formatRupiah(order.total_amount)}
              </span>
            </div>
          </div>
        </div>

        {/* Consumer Confirmation & Rating Section */}
        {order.order_status === 'shipped' && (
          <div style={{ marginBottom: '1.5rem', animationDelay: '0.2s' }} className="animate-fade-in">
            <ConfirmDeliveryButton 
              orderId={order.id} 
              isDelivered={false} 
            />
          </div>
        )}

        {order.order_status === 'delivered' && (
          <div style={{ marginBottom: '1.5rem', animationDelay: '0.2s' }} className="animate-fade-in">
            <ProductRating 
              orderId={order.id} 
              consumerName={order.consumer_name}
              items={order.order_items}
              existingReviews={existingReviews || []}
            />
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {isPendingMidtrans && order.midtrans_token && (
            <div 
              style={{ 
                padding: '1.25rem', 
                background: 'rgba(var(--primary-rgb), 0.05)', 
                borderRadius: '16px', 
                border: '1px dashed var(--primary)',
                marginBottom: '0.5rem',
                textAlign: 'center'
              }}
              className="animate-pulse-subtle"
            >
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.75rem' }}>
                Lanjutkan Pembayaran Anda:
              </p>
              <PayNowButton snapToken={order.midtrans_token} />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                Klik tombol di atas untuk melihat Kode VA / QRIS
              </p>
            </div>
          )}

          <a
            href={waURL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-lg"
            style={{
              background: '#25D366',
              color: 'white',
              justifyContent: 'center',
              fontSize: '1rem',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(37, 211, 102, 0.2)'
            }}
          >
            <MessageCircle size={20} />
            Konfirmasi via WhatsApp
          </a>

          <Link
            href="/"
            className="btn btn-secondary btn-lg"
            style={{ justifyContent: 'center' }}
          >
            <ArrowLeft size={18} />
            Kembali ke Toko
          </Link>
        </div>

        <p
          style={{
            marginTop: '1.25rem', textAlign: 'center',
            fontSize: '0.78rem', color: 'var(--text-muted)',
            lineHeight: '1.5',
          }}
        >
          💡 Klik tombol WhatsApp di atas untuk konfirmasi pesanan ke admin.
          Pesan sudah terisi otomatis dengan detail order Anda.
        </p>
      </div>
    </div>
  )
}
