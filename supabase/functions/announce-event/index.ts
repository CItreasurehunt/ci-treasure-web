import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!
const CHAT_ID   = Deno.env.get('TELEGRAM_PUBLIC_CHAT_ID')!
const THREAD_ID = Number(Deno.env.get('TELEGRAM_PUBLIC_THREAD_ID')!)

Deno.serve(async (req) => {

  const { record: event, old_record } = await req.json()

  // Only fire when status transitions to 'published' for the first time
  if (old_record?.status === 'published' || event?.status !== 'published') {
    return new Response('skip', { status: 200 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Dedup: skip if already announced (e.g. webhook fired twice)
  const { data: existing } = await supabase
    .from('tg_announcements')
    .select('id')
    .eq('entity_type', 'event')
    .eq('entity_id', event.id)
    .limit(1)

  if (existing?.length) {
    return new Response('already announced', { status: 200 })
  }

  // Use announce_name (if set) or venue name for known venues; city otherwise
  let location: string = event.city
  if (event.venue_id) {
    const { data: venue } = await supabase
      .from('venues')
      .select('show_in_announce, name, announce_name')
      .eq('id', event.venue_id)
      .single()
    if (venue?.show_in_announce) {
      location = venue.announce_name ?? venue.name
    }
  }

  // Build message — same format as announce.py
  const title = event.title.replace(/\[/g, '(').replace(/\]/g, ')')
  const url   = `https://citreasurehunt.com/events/${event.short_id}`

  // Non-CI events still announce (decided 2026-07-04: mark, don't skip) — a lowercase
  // bracketed tag naming the adjacent discipline(s), so a CI-only reader can decide to
  // skip at a glance. Pure-CI events (the overwhelming majority) get no tag at all.
  const nonCiDisciplines: string[] = (event.discipline ?? []).filter(
    (d: string) => d !== 'contact_improvisation'
  )
  const disciplineTag = nonCiDisciplines.length ? `[${nonCiDisciplines.join(', ')}] ` : ''

  const text  = `New: ${disciplineTag}${toFlag(event.country)} ${formatDates(event.start_date, event.end_date)} — [${title}](${url}), ${location}`

  const tgRes  = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      message_thread_id: THREAD_ID,
      text,
      parse_mode: 'Markdown',
      link_preview_options: { is_disabled: true },
    }),
  })
  const tgData = await tgRes.json()

  if (!tgData.ok) {
    console.error('Telegram error:', JSON.stringify(tgData))
    return new Response('telegram error', { status: 500 })
  }

  await supabase.from('tg_announcements').insert({
    entity_type: 'event',
    entity_id:   event.id,
    chat_id:     Number(CHAT_ID),
    thread_id:   THREAD_ID,
    message_id:  tgData.result.message_id,
  })

  console.log(`Announced: ${event.short_id} — ${event.title}`)
  return new Response('ok', { status: 200 })
})

function toFlag(code: string): string {
  return [...code.toUpperCase()].map(c =>
    String.fromCodePoint(c.charCodeAt(0) + 127397),
  ).join('')
}

function formatDates(start: string, end: string | null): string {
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const s = new Date(start + 'T00:00:00Z')
  const sm = MONTHS[s.getUTCMonth()], sd = s.getUTCDate()
  if (!end || end === start) return `${sm} ${sd}`
  const e  = new Date(end + 'T00:00:00Z')
  const em = MONTHS[e.getUTCMonth()], ed = e.getUTCDate()
  return s.getUTCMonth() === e.getUTCMonth()
    ? `${sm} ${sd}-${ed}`
    : `${sm} ${sd}-${em} ${ed}`
}
