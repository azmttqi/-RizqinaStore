import { createClient } from '@/lib/supabase/server'
import { formatRupiah, formatDate, getWhatsAppURL } from '@/lib/utils'
import { updateOrderStatus } from '@/lib/actions/products'
import { ClipboardList, Package, Clock, CheckCircle, Truck, XCircle, Printer } from 'lucide-react'
import OrderStatusDropdown from '@/components/admin/OrderStatusDropdown'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Manajemen Pesanan — Admin' }

export default async function AdminOrdersPage(props: { searchParams: Promise<{ status?: string }> }) {
  const searchParams = await props.searchParams
  const statusFilter = searchParams.status || 'all'
  const supabase = await createClient()

  // Fetch all orders first to calculate stats correctly
  const { data: allOrders } = await supabase
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
    .order('created_at', { ascending: false })

  // Filter pesanan yang valid untuk diproses admin:
  // 1. Semua pesanan COD (karena dibayar nanti)
  // 2. Pesanan otomatis (qris) yang statusnya sudah 'paid' (Lunas)
  const validOrders = allOrders?.filter(o => {
    if (o.payment_method === 'cod') return true
    return o.payment_status === 'paid'
  }) || []

  const stats = {
    total: validOrders.length,
    pending: validOrders.filter((o) => o.order_status === 'pending').length,
    confirmed: validOrders.filter((o) => o.order_status === 'confirmed').length,
    shipped: validOrders.filter((o) => o.order_status === 'shipped').length,
  }

  // Filter orders for display based on the selected status
  const orders = statusFilter === 'all' 
    ? validOrders 
    : validOrders.filter(o => o.order_status === statusFilter)

  const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string; next?: string; nextLabel?: string }> = {
    pending: {
      label: 'Menunggu',
      icon: <Clock size={12} />,
      color: 'var(--warning)',
      bg: 'var(--warning-light)',
      next: 'confirmed',
      nextLabel: '✓ Konfirmasi',
    },
    confirmed: {
      label: 'Dikonfirmasi',
      icon: <CheckCircle size={12} />,
      color: 'var(--success)',
      bg: 'var(--success-light)',
      next: 'shipped',
      nextLabel: '🚚 Kirim',
    },
    shipped: {
      label: 'Dikirim',
      icon: <Truck size={12} />,
      color: 'var(--primary)',
      bg: 'var(--primary-light)',
      next: 'delivered',
      nextLabel: '📦 Sampai',
    },
    delivered: {
      label: 'Terkirim',
      icon: <Package size={12} />,
      color: 'var(--success)',
      bg: 'var(--success-light)',
    },
    cancelled: {
      label: 'Dibatalkan',
      icon: <XCircle size={12} />,
      color: 'var(--danger)',
      bg: 'var(--danger-light)',
    },
  }

  return (
    <div className="admin-container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
          Manajemen Pesanan
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          {stats.total} total pesanan
        </p>
      </div>

      {/* Quick Stats - Responsive Grid */}
      <div
        className="product-grid"
        style={{
          display: 'grid',
          gap: '0.875rem', marginBottom: '2rem',
        }}
      >
        {[
          { id: 'all', label: 'Semua', value: stats.total, color: 'var(--text-primary)', bg: 'var(--card)' },
          { id: 'pending', label: 'Pending', value: stats.pending, color: 'var(--warning)', bg: 'var(--warning-light)' },
          { id: 'confirmed', label: 'Dikonfirmasi', value: stats.confirmed, color: 'var(--success)', bg: 'var(--success-light)' },
          { id: 'shipped', label: 'Dikirim', value: stats.shipped, color: 'var(--primary)', bg: 'var(--primary-light)' },
        ].map((s) => {
          const isActive = statusFilter === s.id
          return (
            <Link
              key={s.label}
              href={`/admin/orders${s.id === 'all' ? '' : `?status=${s.id}`}`}
              style={{
                padding: '1rem', borderRadius: 'var(--radius)',
                background: s.bg, 
                border: isActive ? `2px solid ${s.color}` : '1px solid var(--border)',
                textAlign: 'center',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                transform: isActive ? 'scale(1.02)' : 'scale(1)',
                boxShadow: isActive ? 'var(--shadow-md)' : 'none',
                cursor: 'pointer'
              }}
            >
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color, fontFamily: 'Outfit, sans-serif' }}>
                {s.value}
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                {s.label}
              </p>
            </Link>
          )
        })}
      </div>

      {/* Orders List */}
      {!orders || orders.length === 0 ? (
        <div
          className="card"
          style={{ padding: '4rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}
        >
          <ClipboardList size={48} strokeWidth={1} color="var(--text-muted)" />
          <div>
            <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Belum ada pesanan</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Pesanan dari konsumen akan muncul di sini.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map((order) => {
            const s = statusConfig[order.order_status] || statusConfig.pending
            return (
              <div
                key={order.id}
                className="card"
                style={{ padding: '1.25rem' }}
              >
                {/* Order Header */}
                <div
                  style={{
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                    marginBottom: '1rem', paddingBottom: '1rem',
                    borderBottom: '1px solid var(--border)',
                    flexWrap: 'wrap', gap: '0.75rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.375rem' }}>
                      <code style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem' }}>
                        #{order.id.slice(0, 8).toUpperCase()}
                      </code>
                      <span
                        className="badge"
                        style={{ background: s.bg, color: s.color, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        {s.icon} {s.label}
                      </span>
                      <span className={`badge ${order.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                        {order.payment_status === 'paid' ? 'LUNAS' : 'BELUM BAYAR'}
                      </span>
                      <span className="badge badge-secondary">
                        {order.payment_method.toUpperCase()}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {formatDate(order.created_at)}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <OrderStatusDropdown
                      orderId={order.id}
                      currentStatus={order.order_status}
                      consumerName={order.consumer_name}
                      consumerWhatsapp={order.consumer_whatsapp}
                    />
                    
                    <a
                      href={`/print/${order.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      title="Cetak Label Pengiriman"
                    >
                      <Printer size={16} />
                    </a>
                  </div>
                </div>

                {/* Consumer Info + Items - Responsive Columns */}
                <div 
                  className="product-grid"
                  style={{
                    display: 'grid', gap: '1.5rem',
                  }}
                >
                  {/* Consumer Info */}
                  <div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.625rem' }}>
                      Info Konsumen
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.875rem' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Nama: </span>
                        <strong>{order.consumer_name}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>WA: </span>
                        <a
                          href={getWhatsAppURL(
                            order.consumer_whatsapp,
                            encodeURIComponent(`Halo ${order.consumer_name}, kami dari RizqinaStore. Terkait pesanan Anda dengan Order ID: ${order.id}`)
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#25D366', textDecoration: 'none' }}
                        >
                          {order.consumer_whatsapp}
                        </a>
                      </div>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>Alamat: </span>
                        <span style={{ lineHeight: 1.5 }}>{order.consumer_address}</span>
                      </div>
                      {(order.shipping_resi || order.shipping_courier) && (
                        <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'var(--surface-2)', borderRadius: '6px', border: '1px dashed var(--border)' }}>
                          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.25rem' }}>PENGIRIMAN</p>
                          <div style={{ fontSize: '0.8rem' }}>
                            {order.shipping_courier && <div>Kurir: <strong>{order.shipping_courier}</strong></div>}
                            {order.shipping_resi && <div>No. Resi: <strong>{order.shipping_resi}</strong></div>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Items */}
                  <div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.625rem' }}>
                      Detail Pesanan
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.875rem' }}>
                      {order.order_items?.map((item: any) => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.product_name_snapshot}
                            <span style={{ color: 'var(--text-muted)' }}> ×{item.quantity}</span>
                          </span>
                          <span style={{ fontWeight: 600, flexShrink: 0 }}>
                            {formatRupiah(item.price_snapshot * item.quantity)}
                          </span>
                        </div>
                      ))}
                      <div
                        style={{
                          borderTop: '1px solid var(--border)',
                          paddingTop: '0.375rem',
                          display: 'flex', justifyContent: 'space-between',
                          fontWeight: 700,
                        }}
                      >
                        <span>Total</span>
                        <span style={{ color: 'var(--primary)' }}>
                          {formatRupiah(order.total_amount)}
                        </span>
                      </div>
                    </div>
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
