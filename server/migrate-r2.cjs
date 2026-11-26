const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');

const { R2_ACCOUNT_ID, R2_KEY, R2_SECRET, R2_BUCKET } = process.env;
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_KEY, secretAccessKey: R2_SECRET },
});

const urls = fs.readFileSync('backup/urls.txt', 'utf8').split('\n').filter(Boolean);
const doneFile = 'backup/r2-done.txt';
const done = new Set(fs.existsSync(doneFile) ? fs.readFileSync(doneFile, 'utf8').split('\n') : []);

function parse(url) {
  const m = url.match(/^(.*?\/upload\/)(.+)$/);
  if (!m || !url.includes('res.cloudinary.com')) return null;
  let segs = m[2].split('?')[0].split('/');
  const vi = segs.findIndex((s) => /^v\d+$/.test(s));
  const version = vi >= 0 ? segs[vi] + '/' : '';
  segs = vi >= 0 ? segs.slice(vi + 1) : segs.filter((s) => !/^[a-z]{1,3}_/.test(s));
  const rest = segs.join('/');
  return { key: decodeURIComponent(rest), src: m[1] + version + rest };
}

async function run(url) {
  const p = parse(url);
  if (!p) return console.log('SKIP', url);
  if (done.has(p.key)) return;
  try {
    const res = await fetch(p.src);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const body = Buffer.from(await res.arrayBuffer());
    await s3.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: p.key,
      Body: body,
      ContentType: res.headers.get('content-type') || 'application/octet-stream',
      CacheControl: 'public, max-age=31536000, immutable',
    }));
    done.add(p.key);
    fs.appendFileSync(doneFile, p.key + '\n');
    console.log('ok', p.key);
  } catch (e) {
    fs.appendFileSync('backup/r2-failed.txt', url + '\n');
    console.log('FAIL', p.key, e.message);
  }
}

(async () => {
  const q = [...urls];
  await Promise.all(Array.from({ length: 5 }, async () => { while (q.length) await run(q.shift()); }));
  console.log('Finished. Uploaded:', done.size, '| check backup/r2-failed.txt for failures');
})();       