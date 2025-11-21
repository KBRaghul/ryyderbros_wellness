// server/src/routes/therapist.routes.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const { authRequired, requireRole } = require("../middleware/auth.middleware");
const {
  getSlotsForTherapist,
  createSlotForTherapist,
  deleteSlotForTherapist,
} = require("../models/slot.model");
const { getBookingsForTherapist } = require("../models/booking.model");
const {
  getTherapistProfile,
  updateTherapistProfile,
} = require("../models/user.model");

const router = express.Router();

// Multer setup
const uploadDir = path.join(__dirname, "../../uploads");
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    const safeName = `therapist_${req.user.sub}_${Date.now()}${ext}`;
    cb(null, safeName);
  },
});
const upload = multer({ storage });

// Get slots
router.get(
  "/slots",
  authRequired,
  requireRole("therapist", "admin"), // <--- FIXED
  async (req, res) => {
    try {
      // Parse ID if your DB uses INT
      const therapistId = parseInt(req.user.sub, 10);
      const slots = await getSlotsForTherapist(therapistId);
      res.json({ slots });
    } catch (err) {
      console.error("Error fetching slots:", err);
      res.status(500).json({ message: "Failed to fetch slots" });
    }
  }
);

// Create slot
router.post(
  "/slots",
  authRequired,
  requireRole("therapist", "admin"), // <--- FIXED
  async (req, res) => {
    try {
      const therapistId = parseInt(req.user.sub, 10);
      const { start_time } = req.body;

      if (!start_time)
        return res.status(400).json({ message: "start_time required" });

      const start = new Date(start_time);
      if (isNaN(start.getTime()))
        return res.status(400).json({ message: "Invalid time" });

      const end = new Date(start.getTime() + 75 * 60 * 1000); // 75 min session

      const newSlot = await createSlotForTherapist(
        therapistId,
        start.toISOString(),
        end.toISOString()
      );
      res.status(201).json({ slot: newSlot });
    } catch (err) {
      console.error("Error creating slot:", err);
      res.status(500).json({ message: "Failed to create slot" });
    }
  }
);

// Delete slot
router.delete(
  "/slots/:id",
  authRequired,
  requireRole("therapist", "admin"), // <--- FIXED
  async (req, res) => {
    try {
      const therapistId = parseInt(req.user.sub, 10);
      const slotId = parseInt(req.params.id, 10);

      if (Number.isNaN(slotId))
        return res.status(400).json({ message: "Invalid slot ID" });

      const deleted = await deleteSlotForTherapist(therapistId, slotId);
      if (!deleted) return res.status(404).json({ message: "Slot not found" });

      res.json({ success: true });
    } catch (err) {
      console.error("Error deleting slot:", err);
      res.status(500).json({ message: "Failed to delete slot" });
    }
  }
);

// Get bookings
router.get(
  "/bookings",
  authRequired,
  requireRole("therapist", "admin"), // <--- FIXED
  async (req, res) => {
    try {
      const therapistId = parseInt(req.user.sub, 10);
      const bookings = await getBookingsForTherapist(therapistId);
      res.json({ bookings });
    } catch (err) {
      console.error("Error fetching bookings:", err);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  }
);

// Get profile
router.get(
  "/profile",
  authRequired,
  requireRole("therapist", "admin"), // <--- FIXED
  async (req, res) => {
    try {
      const userId = parseInt(req.user.sub, 10);
      const profile = await getTherapistProfile(userId);
      res.json({ profile });
    } catch (err) {
      console.error("Error fetching profile:", err);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  }
);

// Update profile
router.put(
  "/profile",
  authRequired,
  requireRole("therapist", "admin"), // <--- FIXED
  async (req, res) => {
    try {
      const userId = parseInt(req.user.sub, 10);
      const updated = await updateTherapistProfile(userId, req.body);
      res.json({ profile: updated });
    } catch (err) {
      console.error("Error updating profile:", err);
      res.status(500).json({ message: "Failed to update profile" });
    }
  }
);

// Upload photo
router.post(
  "/profile/photo",
  authRequired,
  requireRole("therapist", "admin"), // <--- FIXED
  upload.single("photo"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ message: "No file uploaded" });

      const userId = parseInt(req.user.sub, 10);
      const publicUrl = `/uploads/${req.file.filename}`;

      const updated = await updateTherapistProfile(userId, {
        photo_url: publicUrl,
      });
      res.json({ profile: updated, photo_url: publicUrl });
    } catch (err) {
      console.error("Error uploading photo:", err);
      res.status(500).json({ message: "Failed to upload photo" });
    }
  }
);

module.exports = router;
