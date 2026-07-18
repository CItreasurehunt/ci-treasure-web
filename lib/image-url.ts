// Single source of truth for the thumb-file naming convention (I-129).
// Every upload path (upload-action.ts, rehost-image.ts, photo-actions.ts, plus
// the Python enrichment scripts' thumb_object_path()) and every read path
// (event-card.tsx, VenueCard) must go through this — never re-derive the
// suffix inline, or write and read can drift apart.
//
// No DB column for this: the thumb path is a pure function of image_url, and
// every upload path is required to write both files together (see the I-129
// spec for why a `thumb_url` column was considered and rejected).
export function getThumbUrl(imageUrl: string): string {
  return imageUrl.replace(/\.[a-zA-Z0-9]+$/, "-thumb.jpg");
}
