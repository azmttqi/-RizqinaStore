import { createClient } from '@/lib/supabase/server'
import { formatRupiah } from '@/lib/utils'
import Link from 'next/link'
import { Plus, Pencil, Package, ImageOff } from 'lucide-react'
import Image from 'next/image'
import { toggleProductStatus } from '@/lib/actions/products'
import ProductFilters from '@/components/admin/ProductFilters'
import DeleteProductButton from '@/components/admin/DeleteProductButton'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Manajemen Produk — Admin' }

export default async function AdminProductsPage(props: { searchParams: Promise<{ q?: string; cat?: string; status?: string }> }) {
  const searchParams = await props.searchParams
  const supabase = await createClient()

  let query = supabase.from('products').select('*').order('created_at', { ascending: false })

  if (searchParams.q) {
    query = query.ilike('name', `%${searchParams.q}%`)
  }
  
  if (searchParams.cat) {
    query = query.eq('category', searchParams.cat)
  }

  // Handle status filter (default to active if not specified)
  const statusFilter = searchParams.status || 'active'
  if (statusFilter === 'active') {
    query = query.eq('is_active', true)
  } else if (statusFilter === 'inactive') {
    query = query.eq('is_active', false)
  }
  // if 'all', we don't add any filter

  const { data: products } = await query

  // Fetch sales data for metrics
  const productIds = products?.map(p => p.id) || []
  const { data: salesData } = await supabase
    .from('order_items')
    .select(`
      product_id, 
      quantity, 
      price_snapshot,
      orders!inner(order_status)
    `)
    .in('product_id', productIds)
    .neq('orders.order_status', 'cancelled')

  const productsWithMetrics = products?.map(product => {
    const productSales = salesData?.filter(item => item.product_id === product.id) || []
    const totalQuantity = productSales.reduce((sum, item) => sum + item.quantity, 0)
    const totalRevenue = productSales.reduce((sum, item) => sum + (item.quantity * item.price_snapshot), 0)
    const totalProfit = productSales.reduce((sum, item) => sum + (item.quantity * (item.price_snapshot - product.cost_price)), 0)
    
    return {
      ...product,
      totalQuantity,
      totalRevenue,
      totalProfit
    }
  }) || []

  return (
    <div className="admin-container">
      {/* Header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            Manajemen Produk
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {productsWithMetrics.length} produk terdaftar
          </p>
        </div>
        <Link href="/admin/products/new" className="btn btn-primary">
          <Plus size={18} />
          <span className="md-inline" style={{ display: 'none' }}>Tambah</span>
          <span className="md-flex">Tambah Produk</span>
        </Link>
      </div>

      <ProductFilters />

      {/* Products Table */}
      {!products || products.length === 0 ? (
        <div
          className="card"
          style={{
            padding: '4rem', textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
          }}
        >
          <Package size={48} strokeWidth={1} color="var(--text-muted)" />
          <div>
            <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Belum ada produk</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Mulai tambahkan produk untuk ditampilkan di toko.
            </p>
          </div>
          <Link href="/admin/products/new" className="btn btn-primary btn-sm">
            <Plus size={16} />
            Tambah Produk Pertama
          </Link>
        </div>
      ) : (
        <div className="card table-container">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
                {['Produk', 'Harga', 'Stok', 'Terjual', 'Omzet', 'Keuntungan', 'Status', 'Aksi'].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left', padding: '0.875rem 1rem',
                      color: 'var(--text-muted)', fontWeight: 500,
                      fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {productsWithMetrics.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-[var(--border-subtle)] transition-colors hover:bg-[var(--card)]"
                >
                  {/* Product */}
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                      <div
                        style={{
                          width: '52px', height: '52px',
                          borderRadius: '8px', overflow: 'hidden',
                          background: 'var(--surface-2)', flexShrink: 0,
                          position: 'relative',
                        }}
                      >
                        {product.image_url ? (
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            fill style={{ objectFit: 'cover' }}
                            sizes="52px"
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            <ImageOff size={18} strokeWidth={1.5} />
                          </div>
                        )}
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, marginBottom: '0.125rem' }}>{product.name}</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {product.description || '—'}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Price */}
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: 'var(--primary)' }}>
                    {formatRupiah(product.price)}
                  </td>

                  {/* Stock */}
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span
                      style={{
                        fontWeight: 600,
                        color: product.stock === 0 ? 'var(--danger)' :
                               product.stock <= 5 ? 'var(--warning)' : 'var(--success)',
                      }}
                    >
                      {product.stock} pcs
                    </span>
                  </td>

                  {/* Total Quantity Sold */}
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span style={{ fontWeight: 600 }}>{product.totalQuantity} pcs</span>
                  </td>

                  {/* Total Revenue (Omzet) */}
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>
                    {formatRupiah(product.totalRevenue)}
                  </td>

                  {/* Total Profit */}
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: 'var(--success)' }}>
                    {formatRupiah(product.totalProfit)}
                  </td>

                  {/* Status */}
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span
                      className="badge"
                      style={{
                        background: product.is_active ? 'var(--success-light)' : 'var(--border)',
                        color: product.is_active ? 'var(--success)' : 'var(--text-muted)',
                      }}
                    >
                      {product.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link
                        href={`/admin/products/${product.id}/inventory`}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.5rem', background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid var(--primary-light)' }}
                        title="Kelola Stok (Restock)"
                      >
                        <Package size={14} />
                      </Link>

                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.5rem' }}
                        title="Edit Produk"
                      >
                        <Pencil size={14} />
                      </Link>
                      
                      <form action={async () => { 'use server'; await toggleProductStatus(product.id, product.is_active) }}>
                        <button
                          type="submit"
                          className={product.is_active ? "btn btn-ghost btn-sm" : "btn btn-success btn-sm"}
                          style={product.is_active ? { color: 'var(--text-muted)' } : { background: 'var(--success)', color: 'white', border: 'none' }}
                          title={product.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        >
                          {product.is_active ? 'Hide' : 'Show'}
                        </button>
                      </form>

                      <DeleteProductButton productId={product.id} productName={product.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
