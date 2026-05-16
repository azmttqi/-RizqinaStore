import { createClient } from '@/lib/supabase/server'
import { formatRupiah, formatDate } from '@/lib/utils'
import ExportCSVButton from '@/components/admin/ExportCSVButton'
import { TrendingUp, ShoppingBag, DollarSign } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Laporan Penjualan — Admin' }

export default async function AdminReportsPage() {
  const supabase = await createClient()

  // Ambil semua pesanan yang statusnya BUKAN cancelled
  const { data: orders } = await supabase
    .from('orders')
    .select('id, consumer_name, consumer_whatsapp, consumer_address, total_amount, payment_method, order_status, created_at, order_items(quantity, price_snapshot, product_id, products(cost_price))')
    .neq('order_status', 'cancelled')
    .order('created_at', { ascending: false })

  // Kalkulasi statistik
  const validOrders = orders || []
  const totalRevenue = validOrders.reduce((sum, o) => sum + Number(o.total_amount), 0)
  
  // Hitung Estimasi Keuntungan dari item pesanan
  let totalProfit = 0
  validOrders.forEach(order => {
    order.order_items?.forEach((item: any) => {
      const sellPrice = Number(item.price_snapshot)
      const costPrice = Number(item.products?.cost_price || 0)
      const qty = Number(item.quantity)
      totalProfit += (sellPrice - costPrice) * qty
    })
  })

  // Format data menjadi Dataset Standar untuk Analisis Bisnis (Granular per Item)
  const csvData: any[] = []
  
  validOrders.forEach(order => {
    order.order_items?.forEach((item: any) => {
      const sellPrice = Number(item.price_snapshot)
      const costPrice = Number(item.products?.cost_price || 0)
      const qty = Number(item.quantity)
      const revenue = sellPrice * qty
      const profit = (sellPrice - costPrice) * qty

      csvData.push({
        'Timestamp': order.created_at,
        'Tanggal': formatDate(order.created_at),
        'ID Pesanan': order.id.slice(0, 8).toUpperCase(),
        'Kategori': item.products?.category || 'Lainnya',
        'Nama Produk': item.product_name_snapshot,
        'Harga Jual': sellPrice,
        'Harga Modal': costPrice,
        'Jumlah (Qty)': qty,
        'Total Omzet': revenue,
        'Total Laba Bersih': profit,
        'Metode Bayar': order.payment_method.toUpperCase(),
        'Nama Konsumen': order.consumer_name,
        'No. WhatsApp': `'${order.consumer_whatsapp}`,
        'Total Belanja (Per Order)': order.total_amount,
        'Status': order.order_status
      })
    })
  })

  const stats = [
    { label: 'Pesanan Berhasil', value: validOrders.length, icon: <ShoppingBag size={22} />, color: 'var(--primary)', bg: 'var(--primary-light)' },
    { label: 'Total Pendapatan', value: formatRupiah(totalRevenue), icon: <TrendingUp size={22} />, color: 'var(--success)', bg: 'var(--success-light)' },
    { label: 'Estimasi Keuntungan', value: formatRupiah(totalProfit), icon: <DollarSign size={22} />, color: 'var(--warning)', bg: 'var(--warning-light)' },
  ]

  return (
    <div className="admin-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            Laporan Penjualan
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Ringkasan data transaksi yang valid
          </p>
        </div>
        <ExportCSVButton data={csvData} filename={`laporan_penjualan_${new Date().toISOString().split('T')[0]}.csv`} />
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {stats.map((stat, i) => (
          <div key={i} className="card" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: stat.bg, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {stat.icon}
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.25rem' }}>{stat.label}</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Tabel Riwayat */}
      <div className="card table-container">
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          Riwayat Pesanan
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
              {['Tanggal', 'Konsumen', 'Metode', 'Total', 'Status'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '0.875rem 1rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {validOrders.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada data pesanan</td>
              </tr>
            ) : (
              validOrders.map(order => (
                <tr key={order.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '1rem' }}>{formatDate(order.created_at)}</td>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{order.consumer_name}</td>
                  <td style={{ padding: '1rem' }}><span className="badge badge-secondary">{order.payment_method.toUpperCase()}</span></td>
                  <td style={{ padding: '1rem', fontWeight: 600 }}>{formatRupiah(order.total_amount)}</td>
                  <td style={{ padding: '1rem' }}><span className="badge" style={{ background: 'var(--surface-2)' }}>{order.order_status}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
