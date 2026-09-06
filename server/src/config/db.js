import { PrismaClient } from '@prisma/client';

// Reuse a single client across hot-reloads / serverless invocations
// instead of exhausting Postgres connections.
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__sutaaraPrisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__sutaaraPrisma = prisma;
}

export async function connectDB() {
  try {
    await prisma.$connect();
    console.log('PostgreSQL connected via Prisma');
  } catch (err) {
    console.error('PostgreSQL connection error:', err.message);
    console.error('Is Postgres running and DATABASE_URL correct in server/.env?');
    process.exit(1);
  }
}
