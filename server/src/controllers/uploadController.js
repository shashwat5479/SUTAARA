import crypto from 'crypto';
import { asyncHandler } from '../middleware/error.js';

// Product/site photos are uploaded by staff straight from the browser to
// Cloudinary. Previously that used a public "unsigned" preset — anyone who read
// the page source could upload files (or videos) to the account and burn its
// storage and bandwidth credits. Now the server signs each upload for a logged-in
// staff member only, restricted to the folder and file types the store needs.
const ALLOWED = 'jpg,jpeg,png,webp,avif,heic,mp4,mov,webm';

// POST /api/uploads/sign — staff or above
export const signUpload = asyncHandler(async (req, res) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    res.status(503);
    throw new Error('Signed uploads are not configured');
  }
  const timestamp = Math.round(Date.now() / 1000);
  const folder = 'sutaara';
  // Cloudinary signs the sorted "key=value" pairs followed by the secret.
  const toSign = `allowed_formats=${ALLOWED}&folder=${folder}&timestamp=${timestamp}`;
  const signature = crypto.createHash('sha1').update(toSign + apiSecret).digest('hex');
  res.json({ cloudName, apiKey, timestamp, folder, allowedFormats: ALLOWED, signature });
});
