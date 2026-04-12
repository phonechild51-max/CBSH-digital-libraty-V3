import { headers } from 'next/headers'
import { Webhook } from 'svix'
import { createServerClient } from '@/lib/supabase/server'

interface ClerkWebhookEvent {
  type: string
  data: {
    id: string
    email_addresses?: { email_address: string }[]
    first_name?: string | null
    last_name?: string | null
    image_url?: string | null
    username?: string | null
    deleted?: boolean
  }
}

export async function POST(req: Request) {
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!)
  const hdrs = await headers()

  let event: ClerkWebhookEvent
  try {
    event = wh.verify(await req.text(), {
      'svix-id': hdrs.get('svix-id') ?? '',
      'svix-timestamp': hdrs.get('svix-timestamp') ?? '',
      'svix-signature': hdrs.get('svix-signature') ?? '',
    }) as ClerkWebhookEvent
  } catch {
    return new Response('Invalid signature', { status: 400 })
  }

  const sb = createServerClient()

  if (event.type === 'user.created' || event.type === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url, username } = event.data
    const email = email_addresses?.[0]?.email_address
    const fullName = `${first_name ?? ''} ${last_name ?? ''}`.trim()
    const name = username || fullName || email || 'Unknown'

    const { error } = await sb
      .from('users')
      .upsert(
        {
          insforge_uid: id,
          name,
          email,
          profile_picture_url: image_url,
          ...(event.type === 'user.created' && {
            role: 'student',
            status: 'pending',
          }),
        },
        { onConflict: 'insforge_uid', ignoreDuplicates: false }
      )

    if (error) {
      console.error('Supabase Upsert Error:', error)
      return new Response('Database Error', { status: 500 })
    }
  }

  if (event.type === 'user.deleted') {
    const { id } = event.data

    const { error } = await sb
      .from('users')
      .delete()
      .eq('insforge_uid', id)

    if (error) {
      console.error('Supabase Delete Error:', error)
      return new Response('Database Error', { status: 500 })
    }
  }

  return new Response('OK', { status: 200 })
}
