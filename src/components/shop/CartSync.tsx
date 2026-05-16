'use client'

import { useEffect, useRef } from 'react'
import { useCartStore } from '@/lib/store/cartStore'
import { syncCartToDB, getCartFromDB } from '@/lib/actions/cart'
import { createClient } from '@/lib/supabase/client'

/**
 * Komponen tak terlihat untuk sinkronisasi keranjang ke DB
 */
export default function CartSync() {
  const { items, setItems } = useCartStore()
  const supabase = createClient()
  const isInitialMount = useRef(true)
  const isSyncingFromDB = useRef(false)

  // 1. Fetch dari DB saat login / pertama kali render
  useEffect(() => {
    async function loadCart() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        isSyncingFromDB.current = true
        const res = await getCartFromDB()
        if (res.items) {
          setItems(res.items)
        }
        isSyncingFromDB.current = false
      }
    }

    loadCart()

    // Listen auth change (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          isSyncingFromDB.current = true
          const res = await getCartFromDB()
          if (res.items) setItems(res.items)
          isSyncingFromDB.current = false
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, setItems])

  // 2. Sync ke DB setiap kali items berubah
  useEffect(() => {
    // Jangan sync jika ini render pertama atau sedang loading dari DB
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    if (isSyncingFromDB.current) return

    const debounceTimer = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await syncCartToDB(items)
      }
    }, 1000) // Debounce 1 detik agar tidak spam DB

    return () => clearTimeout(debounceTimer)
  }, [items, supabase])

  return null
}
