/**
 * Normalizes image URLs, translating known third-party viewer pages (e.g. ImgBB page links)
 * to direct CDN or optimized local assets.
 */
export function normalizeImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;

  // ImgBB share page for Zain Rawashdeh -> use direct local high-res asset
  if (trimmed.includes('ibb.co/8LPrHNZw')) {
    return '/assets/aistudio/zain-rawashdeh.jpg';
  }

  return trimmed;
}
