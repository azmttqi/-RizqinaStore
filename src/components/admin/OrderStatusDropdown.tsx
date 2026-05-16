'use client'

import { useState } from 'react'
import { updateOrderStatus } from '@/lib/actions/products'
import { getWhatsAppURL } from '@/lib/utils'

interface Props {
  orderId: string
  currentStatus: string
  consumerName: string
  consumerWhatsapp: string
}

const statuses = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Dikonfirmasi' },
  { value: 'shipped', label: 'Dikirim' },
  { value: 'delivered', label: 'Selesai (Terkirim)' },
  { value: 'cancelled', label: 'Dibatalkan' }
]

export default function OrderStatusDropdown({
  orderId,
  currentStatus,
  consumerName,
  consumerWhatsapp
}: Props) {
  const [loading, setLoading] = useState(false)

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const nextStatus = e.target.value
    if (nextStatus === currentStatus) return
    
    let resiValue = ''
    let courierValue = ''
    let isDirectDelivery = false

    // Jika status berubah menjadi dikirim, tanya jenis pengiriman
    if (nextStatus === 'shipped') {
      const isPackage = window.confirm('Apakah pesanan ini dikirim via Ekspedisi/Paket? (Klik OK untuk Paket, klik Batal untuk Diantar Langsung)')
      
      if (isPackage) {
        const input = window.prompt('Masukkan Nomor Resi Pengiriman:', '')
        if (input === null) {
          e.target.value = currentStatus
          return
        }
        resiValue = input
        courierValue = 'Paket'
      } else {
        isDirectDelivery = true
        courierValue = 'Kurir Toko'
      }
    }

    setLoading(true)
    try {
      await updateOrderStatus(orderId, nextStatus, resiValue, courierValue)

      // Notifikasi WhatsApp berdasarkan status baru
      if (nextStatus === 'confirmed') {
        const message = encodeURIComponent(`Halo ${consumerName}, pesanan Anda dengan Order ID: ${orderId.slice(0, 8).toUpperCase()} telah kami konfirmasi dan sedang kami proses. Terima kasih telah berbelanja!`)
        window.open(getWhatsAppURL(consumerWhatsapp, message), '_blank')
      } else if (nextStatus === 'shipped') {
        const orderLink = `${window.location.origin}/checkout/success?order_id=${orderId}`
        let text = `Halo ${consumerName}, pesanan Anda #${orderId.slice(0, 8).toUpperCase()} SEDANG DIKIRIM!\n\n`
        
        if (isDirectDelivery) {
          text += `Pesanan Anda sedang diantarkan langsung oleh kurir kami ke alamat tujuan.\n\n`
        } else {
          text += `Kurir: ${courierValue}\nNo. Resi: ${resiValue}\n\n`
        }

        text += `Jika barang sudah sampai, mohon konfirmasi melalui link berikut ya:\n${orderLink}\n\nTerima kasih!`
        
        window.open(getWhatsAppURL(consumerWhatsapp, encodeURIComponent(text)), '_blank')
      }
    } catch (error) {
      alert('Gagal memperbarui status pesanan.')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <select
        value={currentStatus}
        onChange={handleChange}
        disabled={loading}
        className="input"
        style={{ 
          padding: '0.25rem 0.5rem', 
          fontSize: '0.875rem', 
          minWidth: '130px', 
          height: '32px',
          cursor: loading ? 'wait' : 'pointer',
          opacity: loading ? 0.7 : 1
        }}
      >
        {statuses.map(s => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      {loading && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Menyimpan...</span>}
    </div>
  )
}
