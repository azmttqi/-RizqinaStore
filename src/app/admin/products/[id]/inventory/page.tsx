import { getProduct } from '@/lib/actions/products'
import { getInventoryLogs } from '@/lib/actions/inventory'
import { formatRupiah } from '@/lib/utils'
import { ArrowLeft, History, Package } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import InventoryManager from '../../../../../components/admin/InventoryManager'

export default async function InventoryPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const product = await getProduct(params.id)
  
  if (!product) {
    notFound()
  }

  const logs = await getInventoryLogs(params.id)

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link
          href="/admin/products"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '1rem' }}
        >
          <ArrowLeft size={16} />
          Kembali ke Daftar Produk
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>Manajemen Inventori</h1>
            <p style={{ color: 'var(--text-secondary)' }}>{product.name}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stok Saat Ini</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>{product.stock} <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-muted)' }}>pcs</span></div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {/* Kolom Kiri: Form Tambah Stok */}
        <div>
          <InventoryManager product={product} />
        </div>

        {/* Kolom Kanan: Riwayat */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={20} color="var(--primary)" />
            Riwayat Pergerakan Barang
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {logs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                Belum ada riwayat stok.
              </div>
            ) : (
              logs.map((log) => (
                <div 
                  key={log.id} 
                  style={{ 
                    padding: '1rem', 
                    borderRadius: '12px', 
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span 
                        style={{ 
                          fontSize: '0.7rem', 
                          fontWeight: 800, 
                          padding: '0.2rem 0.5rem', 
                          borderRadius: '4px',
                          background: log.type === 'IN' ? 'var(--success-light)' : log.type === 'OUT' ? 'var(--danger-light)' : 'var(--primary-light)',
                          color: log.type === 'IN' ? 'var(--success)' : log.type === 'OUT' ? 'var(--danger)' : 'var(--primary)'
                        }}
                      >
                        {log.type}
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                        {log.type === 'IN' ? '+' : '-'}{Math.abs(log.quantity)} pcs
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                      {log.note || 'Tanpa keterangan'}
                    </p>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {new Date(log.created_at).toLocaleString('id-ID')}
                    </span>
                  </div>
                  {log.cost_price && (
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.1rem' }}>Modal</p>
                      <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>{formatRupiah(log.cost_price)}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
