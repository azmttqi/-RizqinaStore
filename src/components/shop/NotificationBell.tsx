'use client'

import { useState, useEffect } from 'react'
import { Bell, Info, Package, CheckCircle, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const supabase = createClient()

  const unreadCount = notifications.filter(n => !n.is_read).length

  useEffect(() => {
    // 1. Fetch initial notifications
    async function fetchNotifications() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (data) setNotifications(data)
    }

    fetchNotifications()

    // 2. Subscribe to Realtime updates
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev].slice(0, 10))
          
          // Play sound or show toast
          toast(payload.new.title, {
            description: payload.new.message,
            icon: '🔔',
          })
          
          // Haptic-like vibration if supported
          if (typeof window !== 'undefined' && window.navigator.vibrate) {
            window.navigator.vibrate(200)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const markAsRead = async () => {
    if (unreadCount === 0) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
    
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const toggleOpen = () => {
    if (!isOpen) markAsRead()
    setIsOpen(!isOpen)
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={toggleOpen}
        className="btn btn-ghost"
        style={{ padding: '0.5rem', position: 'relative' }}
      >
        <Bell size={22} color={unreadCount > 0 ? 'var(--warning)' : 'currentColor'} />
        {unreadCount > 0 && (
          <span
            className="animate-bounce"
            style={{
              position: 'absolute', top: '4px', right: '4px',
              width: '10px', height: '10px', borderRadius: '50%',
              background: 'var(--danger)', border: '2px solid var(--background)',
            }}
          />
        )}
      </button>

      {isOpen && (
        <div
          className="notification-dropdown animate-in fade-in zoom-in-95 duration-200"
          style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
            background: 'var(--surface)',
            border: '1px solid var(--border)', borderRadius: '16px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
            zIndex: 100, overflow: 'hidden',
          }}
        >
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Notifikasi</h3>
            {unreadCount > 0 && (
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{unreadCount} baru</span>
            )}
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Bell size={32} strokeWidth={1} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                <p style={{ fontSize: '0.8rem' }}>Belum ada notifikasi</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: '1rem', borderBottom: '1px solid var(--border)',
                    background: n.is_read ? 'transparent' : 'var(--surface-2)',
                    display: 'flex', gap: '0.875rem',
                    transition: 'background 0.2s',
                  }}
                >
                  <div style={{ marginTop: '0.25rem' }}>
                    {n.type === 'success' ? <CheckCircle size={16} color="var(--success)" /> : 
                     n.type === 'danger' ? <XCircle size={16} color="var(--danger)" /> :
                     <Info size={16} color="var(--primary)" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>{n.title}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{n.message}</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{formatDate(n.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div style={{ padding: '0.75rem', textAlign: 'center', background: 'var(--surface-2)' }}>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ fontSize: '0.8rem', background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
