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
    const currentScrollY = window.scrollY
    
    ;(window as any).snap.pay(snapToken, {
      onSuccess: () => {
        toast.success('Pembayaran Berhasil!')
        window.location.reload()
      },
      onPending: () => {
        toast.info('Menunggu Pembayaran...')
        setLoading(false)
        setTimeout(() => window.scrollTo(0, currentScrollY), 50)
      },
      onError: () => {
        toast.error('Pembayaran Gagal!')
        setLoading(false)
        setTimeout(() => window.scrollTo(0, currentScrollY), 50)
      },
      onClose: () => {
        setLoading(false)
        setTimeout(() => window.scrollTo(0, currentScrollY), 50)
      }
    })
  }

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className="btn btn-primary btn-lg"
      style={{ 
        width: '100%', 
        justifyContent: 'center', 
        background: 'linear-gradient(135deg, var(--primary) 0%, #7C3AED 100%)',
        border: 'none',
        boxShadow: '0 8px 16px -4px rgba(var(--primary-rgb), 0.3)',
        fontWeight: 800,
        letterSpacing: '0.01em',
        textTransform: 'uppercase',
        fontSize: '0.9rem'
      }}
    >
      <CheckCircle size={18} />
      {loading ? 'Membuka Jendela...' : 'Bayar Sekarang'}
    </button>
  )
}
