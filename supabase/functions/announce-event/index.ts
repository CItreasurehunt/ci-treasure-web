import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!
const CHAT_ID   = Deno.env.get('TELEGRAM_PUBLIC_CHAT_ID')!
const FESTIVAL_THREAD_ID  = Number(Deno.env.get('TELEGRAM_PUBLIC_THREAD_ID')!)
const WORKSHOP_THREAD_IDS: Record<string, number> = {
  americas: Number(Deno.env.get('TELEGRAM_WORKSHOP_AMERICAS_THREAD_ID')!),
  emea:     Number(Deno.env.get('TELEGRAM_WORKSHOP_EMEA_THREAD_ID')!),
  apac:     Number(Deno.env.get('TELEGRAM_WORKSHOP_APAC_THREAD_ID')!),
}

// Same three business regions as lib/continents.ts's CONTINENT_COUNTRIES — duplicated here
// because edge functions run standalone in Deno and can't import from lib/. Keep in sync if
// that list changes.
const CONTINENT_COUNTRIES: Record<string, string[]> = {
  americas: [
    "AG","AR","BB","BO","BR","BS","BZ","CA","CL","CO","CR","CU","DM","DO","EC","GD",
    "GT","GY","HN","HT","JM","KN","LC","MX","NI","PA","PE","PR","PY","SR","SV","TT",
    "US","UY","VC","VE",
  ],
  emea: [
    "AD","AL","AT","BA","BE","BG","BY","CH","CY","CZ","DE","DK","EE","ES","FI","FR",
    "GB","GR","HR","HU","IE","IS","IT","LI","LT","LU","LV","MC","MD","ME","MK","MT",
    "NL","NO","PL","PT","RO","RS","SE","SI","SK","SM","UA","XK",
    "AM","AZ","GE","RU",
    "TR",
    "AE","BH","IQ","IR","IL","JO","KW","LB","OM","PS","QA","SA","SY","YE",
    "AO","BF","BI","BJ","BW","CD","CF","CG","CI","CM","CV","DJ","DZ","EG","ER","ET",
    "GA","GH","GM","GN","GQ","GW","KE","KM","LR","LS","LY","MA","MG","ML","MR","MU",
    "MW","MZ","NA","NE","NG","RW","SC","SD","SL","SN","SO","SS","ST","SZ","TD","TG",
    "TN","TZ","UG","ZA","ZM","ZW",
  ],
  apac: [
    "AF","BD","BT","IN","LK","MV","NP","PK",
    "BN","ID","KH","LA","MM","MY","PH","SG","TH","TL","VN",
    "CN","HK","JP","KP","KR","MN","MO","TW",
    "KG","KZ","TJ","TM","UZ",
    "AU","FJ","NZ","PG","SB","TO","VU","WS",
  ],
}

function regionFor(country: string): string | null {
  for (const [region, codes] of Object.entries(CONTINENT_COUNTRIES)) {
    if (codes.includes(country)) return region
  }
  return null
}

// Day-span (inclusive), not nights: Thu-Sun = 4 days = festival topic; Fri-Sun = 3 days =
// regional workshop topic. Decided 2026-07-14.
function daySpan(start: string, end: string | null): number {
  if (!end) return 1
  const s = new Date(start + 'T00:00:00Z')
  const e = new Date(end + 'T00:00:00Z')
  return Math.round((e.getTime() - s.getTime()) / 86400000) + 1
}

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
  // bracketed tag naming the discipline(s), so a CI-only reader can decide to skip at a
  // glance. Any event that includes Contact Improvisation gets no tag, even if it also
  // lists other disciplines (2026-07-14: an event tagged CI + something else was wrongly
  // getting a tag before).
  const disciplines: string[] = event.discipline ?? []
  const isCi = disciplines.includes('contact_improvisation')
  const disciplineTag = !isCi && disciplines.length ? `[${disciplines.join(', ')}] ` : ''

  const text  = `New: ${disciplineTag}${toFlag(event.country)} ${formatDates(event.start_date, event.end_date)} — [${title}](${url}), ${location}`

  // 4+ days -> festival topic. Fewer -> regional workshop topic by event.country; falls back
  // to the festival topic if the country isn't in any region bucket (unmapped code) so an
  // event never silently fails to announce.
  const days = daySpan(event.start_date, event.end_date)
  const threadId = days >= 4
    ? FESTIVAL_THREAD_ID
    : WORKSHOP_THREAD_IDS[regionFor(event.country) ?? ''] ?? FESTIVAL_THREAD_ID

  const tgRes  = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      message_thread_id: threadId,
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
    thread_id:   threadId,
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
