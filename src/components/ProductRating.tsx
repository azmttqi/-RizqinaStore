'use client'

import { useState } from 'react'
import { Star, Send, Loader2 } from 'lucide-react'
import { submitReviewAction } from '@/lib/actions/checkout'
import { toast } from 'sonner'

interface Props {
  orderId: string
  consumerName: string
  items: Array<{
    product_id: string
    product_name_snapshot: string
  }>
  existingReviews: Array<{
    product_id: string
    rating: number
    comment: string
  }>
}

export default function ProductRating({ orderId, consumerName, items, existingReviews }: Props) {
  const [reviews, setReviews] = useState<Record<string, { rating: number; comment: string; submitted: boolean }>>(
    items.reduce((acc, item) => {
      const existing = existingReviews.find(r => r.product_id === item.product_id)
      return { 
        ...acc, 
        [item.product_id]: { 
          rating: existing?.rating || 5, 
          comment: existing?.comment || '', 
          submitted: !!existing 
        } 
      }
    }, {})
  )
  const [submitting, setSubmitting] = useState<string | null>(null)

  const handleRate = (productId: string, rating: number) => {
    setReviews(prev => ({
      ...prev,
      [productId]: { ...prev[productId], rating }
    }))
  }

  const handleComment = (productId: string, comment: string) => {
    setReviews(prev => ({
      ...prev,
      [productId]: { ...prev[productId], comment }
    }))
  }

  const handleSubmit = async (productId: string, productName: string) => {
    const review = reviews[productId]
    setSubmitting(productId)
    
    try {
      const result = await submitReviewAction({
        orderId,
        productId,
        rating: review.rating,
        comment: review.comment,
        consumerName
      })

      if (result.success) {
        toast.success(`Ulasan untuk ${productName} terkirim!`)
        setReviews(prev => ({
          ...prev,
          [productId]: { ...prev[productId], submitted: true }
        }))
      } else {
        toast.error(result.error)
      }
    } catch (err) {
      toast.error('Gagal mengirim ulasan.')
    } finally {
      setSubmitting(null)
    }
  }

  const allSubmitted = Object.values(reviews).every(r => r.submitted)

  if (allSubmitted) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2rem', background: 'var(--success-light)', border: '1px solid var(--success)' }}>
        <h3 style={{ color: 'var(--success)', margin: 0 }}>Terima Kasih atas Ulasannya!</h3>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>Ulasan Anda sangat berarti bagi perkembangan toko kami.</p>
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <h3 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Bagaimana Produk Kami?</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {items.map((item, index) => {
          const review = reviews[item.product_id]
          if (review.submitted) return null

          return (
            <div key={`${item.product_id}-${index}`} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
              <p style={{ fontWeight: 600, marginBottom: '0.75rem' }}>{item.product_name_snapshot}</p>
              
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRate(item.product_id, star)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <Star
                      size={28}
                      fill={star <= review.rating ? 'var(--warning)' : 'none'}
                      color={star <= review.rating ? 'var(--warning)' : 'var(--text-muted)'}
                    />
                  </button>
                ))}
              </div>

              <textarea
                className="input"
                placeholder="Tulis ulasan singkat Anda..."
                value={review.comment}
                onChange={(e) => handleComment(item.product_id, e.target.value)}
                style={{ width: '100%', minHeight: '80px', marginBottom: '1rem', fontSize: '0.875rem' }}
              />

              <button
                onClick={() => handleSubmit(item.product_id, item.product_name_snapshot)}
                disabled={submitting === item.product_id}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {submitting === item.product_id ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <>
                    <Send size={14} style={{ marginRight: '0.5rem' }} />
                    Kirim Ulasan
                  </>
                )}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
