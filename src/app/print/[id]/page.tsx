import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Cetak Label Pengiriman' }

export default async function PrintLabelPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const supabase = await createClient()

  // Pastikan user adalah admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return notFound()

  // Ambil data pesanan
  const { data: order } = await supabase
    .from('orders')
    .select('id, consumer_name, consumer_whatsapp, consumer_address, created_at, order_items(product_name_snapshot, quantity)')
    .eq('id', params.id)
    .single()

  if (!order) return notFound()

  return (
    <div 
      style={{ 
        background: 'white', 
        color: 'black', 
        minHeight: '100vh', 
        padding: '2rem',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      <div 
        style={{ 
          maxWidth: '800px', 
          margin: '0 auto', 
          border: '1px solid #ccc',
          padding: '3rem',
          borderRadius: '8px',
          position: 'relative'
        }}
        className="print-container"
      >
        {/* Header (Store Name & Print Button) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', borderBottom: '2px solid #000', paddingBottom: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>RizqinaStore</h1>
            <p style={{ margin: '0.25rem 0 0', color: '#555', fontSize: '1rem' }}>Label Pengiriman Paket</p>
          </div>
          <div className="no-print">
            <button 
              style={{
                padding: '0.75rem 1.5rem', background: '#000', color: '#fff', 
                border: 'none', borderRadius: '6px', fontWeight: 600,
                cursor: 'pointer', fontSize: '1rem'
              }}
            >
              🖨️ Cetak Sekarang
            </button>
          </div>
        </div>

        {/* Order Details */}
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ margin: '0 0 0.5rem', fontWeight: 600, color: '#666', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ID Pesanan
          </p>
          <p style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'monospace', fontWeight: 700 }}>
            #{order.id.split('-')[0].toUpperCase()}
          </p>
        </div>

        {/* Consumer Info (Big Font) */}
        <div style={{ background: '#f8f9fa', padding: '2rem', borderRadius: '8px', border: '1px dashed #ccc' }}>
          <p style={{ margin: '0 0 0.5rem', fontWeight: 600, color: '#666', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Penerima
          </p>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '2.5rem', fontWeight: 800 }}>
            {order.consumer_name}
          </h2>
          <p style={{ margin: '0 0 1.5rem', fontSize: '1.5rem', fontWeight: 600 }}>
            📞 {order.consumer_whatsapp}
          </p>
          
          <p style={{ margin: '0 0 0.5rem', fontWeight: 600, color: '#666', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Alamat Pengiriman
          </p>
          <p style={{ margin: 0, fontSize: '1.5rem', lineHeight: 1.5 }}>
            {order.consumer_address}
          </p>
        </div>

        {/* Print Styles */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body { background: white !important; }
            .no-print { display: none !important; }
            .print-container { border: none !important; padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
          }
        `}} />
        
        {/* Helper script to attach onClick since this is a server component */}
        <script dangerouslySetInnerHTML={{__html: `
          document.querySelector('button').addEventListener('click', () => window.print());
        `}} />
      </div>
    </div>
  )
}
