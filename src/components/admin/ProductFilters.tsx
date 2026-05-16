'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'

export default function ProductFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [category, setCategory] = useState(searchParams.get('cat') || '')
  const [status, setStatus] = useState(searchParams.get('status') || 'active')

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      if (category) params.set('cat', category)
      if (status) params.set('status', status)
      
      router.push(`/admin/products?${params.toString()}`)
    }, 400) // 400ms delay

    return () => clearTimeout(timer)
  }, [search, category, status, router])

  return (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
      <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input 
          type="text" 
          placeholder="Cari nama produk..." 
          className="input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: '2.5rem', width: '100%' }}
        />
      </div>

      <select 
        className="input" 
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        style={{ minWidth: '120px', width: 'auto' }}
      >
        <option value="active">Aktif</option>
        <option value="inactive">Nonaktif</option>
        <option value="all">Semua</option>
      </select>

      <select 
        className="input" 
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        style={{ minWidth: '180px', width: 'auto' }}
      >
        <option value="">Semua Kategori</option>
        <option value="Pakaian">Pakaian</option>
        <option value="Makanan">Makanan</option>
        <option value="Aksesoris">Aksesoris</option>
        <option value="Elektronik">Elektronik</option>
        <option value="Lainnya">Lainnya</option>
      </select>
    </div>
  )
}
