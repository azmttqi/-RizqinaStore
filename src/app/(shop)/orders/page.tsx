import { createClient } from '@/lib/supabase/server'
import { formatRupiah, formatDate } from '@/lib/utils'
import { redirect } from 'next/navigation'
import { ShoppingBag, Clock, CheckCircle, Truck, Package, MessageCircle, ArrowRight, Star } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import PayNowButton from '@/components/shop/PayNowButton'

export const metadata: Metadata = {
  title: 'Pesanan Saya — RizqinaStore',
}

export default async function MyOrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Ambil history order + settings secara paralel
  const [ { data: orders }, { data: settings } ] = await Promise.all([
    supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          quantity,
          price_snapshot,
          product_name_snapshot
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('store_settings').select('store_whatsapp').eq('id', 1).single()
  ])

  const adminWA = settings?.store_whatsapp || process.env.ADMIN_WHATSAPP_NUMBER || '6281234567890'

  const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
    pending: { label: 'Menunggu Konfirmasi', icon: <Clock size={14} />, color: 'var(--warning)', bg: 'var(--warning-light)' },
    confirmed: { label: 'Sedang Diproses', icon: <CheckCircle size={14} />, color: 'var(--success)', bg: 'var(--success-light)' },
    shipped: { label: 'Dalam Pengiriman', icon: <Truck size={14} />, color: 'var(--primary)', bg: 'var(--primary-light)' },
    delivered: { label: 'Sampai Tujuan', icon: <Package size={14} />, color: 'var(--success)', bg: 'var(--success-light)' },
    cancelled: { label: 'Dibatalkan', icon: <ArrowRight size={14} />, color: 'var(--danger)', bg: 'var(--danger-light)' },
  }

  return (
    <div
      style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '2rem 1.5rem',
        minHeight: '80vh',
      }}
    >
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Pesanan Saya
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Pantau status dan riwayat belanja Anda di sini.
        </p>
      </div>

      {!orders || orders.length === 0 ? (
        <div
          className="card"
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'var(--surface-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <ShoppingBag size={32} />
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.25rem' }}>
              Belum Ada Pesanan
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Anda belum melakukan pemesanan apa pun di toko kami.
            </p>
          </div>
          <Link href="/" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
            Mulai Belanja
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {orders.map((order) => {
            const s = statusConfig[order.order_status] || statusConfig.pending
            return (
              <div
                key={order.id}
                className="card animate-fade-in"
                style={{ padding: '1.25rem', border: '1px solid var(--border)' }}
              >
                {/* Order Header */}
                <div
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    paddingBottom: '1rem', borderBottom: '1px solid var(--border)',
                    marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        No. Order
                      </span>
                      <code style={{ fontSize: '0.875rem', fontWeight: 700, fontFamily: 'monospace' }}>
                        #{order.id.slice(0, 8).toUpperCase()}
                      </code>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Dibuat pada {formatDate(order.created_at)}
                    </p>
                  </div>

                  <div
                    className="badge"
                    style={{
                      background: s.bg, color: s.color,
                      display: 'flex', alignItems: 'center', gap: '0.375rem',
                      padding: '0.5rem 0.75rem', fontSize: '0.8rem', fontWeight: 600,
                    }}
                  >
                    {s.icon}
                    {s.label}
                  </div>
                </div>

                {/* Items Summary */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {order.order_items.map((item: { id: string; product_name_snapshot: string; quantity: number; price_snapshot: number }) => (
                    <div
                      key={item.id}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <div
                          style={{
                            width: '40px', height: '40px', borderRadius: '8px',
                            background: 'var(--surface-2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <Package size={18} color="var(--text-muted)" />
                        </div>
                        <div>
                          <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                            {item.product_name_snapshot}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {item.quantity} x {formatRupiah(item.price_snapshot)}
                          </p>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                        {formatRupiah(item.price_snapshot * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="divider" style={{ margin: '1.25rem 0' }} />

                {/* Footer Info */}
                <div
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    flexWrap: 'wrap', gap: '1rem',
                  }}
                >
                  <div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.125rem' }}>
                      Total Pembayaran ({order.payment_method.toUpperCase()})
                    </p>
                    <p style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'Outfit, sans-serif' }}>
                      {formatRupiah(order.total_amount)}
                    </p>
                  </div>

                   <div style={{ display: 'flex', gap: '0.625rem' }}>
                    {order.order_status === 'delivered' && (
                      <Link
                        href={`/orders/${order.id}/review`}
                        className="btn btn-secondary btn-sm"
                        style={{ background: 'var(--warning-light)', color: 'var(--warning)', borderColor: 'var(--warning)' }}
                      >
                        <Star size={14} fill="var(--warning)" />
                        Beri Rating
                      </Link>
                    )}
                    <Link
                      href={`/checkout/success?order_id=${order.id}`}
                      className="btn btn-secondary btn-sm"
                    >
                      Detail
                    </Link>
                    {order.payment_method !== 'cod' && order.payment_status === 'pending' && order.midtrans_token && (
                      <div style={{ scale: '0.85', transformOrigin: 'right' }}>
                        <PayNowButton snapToken={order.midtrans_token} />
                      </div>
                    )}
                    <a
                      href={`https://wa.me/${adminWA}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm"
                      style={{ background: '#25D366', borderColor: '#25D366' }}
                    >
                      <MessageCircle size={16} />
                      Tanya Admin
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
