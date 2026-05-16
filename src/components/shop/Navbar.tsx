'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ShoppingBag, ShoppingCart, User, LogOut, LayoutDashboard, ChevronDown, ClipboardList, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/lib/store/cartStore'
import { toast } from 'sonner'
import { Profile } from '@/lib/types'
import CartDrawer from '@/components/shop/CartDrawer'
import CartSync from '@/components/shop/CartSync'
import NotificationBell from '@/components/shop/NotificationBell'
import ThemeToggle from '@/components/ThemeToggle'

interface NavbarProps {
  profile: Profile | null
}

export default function Navbar({ profile }: NavbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const { getTotalItems, toggleCart, clearCart } = useCartStore()
  
  const [mounted, setMounted] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const totalItems = getTotalItems()
  
  const showSearch = !pathname.startsWith('/checkout')

  useEffect(() => {
    setMounted(true)
  }, [])

  // Sinkronkan state search saat URL berubah (misal tombol Back diklik)
  useEffect(() => {
    setSearch(searchParams.get('search') || '')
  }, [searchParams])

  // Efek Pencarian Instan (Debounce)
  useEffect(() => {
    if (!mounted) return
    
    const currentSearch = searchParams.get('search') || ''
    if (search === currentSearch) return

    const timer = setTimeout(() => {
      if (search.trim()) {
        router.push(`/?search=${encodeURIComponent(search.trim())}#products`)
      } else if (search === '' && currentSearch !== '') {
        router.push('/')
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [search, router, mounted, searchParams])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    router.push(`/?search=${encodeURIComponent(search.trim())}#products`)
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isMenuOpen && !(e.target as Element).closest('#user-menu-root')) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMenuOpen])

  async function handleLogout() {
    clearCart()
    await supabase.auth.signOut()
    toast.success('Berhasil keluar.')
    setIsMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  return (
    <>
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'var(--navbar-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 1.5rem',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShoppingBag size={20} color="white" />
            </div>
            <span
              className="hidden-mobile"
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 700,
                fontSize: '1.2rem',
                color: 'var(--text-primary)',
              }}
            >
              RizqinaStore
            </span>
          </Link>

          {/* Search Bar - Center */}
          {showSearch ? (
            <form 
              onSubmit={handleSearch}
              className="md-flex"
              style={{ 
                flex: 1, 
                maxWidth: '500px', 
                margin: '0 2rem',
                position: 'relative',
              }}
            >
              <Search 
                size={18} 
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
              />
              <input
                type="text"
                placeholder="Cari produk favorit Anda..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.625rem 1rem 0.625rem 2.5rem',
                  borderRadius: '99px',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s ease',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--primary)';
                  e.target.style.background = 'var(--surface)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border)';
                  e.target.style.background = 'var(--surface-2)';
                }}
              />
            </form>
          ) : null}

          {/* Right Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Notifications */}
            {profile && <NotificationBell />}

            {/* Cart Button */}
            <button
              onClick={toggleCart}
              className="btn btn-ghost"
              style={{ position: 'relative', padding: '0.5rem 0.75rem' }}
              aria-label="Keranjang belanja"
            >
              <ShoppingCart size={22} />
              {mounted && totalItems > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '4px',
                    background: 'var(--secondary)',
                    color: 'white',
                    borderRadius: '99px',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    minWidth: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                  }}
                >
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </button>

            {/* Auth Actions */}
            {profile ? (
              <div id="user-menu-root" style={{ position: 'relative' }}>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.375rem 0.75rem',
                    background: isMenuOpen ? 'var(--surface-2)' : 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '99px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div
                    style={{
                      width: '24px', height: '24px', borderRadius: '50%',
                      background: 'var(--primary-light)', color: 'var(--primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', fontWeight: 700,
                    }}
                  >
                    {profile.full_name?.[0].toUpperCase() || 'U'}
                  </div>
                  <span className="hidden-mobile" style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                    {profile.full_name?.split(' ')[0]}
                  </span>
                  <ChevronDown
                    size={14}
                    style={{
                      transition: 'transform 0.2s',
                      transform: isMenuOpen ? 'rotate(180deg)' : 'rotate(0)',
                      color: 'var(--text-muted)',
                    }}
                  />
                </button>

                {/* Pinterest Style Dropdown */}
                {isMenuOpen && (
                  <div
                    className="animate-in fade-in zoom-in-95 duration-200"
                    style={{
                      position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                      width: '240px',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '16px',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
                      padding: '8px',
                      zIndex: 60,
                    }}
                  >
                    <div style={{ padding: '12px 12px 16px 12px' }}>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        Saat ini menggunakan
                      </p>
                      <div
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '8px', background: 'var(--surface-2)',
                          borderRadius: '12px', border: '1px solid var(--primary-light)',
                        }}
                      >
                        <div
                          style={{
                            width: '40px', height: '40px', borderRadius: '50%',
                            background: 'var(--primary)', color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.2rem', fontWeight: 700, flexShrink: 0,
                          }}
                        >
                          {profile.full_name?.[0].toUpperCase()}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {profile.full_name}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {profile.role === 'admin' ? 'Administrator' : 'Pribadi'}
                          </p>
                        </div>
                      </div>
                    </div>

                      <div className="divider" style={{ margin: '0 8px' }} />

                    <div style={{ padding: '4px' }}>
                        <Link
                          href="/settings"
                          onClick={() => setIsMenuOpen(false)}
                          className="btn btn-ghost"
                          style={{
                            width: '100%', justifyContent: 'flex-start',
                            padding: '10px 12px', fontSize: '0.9rem', borderRadius: '10px', gap: '10px',
                          }}
                        >
                          <User size={18} />
                          Pengaturan Akun
                        </Link>

                        <Link
                          href="/orders"
                          onClick={() => setIsMenuOpen(false)}
                          className="btn btn-ghost"
                          style={{
                            width: '100%', justifyContent: 'flex-start',
                            padding: '10px 12px', fontSize: '0.9rem', borderRadius: '10px', gap: '10px',
                          }}
                        >
                          <ClipboardList size={18} />
                          Pesanan Saya
                        </Link>

                      {profile.role === 'admin' && (
                        <Link
                          href="/admin"
                          onClick={() => setIsMenuOpen(false)}
                          className="btn btn-ghost"
                          style={{
                            width: '100%', justifyContent: 'flex-start',
                            padding: '10px 12px', fontSize: '0.9rem', borderRadius: '10px', gap: '10px',
                          }}
                        >
                          <LayoutDashboard size={18} />
                          Admin Dashboard
                        </Link>
                      )}

                      <ThemeToggle />

                      <button
                        onClick={handleLogout}
                        className="btn btn-ghost"
                        style={{
                          width: '100%', justifyContent: 'flex-start',
                          padding: '10px 12px', fontSize: '0.9rem', borderRadius: '10px',
                          color: 'var(--danger)', gap: '10px',
                        }}
                      >
                        <LogOut size={18} />
                        Keluar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Link href="/login" className="btn btn-ghost btn-sm">
                  Masuk
                </Link>
                <Link href="/register" className="btn btn-primary btn-sm">
                  Daftar
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search Bar - Visible only on mobile */}
        {showSearch && (
          <div 
            className="md-hidden"
            style={{ 
              padding: '0 1rem 0.75rem',
              background: 'transparent'
            }}
          >
            <form 
              onSubmit={handleSearch}
              style={{ position: 'relative' }}
            >
              <Search 
                size={16} 
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
              />
              <input
                type="text"
                placeholder="Cari produk..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 1rem 0.5rem 2.2rem',
                  borderRadius: '12px',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                }}
              />
            </form>
          </div>
        )}
      </nav>

      <CartDrawer profile={profile} />
      <CartSync />
    </>
  )
}
