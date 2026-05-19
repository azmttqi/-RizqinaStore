import { createClient } from '@/lib/supabase/server'
import { formatRupiah } from '@/lib/utils'
import {
  Package, ShoppingCart, TrendingUp, Clock,
  CheckCircle, Truck, AlertCircle
} from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard Admin — RizqinaStore' }

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [
    { count: totalProducts },
    { count: totalOrders },
    { count: pendingOrders },
    { data: recentOrders },
    { data: salesOrders },
    { data: productsData },
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('orders').select('*', { count: 'exact', head: true }).or('payment_method.eq.cod,payment_status.eq.paid'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('order_status', 'pending').or('payment_method.eq.cod,payment_status.eq.paid'),
    supabase
      .from('orders')
      .select('id, consumer_name, total_amount, order_status, payment_method, payment_status, created_at')
      .or('payment_method.eq.cod,payment_status.eq.paid')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('orders')
      .select('order_items(quantity, price_snapshot, product_id)')
      .neq('order_status', 'cancelled')
      .or('payment_method.eq.cod,payment_status.eq.paid'),
    supabase.from('products').select('id, name, price, cost_price, stock'),
  ])

  const totalRevenue = salesOrders?.reduce((sum, order) => {
    const itemsSum = order.order_items?.reduce((s: number, item: any) => s + (Number(item.quantity) * Number(item.price_snapshot)), 0) || 0
    return sum + itemsSum
  }, 0) || 0
  
  const estimatedProfit = salesOrders?.reduce((sum, order) => {
    const itemsSum = order.order_items?.reduce((s: number, item: any) => {
      const product = productsData?.find(p => p.id === item.product_id)
      const costPrice = product?.cost_price || 0
      return s + (Number(item.quantity) * (Number(item.price_snapshot) - costPrice))
    }, 0) || 0
    return sum + itemsSum
  }, 0) || 0

  const lowStockCount = productsData?.filter(p => p.stock < 5).length || 0

  const stats = [
    {
      label: 'Total Revenue',
      value: formatRupiah(totalRevenue),
      icon: <TrendingUp size={22} />,
      color: 'var(--success)',
      bg: 'var(--success-light)',
    },
    {
      label: 'Estimasi Keuntungan',
      value: formatRupiah(estimatedProfit),
      icon: <TrendingUp size={22} />,
      color: 'var(--primary)',
      bg: 'var(--primary-light)',
    },
    {
      label: 'Total Pesanan',
      value: totalOrders || 0,
      icon: <ShoppingCart size={22} />,
      color: 'var(--primary)',
      bg: 'var(--primary-light)',
    },
    {
      label: 'Pesanan Pending',
      value: pendingOrders || 0,
      icon: <Clock size={22} />,
      color: 'var(--warning)',
      bg: 'var(--warning-light)',
    },
    {
      label: 'Produk Aktif',
      value: totalProducts || 0,
      icon: <Package size={22} />,
      color: 'var(--secondary)',
      bg: 'var(--secondary-light)',
    },
    {
      label: 'Stok Rendah (< 5)',
      value: lowStockCount || 0,
      icon: <AlertCircle size={22} />,
      color: 'var(--danger)',
      bg: 'var(--danger-light)',
    },
  ]

  const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
    pending: { label: 'Pending', icon: <Clock size={12} />, color: 'var(--warning)', bg: 'var(--warning-light)' },
    confirmed: { label: 'Dikonfirmasi', icon: <CheckCircle size={12} />, color: 'var(--success)', bg: 'var(--success-light)' },
    shipped: { label: 'Dikirim', icon: <Truck size={12} />, color: 'var(--primary)', bg: 'var(--primary-light)' },
    delivered: { label: 'Terkirim', icon: <CheckCircle size={12} />, color: 'var(--success)', bg: 'var(--success-light)' },
    cancelled: { label: 'Dibatalkan', icon: <AlertCircle size={12} />, color: 'var(--danger)', bg: 'var(--danger-light)' },
  }

  return (
    <div style={{ padding: 'clamp(1rem, 5vw, 2rem)' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
          Dashboard
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Ringkasan performa toko Anda
        </p>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1.5rem',
        }}
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="card"
            style={{ 
              padding: '1rem 0.75rem', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.5rem', 
              alignItems: 'flex-start' 
            }}
          >
            <div
              style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: stat.bg, color: stat.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {stat.icon}
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '0.125rem' }}>
                {stat.label}
              </p>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Lower Section: Alerts & Recent Orders */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', 
          gap: '1.25rem', 
          marginTop: '0.5rem' 
        }}
      >
        
        {/* Low Stock Alerts */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} color="var(--danger)" />
            Peringatan Stok Kritis
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {productsData?.filter(p => p.stock < 5).length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Semua stok aman ✅</p>
            ) : (
              productsData?.filter(p => p.stock < 5).map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--surface-2)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div style={{ overflow: 'hidden', flex: 1, paddingRight: '0.5rem' }}>
                    <p style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.name}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 700 }}>Tersisa {p.stock} pcs</p>
                  </div>
                  <a href={`/admin/products/${p.id}/inventory`} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
                    Restock
                  </a>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Pesanan Terbaru</h2>
            <a
              href="/admin/orders"
              style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none' }}
            >
              Lihat semua →
            </a>
          </div>

          {!recentOrders || recentOrders.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
              Belum ada pesanan masuk.
            </p>
          ) : (
            <div style={{ overflowX: 'auto', margin: '0 -0.25rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Konsumen', 'Total', 'Status'].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: 'left', padding: '0.625rem 0.5rem',
                          color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.75rem',
                          textTransform: 'uppercase',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => {
                    const s = statusConfig[order.order_status] || statusConfig.pending
                    return (
                      <tr
                        key={order.id}
                        className="border-b border-[var(--border-subtle)] transition-colors hover:bg-[var(--card)]"
                      >
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 500 }}>
                          <p style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {order.consumer_name}
                          </p>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--primary)', fontWeight: 600 }}>
                          {formatRupiah(order.total_amount)}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <span className="badge" style={{ background: s.bg, color: s.color, fontSize: '0.65rem' }}>
                            {s.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
