import { headers } from 'next/headers'
import { Webhook } from 'svix'
import { createServerClient } from '@/lib/supabase/server'

interface ClerkWebhookEvent {
  type: string
  data: {
    id: string
    email_addresses: { email_address: string }[]
    first_name: string | null
    last_name: string | null
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

  if (event.type === 'user.created') {
    const { id, email_addresses, first_name, last_name } = event.data
    const email = email_addresses[0]?.email_address
    const name =
      `${first_name ?? ''} ${last_name ?? ''}`.trim() || email || 'Unknown'

    const { error } = await createServerClient()
      .from('users')
      .upsert(
        {
          insforge_uid: id,
          name,
          email,
          role: 'student',
          status: 'pending',
        },
        { onConflict: 'insforge_uid' }
      )

    if (error) {
      console.error('Supabase Insertion Error:', error)
      return new Response('Database Error', { status: 500 })
    }
  }

  return new Response('OK', { status: 200 })
}
