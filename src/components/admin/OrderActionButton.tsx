'use client'

import { useState } from 'react'
import { updateOrderStatus } from '@/lib/actions/products'
import { getWhatsAppURL } from '@/lib/utils'

interface Props {
  orderId: string
  nextStatus: string
  label: string
  consumerName: string
  consumerWhatsapp: string
}

export default function OrderActionButton({
  orderId,
  nextStatus,
  label,
  consumerName,
  consumerWhatsapp
}: Props) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      await updateOrderStatus(orderId, nextStatus)
      
      // Jika status berubah menjadi confirmed, buka WhatsApp
      if (nextStatus === 'confirmed') {
        const message = encodeURIComponent(`Halo ${consumerName}, pesanan Anda dengan Order ID: ${orderId} telah kami konfirmasi dan sedang kami proses. Terima kasih telah berbelanja di RizqinaStore!`)
        const url = getWhatsAppURL(consumerWhatsapp, message)
        window.open(url, '_blank')
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button 
      onClick={handleClick} 
      disabled={loading} 
      className="btn btn-primary btn-sm"
    >
      {loading ? '...' : label}
    </button>
  )
}
