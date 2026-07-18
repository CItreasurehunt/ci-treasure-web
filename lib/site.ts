export const SITE_URL = "https://citreasurehunt.com";
// Referenced explicitly on pages without their own entity photo — Next's
// automatic opengraph-image.jpg fallback only reaches statically-exported
// `metadata`, not pages using `generateMetadata` (confirmed: homepage gets
// the fallback, /teachers/[slug] with no photo does not, despite an
// otherwise identical openGraph shape).
export const SITE_OG_IMAGE = `${SITE_URL}/opengraph-image.jpg`;
export const TELEGRAM_URL = "https://t.me/citreasurehunt";
export const FACEBOOK_URL = "https://www.facebook.com/citreasurehunt/";
export const INSTAGRAM_URL = "https://www.instagram.com/citreasurehunt/";
export const NEWSLETTER_URL =
  process.env.NEXT_PUBLIC_NEWSLETTER_URL || "https://citreasurehunt.eo.page/7y7hk";
