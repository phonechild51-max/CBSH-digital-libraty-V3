'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from '@clerk/nextjs'
import { createClient } from '@supabase/supabase-js'

interface Notification {
  id: string
  message: string
  type: string
  read: boolean
  created_at: string
}

export function useNotifications(supabaseUserId: string | undefined) {
  const { session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  // Memoised Supabase client — rebuilt only when the session token changes.
  const tokenRef = useRef<string | null>(null)
  const sbRef = useRef<ReturnType<typeof createClient> | null>(null)

  const getClient = useCallback(async () => {
    if (!session) return null
    const token = await session.getToken({ template: 'supabase' })
    if (!token) return null
    if (token !== tokenRef.current || !sbRef.current) {
      tokenRef.current = token
      sbRef.current = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      )
    }
    return sbRef.current
  }, [session])

  const fetchNotifications = useCallback(async () => {
    if (!session || !supabaseUserId) return
    const sb = await getClient()
    if (!sb) return
    const { data } = await sb
      .from('notifications')
      .select('id, message, type, read, created_at')
      .eq('user_id', supabaseUserId)
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) {
      const typed = data as Notification[]
      setNotifications(typed)
      setUnreadCount(typed.filter(n => !n.read).length)
    }
  }, [session, supabaseUserId, getClient])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  // ── Realtime subscription ──────────────────────────────────────────────────
  // Listen for new INSERT events on the notifications table for this user.
  // Badge count and list update without any page reload.
  useEffect(() => {
    if (!supabaseUserId || !session) return

    let channelRef: ReturnType<ReturnType<typeof createClient>['channel']> | null = null

    const subscribe = async () => {
      const sb = await getClient()
      if (!sb) return

      channelRef = sb
        .channel(`notifications:${supabaseUserId}-${Math.random().toString(36).substring(2, 9)}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${supabaseUserId}`,
          },
          (payload) => {
            const newNotif = payload.new as Notification
            setNotifications(prev => [newNotif, ...prev].slice(0, 20))
            setUnreadCount(prev => prev + 1)
          }
        )
        .subscribe()
    }

    subscribe()

    return () => {
      if (channelRef) {
        getClient().then(sb => {
          if (sb && channelRef) sb.removeChannel(channelRef)
        })
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabaseUserId, session])
  // ──────────────────────────────────────────────────────────────────────────

  const markAllRead = useCallback(async () => {
    if (!session || !supabaseUserId) return
    const sb = await getClient()
    if (!sb) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (sb as any)
      .from('notifications')
      .update({ read: true })
      .eq('user_id', supabaseUserId)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }, [session, supabaseUserId, getClient])

  return { notifications, unreadCount, markAllRead, refetch: fetchNotifications }
}
