'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Eye, EyeOff, ShoppingBag, UserPlus } from 'lucide-react'
import { signInWithGoogle } from '@/lib/actions/auth'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleGoogleRegister() {
    setGoogleLoading(true)
    await signInWithGoogle()
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('Password dan konfirmasi password tidak cocok.')
      return
    }

    if (password.length < 6) {
      toast.error('Password minimal 6 karakter.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'consumer',
        },
      },
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    // Update whatsapp di profile setelah register
    const { data: { user } } = await supabase.auth.getUser()
    if (user && whatsapp) {
      await supabase.from('profiles').update({ whatsapp }).eq('id', user.id)
    }

    toast.success('Akun berhasil dibuat! Selamat berbelanja.')
    router.push('/')
    router.refresh()
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 py-12"
      style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(108, 99, 255, 0.12) 0%, transparent 60%), var(--background)',
      }}
    >
      <div className="w-full max-w-[520px] animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
            style={{ 
              background: 'var(--primary-light)', 
              border: '1px solid rgba(108,99,255,0.3)',
              boxShadow: '0 8px 16px -4px rgba(108,99,255,0.2)'
            }}
          >
            <ShoppingBag size={30} color="var(--primary)" />
          </div>
          <h1 style={{ fontSize: '2.25rem', color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}>
            Buat Akun
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '1.1rem' }}>
            Bergabung dengan RizqinaStore hari ini
          </p>
        </div>

        {/* Card */}
        <div className="glass-card" style={{ padding: '2.5rem' }}>
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="form-group">
              <label htmlFor="fullName" style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Nama Lengkap</label>
              <input
                id="fullName"
                type="text"
                className="input"
                placeholder="Nama Anda"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                style={{ height: '3.125rem' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email" style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Alamat Email</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="contoh@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={{ height: '3.125rem' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="whatsapp" style={{ marginBottom: '0.5rem', fontWeight: 600 }}>
                Nomor WhatsApp{' '}
                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opsional)</span>
              </label>
              <input
                id="whatsapp"
                type="tel"
                className="input"
                placeholder="08xxxxxxxxxx"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                style={{ height: '3.125rem' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  style={{ paddingRight: '3rem', height: '3.125rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '1rem', top: '50%',
                    transform: 'translateY(-50%)', background: 'none',
                    border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
              <label htmlFor="confirmPassword" style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Konfirmasi Password</label>
              <input
                id="confirmPassword"
                type="password"
                className="input"
                placeholder="Ulangi password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                style={{ height: '3.125rem' }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ marginTop: '0.5rem', height: '3.25rem', fontSize: '1.05rem', fontWeight: 700 }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                  Mendaftarkan...
                </span>
              ) : (
                <>
                  <UserPlus size={20} />
                  Daftar Sekarang
                </>
              )}
            </button>
          </form>

          <div 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '1rem', 
              margin: '2rem 0', color: 'var(--text-muted)' 
            }}
          >
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>ATAU</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleRegister}
            disabled={googleLoading}
            className="btn btn-secondary w-full"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '1rem', 
              height: '3.25rem',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: 600,
              background: 'transparent',
              border: '2px solid var(--border)',
              marginBottom: '2rem'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            {googleLoading ? (
               <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none">
                 <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.3" />
                 <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
               </svg>
            ) : (
              <>
                <svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                Daftar dengan Google
              </>
            )}
          </button>

          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Sudah punya akun?{' '}
            <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
