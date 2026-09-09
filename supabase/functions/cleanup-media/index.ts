import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (request) => {
  const expected = Deno.env.get('CLEANUP_SECRET')
  if (!expected || request.headers.get('x-cleanup-secret') !== expected) {
    return response({ error: 'NOT_AUTHORIZED' }, 401)
  }

  const client = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
  const now = new Date().toISOString()
  const retentionCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const expired = await readAll(client, 'photo_revisions', '*', q => q.lte('expires_at', now))

  const [current, retained, events, deleted, { data: content }] = await Promise.all([
    readAll(client, 'photos', 'id,image_path,original_path,private_image_path', q => q.or(`deleted_at.is.null,deleted_at.gt.${retentionCutoff}`)),
    readAll(client, 'photo_revisions', 'image_path,original_path,history_path', q => q.gt('expires_at', now)),
    readAll(client, 'events', 'image_path,original_path'),
    readAll(client, 'photos', 'id,image_path,original_path,private_image_path', q => q.eq('status', 'deleted').lte('deleted_at', retentionCutoff)),
    client.from('content').select('value').eq('key', 'servicios_suscripciones').maybeSingle().throwOnError(),
  ])
  const contentRows = Array.isArray(content?.value) ? content.value : []
  const liveRows = [...(current || []), ...(retained || []), ...(events || []), ...contentRows]
  const referencedPublic = new Set(liveRows.map((row) => row.image_path).filter(Boolean))
  const referencedOriginals = new Set(liveRows.map((row) => row.original_path).filter(Boolean))
  const referencedHistory = new Set([
    ...(retained || []).map((row) => row.history_path),
    ...(current || []).map((row) => row.private_image_path),
  ].filter(Boolean))
  const candidates = [...(expired || []), ...(deleted || [])]
  const publicPaths = unique(candidates.map((row) => row.image_path).filter((path) => path && !referencedPublic.has(path)))
  const originalPaths = unique(candidates.map((row) => row.original_path).filter((path) => path && !referencedOriginals.has(path)))
  const historyPaths = unique([
    ...(expired || []).map((row) => row.history_path),
    ...(deleted || []).map((row) => row.private_image_path),
  ].filter((path) => path && !referencedHistory.has(path)))

  await Promise.all([
    publicPaths.length ? removeFiles(client, 'media', publicPaths) : Promise.resolve(),
    originalPaths.length ? removeFiles(client, 'media-originals', originalPaths) : Promise.resolve(),
    historyPaths.length ? removeFiles(client, 'media-history', historyPaths) : Promise.resolve(),
  ])
  if (expired?.length) await client.from('photo_revisions').delete().in('id', expired.map((row) => row.id)).throwOnError()
  if (deleted?.length) await client.from('photos').delete().in('id', deleted.map((row) => row.id)).throwOnError()

  const stagingCutoff = Date.now() - 24 * 60 * 60 * 1000
  const orphanCutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
  const [staleStaging, oldPublic, oldOriginals, oldHistory] = await Promise.all([
    listFiles(client, 'media-staging', '', stagingCutoff),
    listFiles(client, 'media', '', orphanCutoff),
    listFiles(client, 'media-originals', '', orphanCutoff),
    listFiles(client, 'media-history', '', orphanCutoff),
  ])
  const orphanPublic = oldPublic.filter((path) => !referencedPublic.has(path))
  const orphanOriginals = oldOriginals.filter((path) => !referencedOriginals.has(path))
  const orphanHistory = oldHistory.filter((path) => !referencedHistory.has(path))
  if (staleStaging.length) await removeFiles(client, 'media-staging', staleStaging)
  if (orphanPublic.length) await removeFiles(client, 'media', orphanPublic)
  if (orphanOriginals.length) await removeFiles(client, 'media-originals', orphanOriginals)
  if (orphanHistory.length) await removeFiles(client, 'media-history', orphanHistory)

  return response({
    removedRevisions: expired?.length || 0,
    removedPublicFiles: publicPaths.length,
    removedOriginals: originalPaths.length,
    removedStagingFiles: staleStaging.length,
    removedHistoryFiles: historyPaths.length,
    removedOrphanFiles: orphanPublic.length + orphanOriginals.length + orphanHistory.length,
    removedDeletedPhotos: deleted?.length || 0,
  })
})

async function listFiles(client: ReturnType<typeof createClient>, bucket: string, path: string, cutoff: number): Promise<string[]> {
  const data = []
  for (let offset = 0; ; offset += 500) {
    const result = await client.storage.from(bucket).list(path, { limit: 500, offset, sortBy: { column: 'name', order: 'asc' } })
    if (result.error) throw result.error
    data.push(...(result.data || []))
    if ((result.data?.length || 0) < 500) break
  }
  const output: string[] = []
  for (const item of data) {
    const itemPath = path ? `${path}/${item.name}` : item.name
    if (item.id) {
      const created = Date.parse(item.created_at || item.updated_at || '')
      if (!Number.isNaN(created) && created < cutoff) output.push(itemPath)
    } else {
      output.push(...await listFiles(client, bucket, itemPath, cutoff))
    }
  }
  return output
}

function unique(values: string[]) { return [...new Set(values)] }
function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

async function readAll(client: ReturnType<typeof createClient>, table: string, columns: string, filter = (q: any) => q) {
  const rows: any[] = []
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await filter(client.from(table).select(columns).order('id')).range(offset, offset + 499)
    if (error) throw error
    rows.push(...(data || []))
    if ((data?.length || 0) < 500) return rows
  }
}

async function removeFiles(client: ReturnType<typeof createClient>, bucket: string, paths: string[]) {
  for (let offset = 0; offset < paths.length; offset += 100) {
    const { error } = await client.storage.from(bucket).remove(paths.slice(offset, offset + 100))
    if (error) throw error
  }
}
