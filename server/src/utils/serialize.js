// Keeps API responses shaped like the original Mongo/Mongoose output (`_id`)
// so the existing React frontend doesn't need a rewrite just because the
// database moved to Postgres. New code should feel free to use `id` too —
// both are present on every object.
export function withMongoStyleId(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  // Dates are objects too, but spreading one (`{ ...date }`) below would
  // silently produce `{}` — a Date's value lives internally, not as
  // enumerable own properties. That `{}` is what was actually being sent to
  // the frontend for every DateTime field (preferredDate, createdAt, etc.),
  // which is why `new Date(...)` on the client was showing "Invalid Date"
  // everywhere: appointment confirmations, the admin table, return request
  // dates. Return Date instances as-is instead of recursing into them.
  if (obj instanceof Date) return obj;
  if (Array.isArray(obj)) return obj.map(withMongoStyleId);
  const out = { ...obj };
  if (out.id && !out._id) out._id = out.id;
  for (const key of Object.keys(out)) {
    const val = out[key];
    if (val && typeof val === 'object') out[key] = withMongoStyleId(val);
  }
  return out;
}