'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, ShoppingBag, LayoutDashboard, Package, ClipboardList, LogOut, User, BarChart, Sun, Moon, Settings } from 'lucide-react'
import AdminLogoutButton from './AdminLogoutButton'
import ThemeToggle from '../ThemeToggle'

interface AdminLayoutClientProps {
  children: React.ReactNode
  profileName: string
  storeName?: string
}

export default function AdminLayoutClient({ children, profileName, storeName }: AdminLayoutClientProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const pathname = usePathname()

  // Tutup sidebar otomatis saat pindah halaman (di mobile)
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const navItems = [
    { href: '/admin', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { href: '/admin/products', icon: <Package size={20} />, label: 'Produk' },
    { href: '/admin/orders', icon: <ClipboardList size={20} />, label: 'Pesanan' },
    { href: '/admin/reports', icon: <BarChart size={20} />, label: 'Laporan' },
    { href: '/admin/settings', icon: <Settings size={20} />, label: 'Pengaturan' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
      {/* Mobile Top Header */}
      <header
        className="md-hidden"
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          height: '60px', background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', padding: '0 1rem',
          gap: '1rem'
        }}
      >
        <button 
          onClick={() => setIsOpen(true)}
          style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
        >
          <Menu size={24} />
        </button>
        <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Admin Panel</span>
      </header>

      {/* Backdrop for Mobile */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 110,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)'
          }}
          className="md-hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        style={{
          width: '260px',
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 120,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        className="admin-sidebar"
      >
        {/* Brand Section */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={20} color="white" />
            </div>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
              {storeName || 'RizqinaStore'}
            </span>
          </Link>
          <button 
            className="md-hidden"
            onClick={() => setIsOpen(false)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Section */}
        <nav style={{ padding: '1.5rem 1rem', flex: 1 }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', paddingLeft: '0.75rem' }}>
            Main Menu
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.75rem 1rem', borderRadius: '12px',
                    textDecoration: 'none',
                    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                    background: isActive ? 'var(--primary-light)' : 'transparent',
                    fontWeight: isActive ? 600 : 500,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {item.icon}
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Footer Section - Clickable Profile */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', position: 'relative' }}>
          
          {/* Popover Menu (Visible when clicked) */}
          {isUserMenuOpen && (
            <div
              className="animate-fade-in"
              style={{
                position: 'absolute', bottom: 'calc(100% + 10px)', left: '1rem', right: '1rem',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '16px', boxShadow: 'var(--shadow-lg)',
                padding: '8px', zIndex: 130,
              }}
            >
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '8px 8px 12px', padding: '0 4px' }}>
                Saat ini menggunakan
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <Link
                  href="/settings"
                  className="btn btn-ghost"
                  style={{ 
                    width: '100%', justifyContent: 'flex-start', 
                    fontSize: '0.85rem', gap: '10px', padding: '10px 12px',
                    borderRadius: '10px', color: 'var(--text-secondary)'
                  }}
                >
                  <User size={18} />
                  Pengaturan Akun
                </Link>

                <Link
                  href="/"
                  className="btn btn-ghost"
                  style={{ 
                    width: '100%', justifyContent: 'flex-start', 
                    fontSize: '0.85rem', gap: '10px', padding: '10px 12px',
                    borderRadius: '10px', color: 'var(--text-secondary)'
                  }}
                >
                  <ShoppingBag size={18} />
                  Lihat Toko
                </Link>

                <ThemeToggle />

                <div className="divider" style={{ margin: '4px 8px' }} />

                <AdminLogoutButton />
              </div>
            </div>
          )}

          {/* Clickable Profile Card */}
          <button
             onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
             style={{
               width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left',
               display: 'flex', alignItems: 'center', gap: '0.75rem', 
               padding: '0.75rem', background: isUserMenuOpen ? 'var(--surface-2)' : 'transparent',
               borderRadius: '12px', transition: 'all 0.2s ease',
             }}
             onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-2)'}
             onMouseLeave={(e) => { if(!isUserMenuOpen) e.currentTarget.style.background = 'transparent' }}
          >
             <div
               style={{
                 width: '40px', height: '40px', borderRadius: '50%',
                 background: 'var(--primary)', color: 'white',
                 display: 'flex', alignItems: 'center', justifyContent: 'center',
                 fontSize: '1.1rem', fontWeight: 700, flexShrink: 0,
               }}
             >
               {profileName[0].toUpperCase()}
             </div>
             <div style={{ flex: 1, overflow: 'hidden' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {profileName}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Administrator</p>
             </div>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main 
        style={{ 
          flex: 1, 
          paddingTop: '60px', 
          maxWidth: '100%',
          overflowX: 'hidden'
        }}
        className="admin-main-content"
      >
        {children}
      </main>

      {/* Global CSS to handle the Desktop state */}
      <style jsx global>{`
        @media (min-width: 768px) {
          .admin-sidebar {
            transform: translateX(0) !important;
            position: sticky !important;
            height: 100vh;
          }
          .admin-main-content {
            padding-top: 0 !important;
          }
          header.md-hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
