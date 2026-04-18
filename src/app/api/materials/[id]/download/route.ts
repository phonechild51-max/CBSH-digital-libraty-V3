import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: materialId } = await params
  const sb = createServerClient()

  // Verify user is approved
  const { data: user } = await sb
    .from('users')
    .select('id, status')
    .eq('insforge_uid', userId)
    .single()

  if (!user || user.status !== 'approved') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get material
  const { data: material } = await sb
    .from('materials')
    .select('insforge_file_key, title')
    .eq('id', materialId)
    .single()

  if (!material || !material.insforge_file_key) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Generate signed URL (1 hour expiry)
  const { data: signed } = await sb.storage
    .from('cbsh-library')
    .createSignedUrl(material.insforge_file_key, 3600)

  if (!signed?.signedUrl) {
    return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 })
  }

  // Deduplication: only record a new download if the user hasn't
  // downloaded this material in the last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count: recentCount } = await sb
    .from('downloads')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('material_id', materialId)
    .gte('downloaded_at', oneHourAgo)

  if ((recentCount ?? 0) === 0) {
    // Increment download count atomically
    await sb.rpc('increment_download_count', { material_uuid: materialId })
    // Record download
    await sb.from('downloads').insert({
      user_id: user.id,
      material_id: materialId,
    })
  }

  return NextResponse.json({ url: signed.signedUrl })
}
