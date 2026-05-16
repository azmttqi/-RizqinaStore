import { formatRupiah } from './utils'

interface OrderNotificationData {
  orderId: string
  consumerName: string
  consumerAddress: string
  consumerWhatsapp: string
  totalAmount: number
  paymentMethod: string
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
}

/**
 * Fungsi untuk generate pesan WhatsApp yang rapi
 */
export function generateOrderSummary(data: OrderNotificationData) {
  const itemsList = data.items
    .map((item) => `- ${item.name} (${item.quantity}x)`)
    .join('\n')

  return `*PESANAN BARU #${data.orderId.slice(0, 8).toUpperCase()}*

Halo Admin, ada pesanan baru masuk!

*Detail Konsumen:*
- Nama: ${data.consumerName}
- No. WA: ${data.consumerWhatsapp}
- Alamat: ${data.consumerAddress}

*Daftar Produk:*
${itemsList}

*Total Belanja:* ${formatRupiah(data.totalAmount)}
*Metode Bayar:* ${data.paymentMethod.toUpperCase()}

Mohon segera diproses ya! Terima kasih.`
}

/**
 * Placeholder untuk pengiriman pesan otomatis (Backend)
 * Anda bisa menghubungkan ini ke API Fonnte / Wablas di sini
 */
export async function sendAdminNotification(data: OrderNotificationData) {
  console.log('--- NOTIFIKASI ADMIN ---')
  console.log(generateOrderSummary(data))
  
  // CONTOH IMPLEMENTASI FONNTE (Jika Anda punya API Key):
  /*
  try {
    await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': 'YOUR_API_KEY_HERE',
      },
      body: new URLSearchParams({
        target: 'NOMOR_WA_ADMIN',
        message: generateOrderSummary(data),
      })
    })
  } catch (err) {
    console.error('Gagal kirim notifikasi WA:', err)
  }
  */
}
