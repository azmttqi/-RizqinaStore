'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'

interface StarRatingInputProps {
  name: string
  required?: boolean
}

export default function StarRatingInput({ name, required }: StarRatingInputProps) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)

  return (
    <div style={{ display: 'flex', gap: '0.25rem' }}>
      <input type="hidden" name={name} value={rating} required={required} />
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setRating(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          style={{
            background: 'none', border: 'none', padding: '0.25rem',
            cursor: 'pointer', transition: 'transform 0.1s'
          }}
        >
          <Star
            size={28}
            fill={(hover || rating) >= star ? "var(--warning)" : "none"}
            color={(hover || rating) >= star ? "var(--warning)" : "var(--border)"}
            style={{ transform: hover === star ? 'scale(1.2)' : 'scale(1)' }}
          />
        </button>
      ))}
      {rating > 0 && (
        <span style={{ marginLeft: '0.5rem', alignSelf: 'center', fontWeight: 600, color: 'var(--warning)', fontSize: '0.9rem' }}>
          {rating === 5 ? 'Sangat Puas! ⭐' : 
           rating === 4 ? 'Puas 👍' : 
           rating === 3 ? 'Biasa Saja' : 
           rating === 2 ? 'Kurang' : 'Kecewa 👎'}
        </span>
      )}
    </div>
  )
}
