'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { confirmDeliveryAction } from '@/lib/actions/checkout'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Props {
  orderId: string
  isDelivered: boolean
}

export default function ConfirmDeliveryButton({ orderId, isDelivered }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  if (isDelivered) {
    return (
      <div className="card" style={{ background: 'var(--success-light)', border: '1px solid var(--success)', textAlign: 'center', padding: '1.5rem' }}>
        <CheckCircle2 size={32} color="var(--success)" style={{ marginBottom: '0.5rem' }} />
        <h3 style={{ margin: 0, color: 'var(--success)' }}>Pesanan Selesai</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>
          Terima kasih telah mengonfirmasi! Pesanan Anda telah selesai.
        </p>
      </div>
    )
  }

  const handleConfirm = async () => {
    if (!window.confirm('Apakah Anda yakin barang sudah diterima dengan baik?')) return

    setLoading(true)
    try {
      const result = await confirmDeliveryAction(orderId)
      if (result.success) {
        toast.success('Pesanan telah dikonfirmasi selesai!')
        router.refresh()
      } else {
        toast.error(result.error || 'Gagal mengonfirmasi.')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
      <h3 style={{ margin: '0 0 0.5rem 0' }}>Barang Sudah Sampai?</h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Bantu kami dengan mengonfirmasi jika barang Anda sudah diterima dengan baik.
      </p>
      <button 
        onClick={handleConfirm}
        disabled={loading}
        className="btn btn-primary"
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
      >
        {loading ? (
          <Loader2 className="animate-spin" size={18} />
        ) : (
          <CheckCircle2 size={18} />
        )}
        Konfirmasi Pesanan Diterima
      </button>
    </div>
  )
}
