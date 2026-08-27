// One-off admin utility: promote (or create) a Super Admin, and optionally
// remove the old default admin account.
//
// Usage:
//   node src/utils/makeSuperAdmin.js <email> <password>
//   node src/utils/makeSuperAdmin.js sutaara@gmail.com "sutaara@2323"
//
// - If the email exists, it's set to role=superadmin with the given password.
// - If not, a new superadmin account is created.
// - The legacy default admin (admin@sutaara.in) is demoted to a normal user
//   so the insecure default can no longer sign into the admin panel.
import bcrypt from 'bcryptjs';
import { prisma } from '../config/db.js';

async function run() {
  const [, , emailArg, passwordArg] = process.argv;
  if (!emailArg || !passwordArg) {
    console.error('Usage: node src/utils/makeSuperAdmin.js <email> <password>');
    process.exit(1);
  }
  const email = emailArg.toLowerCase().trim();
  if (passwordArg.length < 6) {
    console.error('Password must be at least 6 characters.');
    process.exit(1);
  }

  const hashed = await bcrypt.hash(passwordArg, 10);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { role: 'superadmin', password: hashed, authProvider: 'password', emailVerified: true },
    });
    console.log(`Updated ${email} -> Super Admin (password reset).`);
  } else {
    await prisma.user.create({
      data: {
        name: 'Sutaara Super Admin',
        email,
        password: hashed,
        role: 'superadmin',
        authProvider: 'password',
        emailVerified: true,
      },
    });
    console.log(`Created ${email} as Super Admin.`);
  }

  // Demote the insecure default admin, if it still exists and isn't the same
  // account we just set up.
  const legacyEmail = 'admin@sutaara.in';
  if (legacyEmail !== email) {
    const legacy = await prisma.user.findUnique({ where: { email: legacyEmail } });
    if (legacy && legacy.role !== 'user') {
      await prisma.user.update({ where: { email: legacyEmail }, data: { role: 'user' } });
      console.log(`Demoted legacy default admin (${legacyEmail}) to a normal customer.`);
    }
  }

  await prisma.$disconnect();
  console.log('Done.');
  process.exit(0);
}

run().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
