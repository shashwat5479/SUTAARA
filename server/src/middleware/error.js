// Wrap async controllers so thrown errors reach the error handler
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export function notFound(req, res, next) {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || 'Server error';

  // Prisma unique-constraint violation (e.g. email or coupon code already in use)
  if (err.code === 'P2002') {
    status = 409;
    const field = Array.isArray(err.meta?.target) ? err.meta.target[0] : err.meta?.target;
    message = `That ${field || 'value'} is already in use`;
  }
  // Prisma "record to update/delete does not exist"
  if (err.code === 'P2025') {
    status = 404;
    message = err.meta?.cause || 'Record not found';
  }
  // Prisma foreign key violation (e.g. product referenced by an order was deleted)
  if (err.code === 'P2003') {
    status = 400;
    message = 'This action would break a linked record';
  }
  // Prisma malformed UUID / bad id passed in a where clause
  if (err.code === 'P2023' || err.name === 'PrismaClientValidationError') {
    status = 400;
    message = 'Invalid id or field in request';
  }

  res.status(status).json({
    message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
}
