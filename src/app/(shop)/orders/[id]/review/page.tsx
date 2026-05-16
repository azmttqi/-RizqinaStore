import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ArrowLeft, Package, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import StarRatingInput from '@/components/shop/StarRatingInput'
import { submitReview } from '@/lib/actions/review'
import { formatRupiah } from '@/lib/utils'

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Ambil detail order
  const { data: order, error } = await supabase
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
    .eq('id', id)
    .single()

  // DEBUG & ERROR HANDLING
  if (!order) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '2rem' }}>
        <AlertCircle size={48} color="var(--danger)" style={{ marginBottom: '1rem' }} />
        <h3>Pesanan Tidak Ditemukan</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>ID: {id}</p>
        <p style={{ color: 'var(--danger)', fontSize: '0.8rem', background: 'var(--danger-light)', padding: '0.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
          Database Error: {error?.message || 'Data kosong/tidak ditemukan'}
        </p>
        <Link href="/orders" className="btn btn-primary">Kembali ke Pesanan Saya</Link>
      </div>
    )
  }

  // Pastikan pemiliknya benar
  if (order.user_id !== user.id) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '2rem' }}>
        <AlertCircle size={48} color="var(--danger)" style={{ marginBottom: '1rem' }} />
        <h3>Akses Ditolak</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Anda tidak memiliki izin untuk memberikan ulasan pada pesanan ini.</p>
        <Link href="/orders" className="btn btn-primary">Kembali ke Pesanan Saya</Link>
      </div>
    )
  }

  // Pastikan order status delivered
  if (order.order_status !== 'delivered') {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '2rem' }}>
        <Package size={48} color="var(--warning)" style={{ marginBottom: '1rem' }} />
        <h3>Belum Bisa Memberi Ulasan</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Ulasan hanya bisa diberikan setelah pesanan Anda sampai tujuan.<br/>
          Status saat ini: <strong>{order.order_status}</strong>
        </p>
        <Link href="/orders" className="btn btn-primary">Cek Status Pesanan</Link>
      </div>
    )
  }

  // Cek apakah sudah di-review
  const { data: existingReviews } = await supabase
    .from('reviews')
    .select('id')
    .eq('order_id', order.id)

  if (existingReviews && existingReviews.length > 0) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '2rem' }}>
        <CheckCircle size={48} color="var(--success)" style={{ marginBottom: '1rem' }} />
        <h3>Ulasan Sudah Terkirim</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Anda sudah memberikan ulasan untuk pesanan ini. Terima kasih!</p>
        <Link href="/orders" className="btn btn-primary">Kembali ke Pesanan Saya</Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link 
          href="/orders" 
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '1rem' }}
        >
          <ArrowLeft size={16} />
          Kembali ke Pesanan Saya
        </Link>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Berikan Ulasan ✨
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Bagikan pengalaman Anda menggunakan produk ini.
        </p>
      </div>

      <form action={submitReview}>
        <input type="hidden" name="order_id" value={order.id} />
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {order.order_items.map((item: any) => (
            <div key={item.id} className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
                 <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Package size={24} color="var(--text-muted)" />
                 </div>
                 <div>
                    <p style={{ fontWeight: 600, fontSize: '1rem' }}>{item.product_name_snapshot}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatRupiah(item.price_snapshot)}</p>
                 </div>
              </div>

              <input type="hidden" name="product_id" value={item.product_id} />
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>Rating Produk</label>
                <StarRatingInput name={`rating_${item.product_id}`} required />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Ulasan Anda</label>
                <textarea 
                  name={`comment_${item.product_id}`}
                  className="input"
                  placeholder="Kualitas barang, pengemasan, dll..."
                  rows={3}
                />
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '2rem' }}>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
             Kirim Ulasan
          </button>
        </div>
      </form>
    </div>
  )
}
