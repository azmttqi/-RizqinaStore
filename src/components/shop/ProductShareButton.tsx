'use client'

import { Share2 } from 'lucide-react'

interface Props {
  productName: string
  productDescription: string
}

export default function ProductShareButton({ productName, productDescription }: Props) {
  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: productName,
          text: `Cek produk keren ini: ${productName} - ${productDescription.slice(0, 50)}...`,
          url: window.location.href,
        })
      } catch (err) {
        console.error('Error sharing:', err)
      }
    } else {
      // Fallback
      navigator.clipboard.writeText(window.location.href)
      alert('Link berhasil disalin!')
    }
  }

  return (
    <button 
      onClick={handleShare}
      className="btn btn-ghost" 
      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', padding: '0.5rem 1rem' }}
    >
      <Share2 size={18} />
      <span>Bagikan</span>
    </button>
  )
}
