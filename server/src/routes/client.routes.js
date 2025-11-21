// server/src/routes/client.routes.js
const express = require("express");
const { authRequired, requireRole } = require("../middleware/auth.middleware");
const {
  createBooking,
  getBookingsForClient,
} = require("../models/booking.model");
const { getAllTherapists } = require("../models/user.model");
const { getSlotsForTherapist } = require("../models/slot.model");

const router = express.Router();

// Create Booking
router.post(
  "/bookings",
  authRequired,
  requireRole("client", "therapist", "admin"), // <--- Updated
  async (req, res) => {
    try {
      const clientId = parseInt(req.user.sub, 10);
      const { slot_id } = req.body;
      const slotIdNum = parseInt(slot_id, 10);

      if (Number.isNaN(slotIdNum))
        return res.status(400).json({ message: "Invalid slot ID" });

      const { booking, error } = await createBooking(slotIdNum, clientId);

      if (error === "SlotUnavailable") {
        return res.status(409).json({ message: "Slot unavailable" });
      }
      res.status(201).json({ booking });
    } catch (err) {
      console.error("Error creating booking:", err);
      res.status(500).json({ message: "Failed to create booking" });
    }
  }
);

// Get My Bookings
router.get(
  "/my/bookings",
  authRequired,
  requireRole("client", "therapist", "admin"), // <--- Updated
  async (req, res) => {
    try {
      const clientId = parseInt(req.user.sub, 10);
      const bookings = await getBookingsForClient(clientId);
      res.json({ bookings });
    } catch (err) {
      console.error("Error fetching bookings:", err);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  }
);

// Get All Therapists (Already open to everyone authenticated)
router.get("/therapists", authRequired, async (req, res) => {
  try {
    const therapists = await getAllTherapists();
    res.json({ therapists });
  } catch (err) {
    console.error("Error fetching therapists:", err);
    res.status(500).json({ message: "Failed to fetch therapists" });
  }
});

// Get Slots for a Therapist (Already open to everyone authenticated)
router.get("/therapists/:id/slots", authRequired, async (req, res) => {
  try {
    const therapistId = parseInt(req.params.id, 10);
    if (Number.isNaN(therapistId))
      return res.status(400).json({ message: "Invalid ID" });

    const allSlots = await getSlotsForTherapist(therapistId);
    const availableSlots = allSlots.filter((s) => !s.is_booked);
    res.json({ slots: availableSlots });
  } catch (err) {
    console.error("Error fetching slots:", err);
    res.status(500).json({ message: "Failed to fetch slots" });
  }
});

module.exports = router;
