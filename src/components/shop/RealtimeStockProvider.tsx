'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RealtimeStockProvider() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Subscribe ke perubahan tabel products via Supabase Realtime
    const channel = supabase
      .channel('products-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
        },
        (payload) => {
          console.log('Realtime: Product change detected', payload.eventType)
          // Trigger re-render Server Components (re-fetch dari DB)
          router.refresh()
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Realtime: Connected to products channel')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router, supabase])

  // Komponen ini tidak render apapun secara visual
  return null
}
