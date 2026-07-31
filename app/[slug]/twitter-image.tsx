import { renderCountryOgImage, size } from "./og-shared";

export { size };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return renderCountryOgImage(slug);
}
