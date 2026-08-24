import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../config/db.js';
import { asyncHandler } from '../middleware/error.js';
import { signToken } from '../utils/token.js';
import { withMongoStyleId } from '../utils/serialize.js';
import { sendOtpEmail, isConfigured as mailerConfigured } from '../services/mailer.js';
import crypto from 'crypto';

const OTP_TTL_MIN = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_SEC = 60;

// crypto.randomInt is uniform and cryptographically secure — Math.random()
// is neither, and a guessable verification code defeats the whole point.
const makeOtp = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
const hashOtp = (code) => crypto.createHash('sha256').update(code).digest('hex');

// Creates (or replaces) the pending code for an address and emails it.
async function issueOtp(email, name) {
  // Only one live code per address: issuing a new one invalidates the old.
  await prisma.emailOtp.deleteMany({ where: { email, purpose: 'verify_email' } });
  const code = makeOtp();
  await prisma.emailOtp.create({
    data: {
      email,
      codeHash: hashOtp(code),
      purpose: 'verify_email',
      expiresAt: new Date(Date.now() + OTP_TTL_MIN * 60_000),
    },
  });
  await sendOtpEmail(email, code, name);
}

const publicUser = (u) => withMongoStyleId({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  phone: u.phone,
  avatar: u.avatar,
  authProvider: u.authProvider,
});

const googleClient = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Name, email and password are required');
  }
  if (password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }
  const normalizedEmail = email.toLowerCase().trim();
  const exists = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (exists) {
    // An unverified password account is just an unproven claim on this
    // address — nobody has shown they own it, and it holds no orders or
    // history. Letting a new sign-up take it over (with a fresh code) stops
    // someone locking the real owner out by registering their address first.
    // A verified account, or one linked to Google, is never overwritten.
    const claimable = !exists.emailVerified && exists.authProvider === 'password' && !exists.googleId;
    if (!claimable) {
      res.status(409);
      throw new Error('An account with that email already exists');
    }
  }
  // Refuse to create password accounts we can never verify, rather than
  // letting people register into a permanently locked-out state.
  if (process.env.NODE_ENV === 'production' && !mailerConfigured()) {
    res.status(503);
    throw new Error('Email sign-up is temporarily unavailable — please continue with Google');
  }

  const hashed = await bcrypt.hash(password, 10);
  // upsert rather than create: the claimable-unverified case above falls
  // through to here and replaces the placeholder account's details.
  const user = await prisma.user.upsert({
    where: { email: normalizedEmail },
    update: { name, password: hashed, phone: phone || '', emailVerified: false },
    create: {
      name,
      email: normalizedEmail,
      password: hashed,
      phone: phone || '',
      emailVerified: false,
    },
  });

  await issueOtp(normalizedEmail, name);

  // Deliberately NO token here — the account exists but cannot be used until
  // the address is verified, so there is nothing to sign in with yet.
  res.status(201).json({
    needsVerification: true,
    email: normalizedEmail,
    message: 'Check your email for a 6-digit verification code',
  });
});

// POST /api/auth/verify-email — body: { email, code }
export const verifyEmail = asyncHandler(async (req, res) => {
  const email = (req.body.email || '').toLowerCase().trim();
  const code = (req.body.code || '').trim();
  if (!email || !code) {
    res.status(400);
    throw new Error('Email and code are required');
  }

  const record = await prisma.emailOtp.findFirst({
    where: { email, purpose: 'verify_email' },
    orderBy: { createdAt: 'desc' },
  });
  if (!record) {
    res.status(400);
    throw new Error('No verification pending for this email — request a new code');
  }
  if (record.expiresAt < new Date()) {
    await prisma.emailOtp.delete({ where: { id: record.id } });
    res.status(400);
    throw new Error('That code has expired — request a new one');
  }
  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    await prisma.emailOtp.delete({ where: { id: record.id } });
    res.status(429);
    throw new Error('Too many incorrect attempts — request a new code');
  }

  // timingSafeEqual over the hashes so a wrong code can't be narrowed down
  // by measuring how long the comparison takes.
  const given = Buffer.from(hashOtp(code));
  const stored = Buffer.from(record.codeHash);
  const ok = given.length === stored.length && crypto.timingSafeEqual(given, stored);

  if (!ok) {
    await prisma.emailOtp.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    res.status(400);
    throw new Error('That code is not correct');
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(404);
    throw new Error('Account not found');
  }

  const updated = await prisma.user.update({
    where: { email },
    data: { emailVerified: true },
  });
  await prisma.emailOtp.deleteMany({ where: { email, purpose: 'verify_email' } });

  res.json({ user: publicUser(updated), token: signToken(updated.id) });
});

// POST /api/auth/resend-code — body: { email }
export const resendCode = asyncHandler(async (req, res) => {
  const email = (req.body.email || '').toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });

  // Always answer the same way regardless of whether the account exists or is
  // already verified — otherwise this endpoint becomes a way to check which
  // email addresses are registered.
  const generic = { message: 'If that account needs verification, a new code is on its way' };

  if (!user || user.emailVerified) return res.json(generic);

  const recent = await prisma.emailOtp.findFirst({
    where: { email, purpose: 'verify_email' },
    orderBy: { createdAt: 'desc' },
  });
  if (recent && Date.now() - recent.createdAt.getTime() < OTP_RESEND_COOLDOWN_SEC * 1000) {
    res.status(429);
    throw new Error(`Please wait ${OTP_RESEND_COOLDOWN_SEC} seconds before requesting another code`);
  }

  await issueOtp(email, user.name);
  res.json(generic);
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email: (email || '').toLowerCase().trim() } });
  // Bug fix carried over from the Mongo version: always run bcrypt.compare even
  // when no user is found, so login timing doesn't leak whether an email exists.
  const hash = user?.password || '$2a$10$invalidsaltinvalidsaltinvalidsalu';
  const ok = await bcrypt.compare(password || '', hash);
  if (!user || !ok) {
    // A Google-only account has no password hash, so it always fails the check
    // above — give it a clearer message instead of the generic invalid-login one.
    if (user && !user.password) {
      res.status(401);
      throw new Error('This account signs in with Google — use the "Continue with Google" button');
    }
    res.status(401);
    throw new Error('Invalid email or password');
  }
  // Password was correct, but an unverified address means we still don't know
  // the person owns it — re-issue a code and send them to the verify step
  // instead of signing them in.
  if (!user.emailVerified) {
    await issueOtp(user.email, user.name);
    res.status(403);
    res.json({
      needsVerification: true,
      email: user.email,
      message: 'Please verify your email — we have sent you a new code',
    });
    return;
  }

  res.json({ user: publicUser(user), token: signToken(user.id) });
});

// POST /api/auth/google — body: { credential } (the ID token from Google Identity Services)
// Creates the account on first sign-in, or links Google to an existing
// email/password account, or logs in an existing Google account.
export const googleLogin = asyncHandler(async (req, res) => {
  if (!googleClient) {
    res.status(501);
    throw new Error('Google Sign-In is not configured — set GOOGLE_CLIENT_ID on the server');
  }
  const { credential } = req.body;
  if (!credential) {
    res.status(400);
    throw new Error('Missing Google credential');
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (err) {
    res.status(401);
    throw new Error('Could not verify Google sign-in — please try again');
  }
  if (!payload?.email_verified) {
    res.status(401);
    throw new Error('Your Google email is not verified');
  }

  const email = payload.email.toLowerCase().trim();
  let user = await prisma.user.findUnique({ where: { googleId: payload.sub } });

  if (!user) {
    // No account linked to this Google id yet — check for an existing
    // email/password account first and link it, rather than creating a duplicate.
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      user = await prisma.user.update({
        where: { id: existing.id },
        // Linking Google to an existing account also verifies the address:
        // Google confirmed ownership, which is exactly what our own code does.
        data: {
          googleId: payload.sub,
          avatar: existing.avatar || payload.picture || '',
          emailVerified: true,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          name: payload.name || email.split('@')[0],
          email,
          googleId: payload.sub,
          emailVerified: true,
          authProvider: 'google',
          avatar: payload.picture || '',
        },
      });
    }
  }

  res.json({ user: publicUser(user), token: signToken(user.id) });
});

// POST /api/auth/demo-login — creates (or reuses) a throwaway account with a
// generated placeholder email and signs straight in. No password, no OTP —
// this is a "skip sign-in" option for demos/testing, not a real identity.
// Guard it with ALLOW_DEMO_LOGIN so it can be switched off once the site is
// live and real customers are signing up.
export const demoLogin = asyncHandler(async (req, res) => {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_LOGIN !== 'true') {
    res.status(404);
    throw new Error('Not found');
  }

  const suffix = crypto.randomBytes(4).toString('hex');
  const email = `guest-${suffix}@sutaara.demo`;

  const user = await prisma.user.create({
    data: {
      name: 'Guest',
      email,
      authProvider: 'demo',
      emailVerified: true,
    },
  });

  res.json({ user: publicUser(user), token: signToken(user.id) });
});

// GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

// PUT /api/auth/me
export const updateMe = asyncHandler(async (req, res) => {
  const data = {};
  if (req.body.name) data.name = req.body.name;
  if (req.body.phone !== undefined) data.phone = req.body.phone;
  if (req.body.password) {
    if (req.body.password.length < 6) {
      res.status(400);
      throw new Error('Password must be at least 6 characters');
    }
    data.password = await bcrypt.hash(req.body.password, 10);
  }
  const user = await prisma.user.update({ where: { id: req.user.id }, data });
  res.json({ user: publicUser(user) });
});

// ----- Saved addresses (new — supports the "multiple delivery addresses" feature) -----

// GET /api/auth/addresses
export const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await prisma.address.findMany({
    where: { userId: req.user.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
  res.json(withMongoStyleId(addresses));
});

// POST /api/auth/addresses
export const addAddress = asyncHandler(async (req, res) => {
  const { label, fullName, phone, line1, line2, city, state, pincode, isDefault } = req.body;
  if (!fullName || !phone || !line1 || !city || !state || !pincode) {
    res.status(400);
    throw new Error('Full name, phone, address line 1, city, state and pincode are required');
  }
  if (isDefault) {
    await prisma.address.updateMany({ where: { userId: req.user.id }, data: { isDefault: false } });
  }
  const address = await prisma.address.create({
    data: {
      userId: req.user.id,
      label: label || 'Home',
      fullName,
      phone,
      line1,
      line2: line2 || '',
      city,
      state,
      pincode,
      isDefault: Boolean(isDefault),
    },
  });
  res.status(201).json(withMongoStyleId(address));
});

// DELETE /api/auth/addresses/:id
export const deleteAddress = asyncHandler(async (req, res) => {
  const address = await prisma.address.findUnique({ where: { id: req.params.id } });
  if (!address || address.userId !== req.user.id) {
    res.status(404);
    throw new Error('Address not found');
  }
  await prisma.address.delete({ where: { id: req.params.id } });
  res.json({ message: 'Address removed' });
});