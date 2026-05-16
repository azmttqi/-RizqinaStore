'use client'

import { Star, CheckCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export interface Review {
  id: string
  consumer_name: string
  rating: number
  comment: string
  is_verified_buyer: boolean
  created_at: string
}

interface Props {
  reviews: Review[]
}

export default function ProductReviews({ reviews }: Props) {
  return (
    <div className="card" style={{ padding: '2rem', marginTop: '2rem' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
        Ulasan Pembeli
      </h2>

      {reviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--surface-2)', borderRadius: '12px' }}>
          <div style={{ display: 'inline-flex', gap: '0.25rem', color: 'var(--warning)', marginBottom: '1rem' }}>
            {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={24} strokeWidth={1.5} />)}
          </div>
          <p style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>Belum ada ulasan.</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Jadilah yang pertama memberikan ulasan setelah Anda membeli produk ini!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {reviews.map((review) => (
            <div key={review.id} style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{review.consumer_name || 'Pelanggan'}</span>
                    {review.is_verified_buyer && (
                      <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        <CheckCircle size={10} /> Pembeli Terverifikasi
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '2px', color: 'var(--warning)' }}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill={i < review.rating ? 'currentColor' : 'none'} strokeWidth={i < review.rating ? 0 : 1.5} color={i < review.rating ? 'currentColor' : 'var(--text-muted)'} />
                    ))}
                  </div>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {formatDate(review.created_at)}
                </span>
              </div>
              {review.comment && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginTop: '0.75rem' }}>
                  {review.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
