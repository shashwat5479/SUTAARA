// Password rules for NEW passwords only (sign-up, change password, staff
// accounts). Existing customers can still sign in with whatever they have.
const COMMON = new Set([
  'password', 'password1', 'password123', '12345678', '123456789', '1234567890', 'qwertyui', 'qwerty123',
  'iloveyou', 'abc12345', 'admin123', 'welcome1', 'welcome123', 'letmein1', 'sutaara', 'sutaara123',
  'india123', 'india@123', 'pass1234', 'passw0rd', 'qazwsx123', '11111111', '00000000', '88888888',
  '987654321', 'monkey123', 'dragon123', 'football1', 'princess1', 'sunshine1', 'whatever1', 'changeme',
]);

export function passwordProblem(password, { email = '', name = '' } = {}) {
  if (typeof password !== 'string') return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (password.length > 72) return 'Password must be 72 characters or fewer';
  const lower = password.toLowerCase();
  if (COMMON.has(lower) || /^(.)\1+$/.test(password)) return 'That password is too easy to guess — please choose a less common one';
  if (email && lower === String(email).toLowerCase()) return 'Password cannot be the same as your email';
  if (name && lower === String(name).toLowerCase().replace(/\s+/g, '')) return 'Password cannot be your name';
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) return 'Please use both letters and numbers in your password';
  return null;
}

// Cost 12 ≈ 4× the work of the old cost 10 — meaningfully slower for an
// attacker cracking a stolen hash, still ~250 ms for a real login.
export const BCRYPT_COST = 12;
