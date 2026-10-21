// Cloudinary delivery optimiser. Product photos are uploaded once at full size,
// but every shopper was downloading that full-size original. This rewrites a
// Cloudinary image URL so Cloudinary serves a right-sized copy in the best
// format for the browser (WebP/AVIF) with automatic quality — typically a
// 80–90% smaller download. Non-Cloudinary URLs (e.g. /products/x.jpg) pass
// through untouched.
//   cdn(url, 600) → .../image/upload/f_auto,q_auto,w_600,c_limit/...
export function cdn(url, width) {
  if (typeof url !== 'string' || !url.includes('res.cloudinary.com') || !url.includes('/image/upload/')) return url;
  const [head, tail] = url.split('/image/upload/');
  if (/^[a-z]{1,3}_[^/]+\//.test(tail)) return url; // already has a transformation — leave it alone
  return `${head}/image/upload/f_auto,q_auto${width ? `,w_${width},c_limit` : ''}/${tail}`;
}
