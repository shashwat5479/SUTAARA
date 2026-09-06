import { Router } from "express";
import {
  getActiveEvent,
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../controllers/studioEventController.js";
import { protect, admin } from "../middleware/auth.js";

const router = Router();

router.get("/", getActiveEvent);            // public — active event for /studio page
router.get("/all", protect, admin, getAllEvents);
router.post("/", protect, admin, createEvent);
router.put("/:id", protect, admin, updateEvent);
router.delete("/:id", protect, admin, deleteEvent);

export default router;
