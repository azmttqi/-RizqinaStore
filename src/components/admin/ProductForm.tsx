'use client'

import { useState, useRef } from 'react'
import { createProduct, updateProduct } from '@/lib/actions/products'
import { Product } from '@/lib/types'
import { formatRupiah } from '@/lib/utils'
import { Upload, X, ImageIcon, ArrowLeft, Database, History } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'

interface ProductFormProps {
  product?: Product
  isEdit?: boolean
}

export default function ProductForm({ product, isEdit }: ProductFormProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(product?.image_url || null)
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileSelect(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 5MB.')
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)

      if (isEdit && product) {
        await updateProduct(product.id, formData)
        toast.success('Produk berhasil diupdate!')
      } else {
        await createProduct(formData)
        toast.success('Produk berhasil ditambahkan!')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Terjadi kesalahan.')
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '720px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link
          href="/admin/products"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '1rem' }}
        >
          <ArrowLeft size={16} />
          Kembali ke Daftar Produk
        </Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
          {isEdit ? 'Edit Produk' : 'Tambah Produk Baru'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Image Upload */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <label style={{ marginBottom: '0.75rem', display: 'block', fontWeight: 600, fontSize: '0.9rem' }}>
            Foto Produk
          </label>

          {previewUrl ? (
            <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
              <div
                style={{
                  position: 'relative', width: '320px', height: '240px',
                  borderRadius: '10px', overflow: 'hidden',
                  border: '2px solid var(--border)',
                }}
              >
                <Image src={previewUrl} alt="Preview" fill style={{ objectFit: 'cover' }} />
              </div>
              <button
                type="button"
                onClick={() => { setPreviewUrl(null); if (fileRef.current) fileRef.current.value = '' }}
                style={{
                  position: 'absolute', top: '8px', right: '8px',
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: 'rgba(0,0,0,0.6)', border: 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white',
                }}
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                const file = e.dataTransfer.files[0]
                if (file) handleFileSelect(file)
              }}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: '10px',
                padding: '2.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'border-color 0.2s, background 0.2s',
                background: isDragging ? 'var(--primary-light)' : 'var(--surface-2)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
              }}
            >
              <div
                style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: 'var(--primary-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {isDragging ? <Upload size={22} color="var(--primary)" /> : <ImageIcon size={22} color="var(--primary)" />}
              </div>
              <div>
                <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                  {isDragging ? 'Lepaskan file di sini' : 'Drag & drop atau klik untuk upload'}
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  PNG, JPG, WEBP · Maks. 5MB
                </p>
              </div>
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            name="image"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileSelect(file)
            }}
          />
        </div>

        {/* Basic Info */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            Informasi Produk
          </h2>

          <div className="form-group">
            <label htmlFor="name">Nama Produk *</label>
            <input
              id="name"
              name="name"
              type="text"
              className="input"
              placeholder="Nama produk"
              defaultValue={product?.name}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Deskripsi</label>
            <textarea
              id="description"
              name="description"
              className="input"
              placeholder="Deskripsi produk (opsional)"
              defaultValue={product?.description || ''}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Kategori</label>
            <select
              id="category"
              name="category"
              className="input"
              defaultValue={product?.category || ''}
            >
              <option value="">-- Pilih Kategori (Opsional) --</option>
              <option value="Pakaian">Pakaian</option>
              <option value="Makanan">Makanan</option>
              <option value="Aksesoris">Aksesoris</option>
              <option value="Elektronik">Elektronik</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          {!isEdit ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="cost_price">Harga Modal Awal (Rp) *</label>
                <input
                  id="cost_price"
                  name="cost_price"
                  type="number"
                  className="input"
                  placeholder="0"
                  defaultValue={0}
                  min="0"
                  step="500"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="price">Harga Jual (Rp) *</label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  className="input"
                  placeholder="0"
                  defaultValue={0}
                  min="0"
                  step="500"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="stock">Stok Awal *</label>
                <input
                  id="stock"
                  name="stock"
                  type="number"
                  className="input"
                  placeholder="0"
                  defaultValue={0}
                  min="0"
                  required
                />
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="price">Harga Jual (Rp) *</label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  className="input"
                  placeholder="0"
                  defaultValue={product?.price}
                  min="0"
                  step="500"
                  required
                />
              </div>
              
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '0.5rem 0' }}>
                Stok saat ini: <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{product?.stock ?? 0} pcs</span>
                <span style={{ marginLeft: '0.5rem' }}>(Kelola stok melalui halaman utama Produk)</span>
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="is_active">Status Produk</label>
            <select
              id="is_active"
              name="is_active"
              className="input"
              defaultValue={product?.is_active !== false ? 'true' : 'false'}
            >
              <option value="true">Aktif (tampil di toko)</option>
              <option value="false">Nonaktif (disembunyikan)</option>
            </select>
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', gap: '0.875rem' }}>
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ flex: 1 }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.3" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
                {isEdit ? 'Menyimpan...' : 'Menambahkan...'}
              </span>
            ) : (
              isEdit ? '💾 Simpan Perubahan' : '➕ Tambah Produk'
            )}
          </button>
          <Link href="/admin/products" className="btn btn-secondary btn-lg">
            Batal
          </Link>
        </div>
      </form>
    </div>
  )
}
