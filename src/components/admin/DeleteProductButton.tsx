'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteProduct } from '@/lib/actions/products'
import { toast } from 'sonner'

interface DeleteProductButtonProps {
  productId: string
  productName: string
}

export default function DeleteProductButton({ productId, productName }: DeleteProductButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    const confirmDelete = window.confirm(`Apakah Anda yakin ingin menghapus produk "${productName}"? Tindakan ini tidak bisa dibatalkan.`)
    
    if (!confirmDelete) return

    setIsDeleting(true)
    try {
      const result = await deleteProduct(productId)
      if (result.success) {
        toast.success(`Produk "${productName}" berhasil dihapus.`)
      } else {
        toast.error(result.error)
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat menghapus produk.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="btn btn-danger btn-sm"
      style={{ padding: '0.5rem' }}
      title="Hapus Produk"
    >
      {isDeleting ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <Trash2 size={14} />
      )}
    </button>
  )
}
