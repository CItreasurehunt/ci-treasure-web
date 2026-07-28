export const SITE_URL = "https://citreasurehunt.com";
// Referenced explicitly on pages without their own entity photo — Next's
// automatic opengraph-image.jpg fallback only reaches statically-exported
// `metadata`, not pages using `generateMetadata` (confirmed: homepage gets
// the fallback, /teachers/[slug] with no photo does not, despite an
// otherwise identical openGraph shape).
export const SITE_OG_IMAGE = `${SITE_URL}/opengraph-image.jpg`;

// Facebook's crawler (unlike Telegram's, which just probes the image directly) wants explicit
// og:image:width/height/type to reliably render a preview — the homepage gets these for free from
// Next's automatic file-based opengraph-image.jpg convention, but generateMetadata pages (this
// fallback) don't, since specifying the URL manually bypasses that. Dimensions are of the static
// fallback file itself (app/opengraph-image.jpg, confirmed via `file`: 1280x1024 JPEG) — only
// valid when actually falling back to it, not when an entity has its own photo of unknown size.
export function ogImage(entityImageUrl?: string | null) {
  if (entityImageUrl) return { url: entityImageUrl };
  return { url: SITE_OG_IMAGE, width: 1280, height: 1024, type: "image/jpeg" };
}

export const TELEGRAM_URL = "https://t.me/citreasurehunt";
export const FACEBOOK_URL = "https://www.facebook.com/citreasurehunt/";
export const INSTAGRAM_URL = "https://www.instagram.com/citreasurehunt/";
export const NEWSLETTER_URL =
  process.env.NEXT_PUBLIC_NEWSLETTER_URL || "https://citreasurehunt.eo.page/7y7hk";
