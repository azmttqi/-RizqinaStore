// Format currency ke Rupiah
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Format tanggal ke locale Indonesia
export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString))
}

// Generate WhatsApp order message
export function generateWAMessage(order: {
  id: string
  consumer_name: string
  consumer_address: string
  consumer_whatsapp: string
  payment_method: string
  total_amount: number
  items: Array<{
    product_name_snapshot: string
    quantity: number
    price_snapshot: number
  }>
}): string {
  const itemsList = order.items
    .map(
      (item) =>
        `  • ${item.product_name_snapshot} x${item.quantity} = ${formatRupiah(item.price_snapshot * item.quantity)}`
    )
    .join('\n')

  const paymentLabel = order.payment_method === 'cod' ? 'COD (Bayar di Tempat)' : 'QRIS'

  const message = `
*KONFIRMASI PESANAN*

*No. Order:* ${order.id.slice(0, 8).toUpperCase()}
*Nama:* ${order.consumer_name}
*Alamat:* ${order.consumer_address}
*WhatsApp:* ${order.consumer_whatsapp}

*Detail Pesanan:*
${itemsList}

*Total:* ${formatRupiah(order.total_amount)}
*Pembayaran:* ${paymentLabel}

Terima kasih sudah berbelanja!
  `.trim()

  return encodeURIComponent(message)
}

// Generate WhatsApp URL
export function getWhatsAppURL(phoneNumber: string, message: string): string {
  let cleanNumber = phoneNumber.replace(/\D/g, '')
  if (cleanNumber.startsWith('08')) {
    cleanNumber = '62' + cleanNumber.substring(1)
  }
  return `https://wa.me/${cleanNumber}?text=${message}`
}

// Merge Tailwind classes safely
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
