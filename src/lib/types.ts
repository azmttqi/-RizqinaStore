// Database Types - sesuai dengan schema Supabase
export type UserRole = 'admin' | 'consumer'
export type PaymentMethod = 'cod' | 'qris'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

export interface Profile {
  id: string
  full_name: string | null
  whatsapp: string | null
  role: UserRole
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  description: string | null
  category: string | null
  price: number
  cost_price: number
  stock: number
  image_url: string | null
  is_active: boolean
  sales_count: number
  avg_rating?: number
  review_count?: number
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  user_id: string | null
  consumer_name: string
  consumer_address: string
  consumer_whatsapp: string
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  order_status: OrderStatus
  total_amount: number
  notes: string | null
  midtrans_token: string | null
  midtrans_order_id: string | null
  created_at: string
  updated_at: string
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  price_snapshot: number
  product_name_snapshot: string
  created_at: string
  product?: Product
}

// Cart types (local state, tidak disimpan di DB)
export interface CartItem {
  product: Product
  quantity: number
  selected?: boolean
}
