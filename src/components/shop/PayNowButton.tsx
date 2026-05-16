'use client'

import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface PayNowButtonProps {
  snapToken: string
}

export default function PayNowButton({ snapToken }: PayNowButtonProps) {
  const [loading, setLoading] = useState(false)

  const handlePay = () => {
    if (!(window as any).snap) {
      toast.error('Sistem pembayaran belum siap. Silakan refresh halaman.')
      return
    }

    setLoading(true)
    
    ;(window as any).snap.pay(snapToken, {
      onSuccess: () => {
        toast.success('Pembayaran Berhasil!')
        window.location.reload()
      },
      onPending: () => {
        toast.info('Menunggu Pembayaran...')
        setLoading(false)
      },
      onError: () => {
        toast.error('Pembayaran Gagal!')
        setLoading(false)
      },
      onClose: () => {
        setLoading(false)
      }
    })
  }

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className="btn btn-primary btn-lg"
      style={{ width: '100%', justifyContent: 'center', marginBottom: '0.75rem' }}
    >
      <CheckCircle size={20} />
      {loading ? 'Membuka Pembayaran...' : 'Bayar Sekarang'}
    </button>
  )
}
