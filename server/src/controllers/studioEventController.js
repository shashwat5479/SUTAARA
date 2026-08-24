import { prisma } from "../config/db.js";
import { asyncHandler } from "../middleware/error.js";
import { withMongoStyleId } from "../utils/serialize.js";

// Returns the single active studio event (or null). Public — the /studio page
// reads this to show current exhibition/event info. There is normally just one
// active row; if several are active we return the most recently updated.
export const getActiveEvent = asyncHandler(async (req, res) => {
  const event = await prisma.studioEvent.findFirst({
    where: { active: true },
    orderBy: { updatedAt: "desc" },
  });
  res.json(event ? withMongoStyleId(event) : null);
});

// GET /api/studio-event/all — admin: list every event row
export const getAllEvents = asyncHandler(async (req, res) => {
  const events = await prisma.studioEvent.findMany({ orderBy: { updatedAt: "desc" } });
  res.json(withMongoStyleId(events));
});

const cleanEventData = (body) => {
  const data = {};
  const strFields = ["title", "subtitle", "description", "location", "address", "hours", "phone", "heroImage"];
  for (const f of strFields) {
    if (body[f] !== undefined) data[f] = String(body[f]);
  }
  if (body.active !== undefined) data.active = Boolean(body.active);
  // Dates are optional; empty string clears them.
  if (body.startDate !== undefined) data.startDate = body.startDate ? new Date(body.startDate) : null;
  if (body.endDate !== undefined) data.endDate = body.endDate ? new Date(body.endDate) : null;
  return data;
};

// POST /api/studio-event — admin: create (or upsert the first) event
export const createEvent = asyncHandler(async (req, res) => {
  const data = cleanEventData(req.body);
  const event = await prisma.studioEvent.create({ data });
  res.status(201).json(withMongoStyleId(event));
});

// PUT /api/studio-event/:id — admin: update an event
export const updateEvent = asyncHandler(async (req, res) => {
  const data = cleanEventData(req.body);
  const event = await prisma.studioEvent.update({ where: { id: req.params.id }, data });
  res.json(withMongoStyleId(event));
});

// DELETE /api/studio-event/:id — admin
export const deleteEvent = asyncHandler(async (req, res) => {
  await prisma.studioEvent.delete({ where: { id: req.params.id } });
  res.json({ message: "Event removed" });
});
