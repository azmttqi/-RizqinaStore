import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem, Product } from '@/lib/types'

interface CartStore {
  items: CartItem[]
  isOpen: boolean

  // Actions
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  toggleItemSelection: (productId: string) => void
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

      addItem: (product: Product, quantity = 1) => {
        set((state) => {
          const existingItem = state.items.find(
            (item) => item.product.id === product.id
          )

          if (existingItem) {
            // Update quantity, tapi tidak melebihi stok
            const newQty = Math.min(
              existingItem.quantity + quantity,
              product.stock
            )
            return {
              items: state.items.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: newQty, selected: true }
                  : item
              ),
            }
          }

          // Tambah item baru
          return {
            items: [
              ...state.items,
              { product, quantity: Math.min(quantity, product.stock), selected: true },
            ],
          }
        })
      },

      removeItem: (productId: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId),
        }))
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId
              ? { ...item, quantity: Math.min(quantity, item.product.stock) }
              : item
          ),
        }))
      },

      toggleItemSelection: (productId: string) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId
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
          (total, item) => item.selected !== false ? total + item.product.price * item.quantity : total,
          0
        )
      },

      getSelectedItems: () => {
        return get().items.filter(item => item.selected !== false)
      },
    }),
    {
      name: 'umkm-cart',
      // Hanya persist items, bukan isOpen
      partialize: (state) => ({ items: state.items }),
    }
  )
)
