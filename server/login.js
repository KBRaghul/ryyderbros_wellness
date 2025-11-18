// server/login.js

const path = require("path");
const multer = require("multer");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");

const {
  findOrCreateGoogleUser,
  findUserById,
  getAllTherapists,
  getTherapistProfile,
  updateTherapistProfile,
  saveGoogleRefreshToken,
} = require("./src/models/user.model");

const {
  getSlotsForTherapist,
  createSlotForTherapist,
  deleteSlotForTherapist,
} = require("./src/models/slot.model");

const {
  createBooking,
  getBookingsForClient,
  getBookingsForTherapist,
} = require("./src/models/booking.model");

const app = express();

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ===== CONFIG =====
const CLIENT_URL = "http://localhost:5173";
const PORT = 4000;

// ⚠️ in real life put this in process.env.JWT_SECRET
const JWT_SECRET = "supersecret_jwt_key_change_me";

// Google credentials
const GOOGLE_CLIENT_ID =
  "80964280306-760mqf0fp8v4bk40ak5br4o0megffd14.apps.googleusercontent.com";
const GOOGLE_CLIENT_SECRET = "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";

// ===== MIDDLEWARE =====
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true, // not used for JWT, but OK to keep
  })
);

app.use(express.json());

// 🚫 NO express-session
// 🚫 NO passport.session()
app.use(passport.initialize());

// Serve uploaded files statically (e.g. /uploads/therapist_1_123.jpg)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ===== PASSPORT: GOOGLE STRATEGY =====
passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:4000/auth/google/callback",
    },
    async function (accessToken, refreshToken, profile, done) {
      try {
        const user = await findOrCreateGoogleUser(profile);

        // 👇 First time consent, Google sends refreshToken – save it
        if (refreshToken) {
          await saveGoogleRefreshToken(user.id, refreshToken);
        }

        return done(null, user);
      } catch (err) {
        console.error("Error in GoogleStrategy:", err);
        return done(err, null);
      }
    }
  )
);

// ===== JWT HELPERS =====

function createJwtForUser(user) {
  // Keep payload small
  const payload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role, // make sure users table has a 'role' column
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

// Middleware to protect routes
function authRequired(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { sub, email, name, role, iat, exp }
    next();
  } catch (err) {
    console.error("JWT error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

function requireRole(...allowed) {
  return (req, res, next) => {
    if (!req.user || !allowed.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: insufficient role" });
    }
    next();
  };
}

// ===== MULTER STORAGE FOR THERAPIST PHOTOS =====

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // 👈 now guaranteed to exist
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    const safeName = `therapist_${req.user.sub}_${Date.now()}${ext}`;
    cb(null, safeName);
  },
});

const upload = multer({ storage });

// ===== ROUTES =====

app.get("/", (req, res) => {
  res.send("ryyderbros_wellness API running with Google OAuth + JWT");
});

// Start Google auth flow
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: [
      "profile",
      "email",
      "https://www.googleapis.com/auth/calendar.events", // 👈 calendar+meet
    ],
    accessType: "offline",
    prompt: "consent", // force consent for dev so you get refreshToken
    session: false,
  })
);

// Google callback URL (no session)
app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: CLIENT_URL + "/login?error=google_auth_failed",
    session: false,
  }),
  (req, res) => {
    // req.user is the DB user from findOrCreateGoogleUser
    const user = req.user;
    const token = createJwtForUser(user);

    let redirectPath = "/bookings"; // default for clients
    if (user.role === "therapist") {
      redirectPath = "/therapist";
    } else if (user.role === "admin") {
      redirectPath = "/admin"; // later when you build admin UI
    }

    res.redirect(`${CLIENT_URL}${redirectPath}?token=${token}`);
  }
);

// Get current logged-in user from JWT
app.get("/api/me", authRequired, (req, res) => {
  // req.user is JWT payload (not full DB row, but enough for UI)
  res.json({ user: req.user });
});

// ===== THERAPIST SLOTS =====

// Therapist: get their real slots from DB
app.get(
  "/api/therapist/slots",
  authRequired,
  requireRole("therapist"),
  async (req, res) => {
    try {
      const therapistId = req.user.sub;
      const slots = await getSlotsForTherapist(therapistId);
      res.json({ slots });
    } catch (err) {
      console.error("Error fetching therapist slots:", err);
      res.status(500).json({ message: "Failed to fetch slots" });
    }
  }
);

// Therapist: create a new 1h15m slot in DB
app.post(
  "/api/therapist/slots",
  authRequired,
  requireRole("therapist"),
  async (req, res) => {
    try {
      const therapistId = req.user.sub;
      const { start_time } = req.body;

      if (!start_time) {
        return res.status(400).json({ message: "start_time is required" });
      }

      const start = new Date(start_time);
      if (isNaN(start.getTime())) {
        return res.status(400).json({ message: "Invalid start_time format" });
      }

      // default duration: 1 hour 15 minutes = 75 minutes
      const end = new Date(start.getTime() + 75 * 60 * 1000);

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

// Therapist: delete a slot
app.delete(
  "/api/therapist/slots/:id",
  authRequired,
  requireRole("therapist"),
  async (req, res) => {
    try {
      const therapistId = req.user.sub;
      const slotId = parseInt(req.params.id, 10);

      if (Number.isNaN(slotId)) {
        return res.status(400).json({ message: "Invalid slot id" });
      }

      const deleted = await deleteSlotForTherapist(therapistId, slotId);
      if (!deleted) {
        return res.status(404).json({ message: "Slot not found" });
      }

      res.json({ success: true });
    } catch (err) {
      console.error("Error deleting slot:", err);
      res.status(500).json({ message: "Failed to delete slot" });
    }
  }
);

// ===== BOOKINGS (CLIENT/THERAPIST) =====

// Create a booking for a slot
app.post(
  "/api/bookings",
  authRequired,
  requireRole("client", "therapist"),
  async (req, res) => {
    try {
      const clientId = req.user.sub;
      const { slot_id } = req.body;

      if (!slot_id) {
        return res.status(400).json({ message: "slot_id is required" });
      }

      const slotIdNum = parseInt(slot_id, 10);
      if (Number.isNaN(slotIdNum)) {
        return res.status(400).json({ message: "Invalid slot_id" });
      }

      const { booking, slot, error } = await createBooking(slotIdNum, clientId);

      if (error === "SlotUnavailable") {
        return res
          .status(409)
          .json({ message: "Slot is already booked or does not exist" });
      }

      return res.status(201).json({ booking, slot });
    } catch (err) {
      console.error("Error creating booking:", err);
      return res.status(500).json({ message: "Failed to create booking" });
    }
  }
);

// Get own bookings (for clients/therapists)
app.get(
  "/api/my/bookings",
  authRequired,
  requireRole("client", "therapist"),
  async (req, res) => {
    try {
      const clientId = req.user.sub;
      const bookings = await getBookingsForClient(clientId);
      res.json({ bookings });
    } catch (err) {
      console.error("Error fetching user bookings:", err);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  }
);

// Therapist: their upcoming sessions (clients who booked them)
app.get(
  "/api/therapist/bookings",
  authRequired,
  requireRole("therapist"),
  async (req, res) => {
    try {
      const therapistId = req.user.sub; // from JWT
      const bookings = await getBookingsForTherapist(therapistId);
      res.json({ bookings });
    } catch (err) {
      console.error("Error fetching therapist bookings:", err);
      res.status(500).json({ message: "Failed to fetch therapist bookings" });
    }
  }
);

// ===== THERAPISTS LIST & SLOTS (CLIENT VIEW) =====

// List all therapists (requires login)
app.get("/api/therapists", authRequired, async (req, res) => {
  try {
    const therapists = await getAllTherapists();
    res.json({ therapists });
  } catch (err) {
    console.error("Error fetching therapists:", err);
    res.status(500).json({ message: "Failed to fetch therapists" });
  }
});

// Get available (not booked) slots for a specific therapist
app.get("/api/therapists/:id/slots", authRequired, async (req, res) => {
  try {
    const therapistId = parseInt(req.params.id, 10);
    if (Number.isNaN(therapistId)) {
      return res.status(400).json({ message: "Invalid therapist id" });
    }

    const allSlots = await getSlotsForTherapist(therapistId);
    const availableSlots = allSlots.filter((s) => !s.is_booked);

    res.json({ slots: availableSlots });
  } catch (err) {
    console.error("Error fetching therapist slots:", err);
    res.status(500).json({ message: "Failed to fetch slots" });
  }
});

// ===== THERAPIST PROFILE (ABOUT ME + PHOTO) =====

// Get therapist profile
app.get(
  "/api/therapist/profile",
  authRequired,
  requireRole("therapist"),
  async (req, res) => {
    try {
      const userId = req.user.sub;
      const profile = await getTherapistProfile(userId);
      res.json({ profile });
    } catch (err) {
      console.error("Error fetching therapist profile:", err);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  }
);

// Update therapist profile text fields (headline, bio, photo_url)
app.put(
  "/api/therapist/profile",
  authRequired,
  requireRole("therapist"),
  async (req, res) => {
    try {
      const userId = req.user.sub;
      const { photo_url, headline, profile_bio } = req.body;

      const updated = await updateTherapistProfile(userId, {
        photo_url,
        headline,
        profile_bio,
      });

      res.json({ profile: updated });
    } catch (err) {
      console.error("Error updating therapist profile:", err);
      res.status(500).json({ message: "Failed to update profile" });
    }
  }
);

// Upload photo file, store + update photo_url
app.post(
  "/api/therapist/profile/photo",
  authRequired,
  requireRole("therapist"),
  upload.single("photo"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.user.sub;
      const publicUrl = `/uploads/${req.file.filename}`;

      const updated = await updateTherapistProfile(userId, {
        photo_url: publicUrl,
        headline: null,
        profile_bio: null,
      });

      res.json({
        profile: updated,
        photo_url: publicUrl,
      });
    } catch (err) {
      console.error("Error uploading therapist photo:", err);
      res
        .status(500)
        .json({ message: "Failed to upload photo", error: err.message });
    }
  }
);

// ===== ADMIN MOCK ROUTE =====

app.get("/api/admin/users", authRequired, requireRole("admin"), (req, res) => {
  const mockUsers = [
    { id: 1, email: "admin@example.com", role: "admin" },
    { id: 2, email: "therapist@example.com", role: "therapist" },
    { id: 3, email: "client@example.com", role: "client" },
  ];

  res.json({ users: mockUsers });
});

// ===== LOGOUT (JWT STYLE) =====

app.post("/auth/logout", (req, res) => {
  // With JWT, "logout" is just deleting token on client.
  // You could add token blacklist here if needed.
  res.json({ message: "Logged out. Please delete JWT on client." });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
