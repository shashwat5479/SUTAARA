import { prisma } from '../config/db.js';
import { asyncHandler } from '../middleware/error.js';
import { withMongoStyleId } from '../utils/serialize.js';
import { sendXlsx, istDayStart, istDayEnd } from '../utils/xlsx.js';
import { notifyCustomerAppointment, notifyOwnerNewAppointment } from '../services/notify.js';

export const SERVICES = [
  'Draping consultation',
  'Custom stitching & fitting',
  'Styling session',
  'Bridal trial',
];

export const TIME_SLOTS = [
  '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM',
];

// POST /api/appointments — public, no login required. Attaches the signed-in
// user (if any) so their booking shows up on their account, but a guest can
// book the studio just as well.
export const createAppointment = asyncHandler(async (req, res) => {
  const { name, phone, email, service, preferredDate, preferredTime, notes } = req.body;
  if (!name || !phone || !email || !service || !preferredDate || !preferredTime) {
    res.status(400);
    throw new Error('Name, phone, email, service, date and time slot are required');
  }
  // Was accepted as free text before — "sdkjga" and other non-numeric
  // strings were landing in the admin table where a phone number should be.
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length !== 10) {
    res.status(400);
    throw new Error('Enter a valid 10-digit phone number');
  }
  const date = new Date(preferredDate);
  if (Number.isNaN(date.getTime())) {
    res.status(400);
    throw new Error('That date is not valid');
  }
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  if (date < startOfToday) {
    res.status(400);
    throw new Error('Please choose a date from today onward');
  }

  const appointment = await prisma.appointment.create({
    data: {
      userId: req.user?.id,
      name,
      phone: digitsOnly,
      email: email.toLowerCase().trim(),
      service,
      preferredDate: date,
      preferredTime,
      notes: notes || '',
    },
  });

  // Fire-and-forget-ish: sendEmail already fails soft (logs and returns on
  // error), so this never blocks or breaks the booking response.
  notifyCustomerAppointment(appointment, 'requested').catch(() => {});
  notifyOwnerNewAppointment(appointment).catch(() => {});

  res.status(201).json(withMongoStyleId(appointment));
});

// GET /api/appointments/mine — appointments booked while signed in
export const getMyAppointments = asyncHandler(async (req, res) => {
  const appointments = await prisma.appointment.findMany({
    where: { userId: req.user.id },
    orderBy: { preferredDate: 'asc' },
  });
  res.json(withMongoStyleId(appointments));
});

// GET /api/appointments — admin only
export const getAllAppointments = asyncHandler(async (req, res) => {
  const appointments = await prisma.appointment.findMany({
    orderBy: { preferredDate: 'asc' },
    include: { user: { select: { name: true, email: true } } },
  });
  res.json(withMongoStyleId(appointments));
});

// GET /api/appointments/export?from=YYYY-MM-DD&to=YYYY-MM-DD&status=… — admin, .xlsx
// from/to filter on the appointment date (not when it was requested).
export const exportAppointments = asyncHandler(async (req, res) => {
  const { from, to, status } = req.query;
  const where = {};
  const gte = istDayStart(from);
  const lte = istDayEnd(to);
  if (gte || lte) where.preferredDate = { ...(gte && { gte }), ...(lte && { lte }) };
  if (status && status !== 'all') where.status = String(status);
  const list = await prisma.appointment.findMany({ where, orderBy: { preferredDate: 'asc' } });
  const label = (s) => String(s || '').replace(/^./, (c) => c.toUpperCase());
  const stamp = new Date().toISOString().slice(0, 10);
  sendXlsx(res, `sutaara-appointments-${stamp}.xlsx`, [
    {
      name: 'Appointments',
      columns: [
        { header: 'Appointment date', key: 'date', type: 'date', width: 17 },
        { header: 'Time slot', key: 'time', width: 12 },
        { header: 'Name', key: 'name', width: 22 },
        { header: 'Phone', key: 'phone', width: 14 },
        { header: 'Email', key: 'email', width: 28 },
        { header: 'Service', key: 'service', width: 28 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Notes', key: 'notes', width: 44, wrap: true },
        { header: 'Requested on (IST)', key: 'created', type: 'datetime', width: 19 },
      ],
      rows: list.map((a) => ({
        date: a.preferredDate,
        time: a.preferredTime,
        name: a.name,
        phone: a.phone,
        email: a.email,
        service: a.service,
        status: label(a.status),
        notes: a.notes,
        created: a.createdAt,
      })),
    },
  ]);
});

// PUT /api/appointments/:id/status — admin only
export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const valid = ['requested', 'confirmed', 'completed', 'cancelled'];
  if (!valid.includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }
  const appointment = await prisma.appointment.update({
    where: { id: req.params.id },
    data: { status },
  });
  // "requested" is only ever sent at creation (createAppointment above) —
  // every other status change here means the admin acted on it, so let the
  // customer know.
  if (status !== 'requested') {
    notifyCustomerAppointment(appointment, status).catch(() => {});
  }
  res.json(withMongoStyleId(appointment));
});