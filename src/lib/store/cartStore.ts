import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem, Product, ProductVariant } from '@/lib/types'

interface CartStore {
  items: CartItem[]
  isOpen: boolean

  // Actions
  addItem: (product: Product, quantity?: number, variant?: ProductVariant) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  toggleItemSelection: (itemId: string) => void
  toggleAllSelection: (selected: boolean) => void
  setItems: (items: CartItem[]) => void
  clearCart: () => void
  clearSelectedItems: () => void
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void

  // Computed
  getTotalItems: () => number
  getTotalPrice: () => number
  getSelectedItems: () => CartItem[]
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product: Product, quantity = 1, variant?: ProductVariant) => {
        set((state) => {
          const itemId = variant ? `${product.id}_${variant.name}` : product.id
          const stockAvailable = variant ? variant.stock : product.stock

          const existingItem = state.items.find(
            (item) => (item.id || item.product.id) === itemId
          )

          if (existingItem) {
            const newQty = Math.min(
              existingItem.quantity + quantity,
              stockAvailable
            )
            return {
              items: state.items.map((item) =>
                (item.id || item.product.id) === itemId
                  ? { ...item, quantity: newQty, selected: true }
                  : item
              ),
            }
          }

          return {
            items: [
              ...state.items,
              { 
                id: itemId,
                product, 
                variant,
                quantity: Math.min(quantity, stockAvailable), 
                selected: true 
              },
            ],
          }
        })
      },

      removeItem: (itemId: string) => {
        set((state) => ({
          items: state.items.filter((item) => (item.id || item.product.id) !== itemId),
        }))
      },

      updateQuantity: (itemId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(itemId)
          return
        }
        set((state) => ({
          items: state.items.map((item) => {
            if ((item.id || item.product.id) === itemId) {
              const stockAvailable = item.variant ? item.variant.stock : item.product.stock
              return { ...item, quantity: Math.min(quantity, stockAvailable) }
            }
            return item
          }),
        }))
      },

      toggleItemSelection: (itemId: string) => {
        set((state) => ({
          items: state.items.map((item) =>
            (item.id || item.product.id) === itemId
              ? { ...item, selected: item.selected === false ? true : false }
              : item
          ),
        }))
      },

      toggleAllSelection: (selected: boolean) => {
        set((state) => ({
          items: state.items.map((item) => ({ ...item, selected })),
        }))
      },
      
      setItems: (items: CartItem[]) => set({ items }),

      clearCart: () => set({ items: [] }),

      clearSelectedItems: () => {
        set((state) => ({
          items: state.items.filter((item) => item.selected === false),
        }))
      },

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => {
            if (item.selected !== false) {
              const price = item.variant ? item.variant.price : item.product.price
              return total + price * item.quantity
            }
            return total
          },
          0
        )
      },

      getSelectedItems: () => {
        return get().items.filter(item => item.selected !== false)
      },
    }),
    {
      name: 'umkm-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
)
