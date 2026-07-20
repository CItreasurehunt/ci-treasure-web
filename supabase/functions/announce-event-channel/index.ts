import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BOT_TOKEN    = Deno.env.get('TELEGRAM_BOT_TOKEN')!
const CHANNEL_CHAT = '@citreasurelist'

// Public channel — richer than the group message (I-018a's announce-event): a photo card with
// price/level/teachers, not a terse one-liner. See docs/issues/i-138-multichannel-event-distribution.md
// for the full design rationale (why each field is/isn't included, why each emoji was picked).

const TYPE_EMOJI: Record<string, string> = {
  jam: '✨', long_jam: '✨', workshop: '✋', training: '🎓', festival: '🎪',
  retreat: '🌿', camp: '⛺', intensive: '💫', residency: '🏡', class: '📚',
  lab: '🔬', underscore: '⭕', cdp: '🌀', performance: '🎭', lecture: '🎤', other: '📌',
}

const LEVEL_LABEL: Record<string, string> = {
  all_levels: 'All levels', mixed: 'Mixed levels', beginner: 'Beginner',
  intermediate: 'Intermediate', advanced: 'Advanced',
}

// Hashtag labels — CamelCase, no spaces (Telegram hashtags break on whitespace/punctuation).
const TYPE_HASHTAG: Record<string, string> = {
  jam: 'Jam', long_jam: 'Jam', workshop: 'Workshop', training: 'Training', festival: 'Festival',
  retreat: 'Retreat', camp: 'Camp', intensive: 'Intensive', residency: 'Residency', class: 'Class',
  lab: 'Lab', underscore: 'Underscore', cdp: 'CDP', performance: 'Performance', lecture: 'Lecture',
}

// Every discipline present gets a hashtag, including CI (as #CI) — see the note at the call site
// for why #CI isn't skipped as a "baseline" tag.
const DISCIPLINE_HASHTAG: Record<string, string> = {
  contact_improvisation: 'CI', somatic_movement: 'SomaticMovement',
  dance_improvisation: 'DanceImprovisation', dance_theatre: 'DanceTheatre',
  authentic_movement: 'AuthenticMovement', bmc: 'BMC', butoh: 'Butoh',
  conscious_dance: 'ConsciousDance', contemporary_dance: 'ContemporaryDance',
  acroyoga: 'AcroYoga',
}

// Country names for hashtags — covers every country currently in the DB (checked 2026-07-20) plus
// a handful of likely future ones. Falls back to the raw ISO code for anything not listed here, so
// an unmapped country never breaks a post.
const COUNTRY_NAME: Record<string, string> = {
  DE: 'Germany', US: 'USA', IT: 'Italy', ES: 'Spain', FR: 'France', CA: 'Canada', GB: 'UK',
  NL: 'Netherlands', PT: 'Portugal', GR: 'Greece', NO: 'Norway', ID: 'Indonesia',
  CH: 'Switzerland', TH: 'Thailand', IN: 'India', PL: 'Poland', AT: 'Austria', MD: 'Moldova',
  UA: 'Ukraine', PE: 'Peru', SK: 'Slovakia', DK: 'Denmark', TR: 'Turkey', HR: 'Croatia',
  SE: 'Sweden', LT: 'Lithuania', CZ: 'Czechia', KR: 'SouthKorea', AU: 'Australia', MX: 'Mexico',
  CN: 'China', HU: 'Hungary', FI: 'Finland', AR: 'Argentina', EC: 'Ecuador', BR: 'Brazil',
  BE: 'Belgium', IE: 'Ireland', RO: 'Romania', BG: 'Bulgaria', SI: 'Slovenia', EE: 'Estonia',
  LV: 'Latvia', IS: 'Iceland', JP: 'Japan', IL: 'Israel', ZA: 'SouthAfrica', NZ: 'NewZealand',
  CO: 'Colombia', CL: 'Chile', UY: 'Uruguay', CR: 'CostaRica',
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Matches slugify() in ci-treasure-web/lib/events.ts (SLUG_CHAR_MAP omitted — NFD-normalize
// already strips ł/ø/đ/ð/þ/å-style diacritics down to their base letter for this purpose).
// The site 301-redirects a bare short_id URL to this full slug, so posting the slug directly
// avoids the extra redirect hop on every click.
function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Primary teaching roles for the headline teacher line — excludes musician/guest/assistant,
// which are secondary credits, not what "🧑‍🏫" signals.
const TEACHER_ROLES = new Set(['teacher', 'facilitator', 'intensive'])

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

type PriceItem = { amount?: number; currency?: string; description?: string }

const SKIP_KEYWORDS = ['deposit', 'single', 'day pass', 'drop-in', 'work-study']
const MAX_SUFFIX_LEN = 40

// minimumFractionDigits: 0 drops the ".00" on whole amounts (found live: "$420.00–$560.00" reads
// worse than "$420–$560") while still showing real cents when a price genuinely has them.
function fmtMoney(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat('en', {
    style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 2,
  }).format(amountMinor / 100)
}

// Truncate defensively regardless of how well the parsing above worked — free-text descriptions
// can't be fully bulletproofed (found via qIIy, whose description has no clean separator and would
// otherwise dump ~190 chars into the caption as a parenthetical).
function shortLabel(description: string): string {
  const label = description.split(' — ')[0].split(':')[0].trim()
  return label.length > MAX_SUFFIX_LEN ? `${label.slice(0, MAX_SUFFIX_LEN).trim()}…` : label
}

// Headline price. Two real patterns found in live data (2026-07-20), handled differently:
//
// 1. Sliding scale (`6cmy` Jam on Orcas Island, `MoS4` JamJam Festival) — tiers represent one
//    pay-what-you-can price, not alternative products. "First tier" is the wrong model here in
//    either direction: Orcas lists high-to-low, JamJam lists low-to-high, so picking item[0] would
//    sometimes show the ceiling as if it were the minimum. Detected via a "sliding scale" keyword
//    in the description and rendered as a min-max range instead.
// 2. Everything else — first tier in the array is the intended headline price (checked against 5
//    real live events, organizers consistently list the main/full price first, exceptions after).
//    Skip forward past any tier that looks like an add-on/exception, not the main offer
//    (deposit, single-item, day-pass, drop-in, work-study discount).
function headlinePrice(price: { items?: PriceItem[] } | null): string | null {
  const items = (price?.items ?? []).filter(
    i => typeof i.amount === 'number' && i.currency,
  ) as Required<Pick<PriceItem, 'amount' | 'currency'>>[] & PriceItem[]
  if (!items.length) return null

  const sliding = items.filter(i => (i.description ?? '').toLowerCase().includes('sliding scale'))
  if (sliding.length >= 2) {
    const currency = sliding[0].currency!
    const amounts = sliding.map(i => i.amount!)
    const lo = fmtMoney(Math.min(...amounts), currency)
    const hi = fmtMoney(Math.max(...amounts), currency)
    return lo === hi ? `${lo} (sliding scale)` : `${lo}–${hi} (sliding scale)`
  }

  const item = items.find(i => !SKIP_KEYWORDS.some(k => (i.description ?? '').toLowerCase().includes(k)))
    ?? items[0]
  if (item.amount === 0) return 'Free'
  const formatted = fmtMoney(item.amount!, item.currency!)
  const suffix = item.description ? ` (${shortLabel(item.description)})` : ''
  return `From ${formatted}${suffix}`
}

Deno.serve(async (req) => {
  const { record: event, old_record } = await req.json()

  // Only fire on first transition to 'published' — same guard as announce-event (I-018a).
  if (old_record?.status === 'published' || event?.status !== 'published') {
    return new Response('skip', { status: 200 })
  }

  // Hard safety gate: never post a cancelled event, regardless of anything else.
  if (event.cancelled) {
    return new Response('skip: cancelled', { status: 200 })
  }

  // No image, no post — this format is photo-first, unlike the group's text-only message.
  if (!event.image_url) {
    return new Response('skip: no image', { status: 200 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Dedup, and distinguish from the group's tg_announcements rows so cleanup-tg-messages
  // (which deletes anything older than 7 days) doesn't sweep up permanent channel posts —
  // see the fix to that function in this same change.
  const { data: existing } = await supabase
    .from('tg_announcements')
    .select('id')
    .eq('entity_type', 'event_channel')
    .eq('entity_id', event.id)
    .limit(1)

  if (existing?.length) {
    return new Response('already announced', { status: 200 })
  }

  // Venue name (if flagged show_in_announce) replaces city, same convention as announce-event.
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

  const { data: teacherRows } = await supabase
    .from('event_teachers')
    .select('role, profiles(name)')
    .eq('event_id', event.id)

  const teacherNames = [...new Set(
    (teacherRows ?? [])
      .filter(row => TEACHER_ROLES.has(row.role))
      // deno-lint-ignore no-explicit-any
      .map((row: any) => row.profiles?.name)
      .filter(Boolean),
  )]

  const eventUrl = `https://citreasurehunt.com/events/${event.short_id}-${slugify(event.title)}`

  const lines: string[] = [
    // Emoji only, no spelled-out type word (dropped 2026-07-20): a word like "Festival" asserts
    // a precise category our type taxonomy doesn't actually guarantee, and the "is the word
    // already in the title" redundancy check only ever worked for English titles — found via
    // qIIy (Portuguese title), which got a spurious "Festival — " prefix. An emoji is a softer,
    // approximate signal that doesn't make that false claim.
    // Title doubles as the link (2026-07-20) — HTML parse_mode, so every other interpolated
    // field below must go through escapeHtml too, not just this one.
    `${TYPE_EMOJI[event.type] ?? '📌'} <a href="${eventUrl}">${escapeHtml(event.title)}</a>`,
    `${toFlag(event.country)} ${escapeHtml(location)}`,
    `📅 ${formatDates(event.start_date, event.end_date)}`,
  ]

  const price = headlinePrice(event.price)
  const level = event.level ? LEVEL_LABEL[event.level] ?? event.level : null
  if (price || level) {
    lines.push([price ? `🏷️ ${escapeHtml(price)}` : null, level ? `📶 ${level}` : null].filter(Boolean).join(' · '))
  }

  if (teacherNames.length) {
    const shown = teacherNames.slice(0, 3)
    const rest = teacherNames.length - shown.length
    lines.push(`🧑‍🏫 ${escapeHtml(shown.join(', '))}${rest > 0 ? ` +${rest} more` : ''}`)
  }

  // Hashtags: country + type always, plus every discipline present — including CI itself
  // (as #CI, not spelled out). Tagging CI too, not just the non-CI extras, matters because a few
  // published events (e.g. dance_improvisation-only festivals) have no CI discipline at all — on
  // a channel branded "CI Treasure Hunt", omitting #CI from CI events would make CI and non-CI
  // events indistinguishable by hashtag alone.
  const hashtags: string[] = [
    `#${COUNTRY_NAME[event.country] ?? event.country}`,
  ]
  if (TYPE_HASHTAG[event.type]) hashtags.push(`#${TYPE_HASHTAG[event.type]}`)
  for (const d of (event.discipline ?? [])) {
    if (DISCIPLINE_HASHTAG[d]) hashtags.push(`#${DISCIPLINE_HASHTAG[d]}`)
  }

  const caption = `${lines.join('\n')}\n\n${hashtags.join(' ')}`

  const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHANNEL_CHAT,
      photo: event.image_url,
      caption,
      parse_mode: 'HTML',
    }),
  })
  const tgData = await tgRes.json()

  if (!tgData.ok) {
    console.error('Telegram error:', JSON.stringify(tgData))
    return new Response('telegram error', { status: 500 })
  }

  await supabase.from('tg_announcements').insert({
    entity_type: 'event_channel',
    entity_id:   event.id,
    chat_id:     tgData.result.chat.id,
    message_id:  tgData.result.message_id,
  })

  console.log(`Channel-announced: ${event.short_id} — ${event.title}`)
  return new Response('ok', { status: 200 })
})
