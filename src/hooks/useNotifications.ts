'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSession } from '@clerk/nextjs'
import { createClient } from '@supabase/supabase-js'

export function useNotifications(supabaseUserId: string | undefined) {
  const { session } = useSession()
  const [notifications, setNotifications] = useState<{ id: string; message: string; type: string; read: boolean; created_at: string }[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = useCallback(async () => {
    if (!session || !supabaseUserId) return
    const token = await session.getToken({ template: 'supabase' })
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )
    const { data } = await sb.from('notifications').select('*')
      .eq('user_id', supabaseUserId).order('created_at', { ascending: false }).limit(20)
    if (data) {
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.read).length)
    }
  }, [session, supabaseUserId])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  const markAllRead = useCallback(async () => {
    if (!session || !supabaseUserId) return
    const token = await session.getToken({ template: 'supabase' })
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )
    await sb.from('notifications').update({ read: true }).eq('user_id', supabaseUserId)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }, [session, supabaseUserId])

  return { notifications, unreadCount, markAllRead, refetch: fetchNotifications }
}
