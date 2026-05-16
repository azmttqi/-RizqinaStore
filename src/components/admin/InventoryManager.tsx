'use client'

import { useState } from 'react'
import { addInventoryLogAction } from '@/lib/actions/inventory'
import { Product } from '@/lib/types'
import { toast } from 'sonner'
import { Loader2, PlusCircle, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  product: Product
}

export default function InventoryManager({ product }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const quantity = parseInt(formData.get('quantity') as string)
    const costPrice = parseFloat(formData.get('cost_price') as string)
    const type = formData.get('type') as 'IN' | 'OUT' | 'ADJUSTMENT'
    const note = formData.get('note') as string

    try {
      const result = await addInventoryLogAction({
        productId: product.id,
        type,
        quantity,
        costPrice: type === 'IN' ? costPrice : undefined,
        note
      })

      if (result.success) {
        toast.success(`Berhasil mencatat ${type === 'IN' ? 'barang masuk' : 'perubahan'} stok!`)
        router.refresh()
        e.currentTarget.reset()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('Terjadi kesalahan sistem.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card" style={{ padding: '1.5rem', background: 'var(--surface-1)' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <PlusCircle size={20} color="var(--success)" />
        Tambah Stok (Restock)
      </h3>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="form-group">
          <label>Tipe Pergerakan</label>
          <select name="type" className="input" defaultValue="IN">
            <option value="IN">Barang Masuk (Restock)</option>
            <option value="OUT">Barang Keluar (Rusak/Hilang)</option>
            <option value="ADJUSTMENT">Penyesuaian (Audit Stok)</option>
          </select>
        </div>

        <div className="form-group">
          <label>Jumlah Unit *</label>
          <input 
            name="quantity" 
            type="number" 
            className="input" 
            placeholder="Masukkan jumlah unit" 
            min="1" 
            required 
          />
        </div>

        <div className="form-group">
          <label>Harga Modal Baru (Rp) - Opsional</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>Rp</span>
            <input 
              name="cost_price" 
              type="number" 
              className="input" 
              placeholder={product.cost_price?.toString() || '0'} 
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            Isi jika harga beli dari supplier berubah. Ini akan mengupdate harga modal produk.
          </p>
        </div>

        <div className="form-group">
          <label>Catatan / Sumber</label>
          <input 
            name="note" 
            type="text" 
            className="input" 
            placeholder="Contoh: Dari Supplier A, Retur, dll" 
          />
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <PlusCircle size={20} />}
          Simpan Data Stok
        </button>
      </form>

      <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--warning-light)', borderRadius: '8px', border: '1px solid var(--warning)', display: 'flex', gap: '0.75rem' }}>
        <AlertCircle size={20} color="var(--warning)" style={{ flexShrink: 0 }} />
        <p style={{ fontSize: '0.78rem', color: 'var(--warning-dark)', margin: 0, lineHeight: 1.4 }}>
          <strong>Penting:</strong> Gunakan fitur ini setiap ada barang masuk. Jangan langsung mengedit stok di profil produk agar riwayat keuangan Anda terekam dengan jelas.
        </p>
      </div>
    </div>
  )
}
