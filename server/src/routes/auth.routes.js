// server/src/routes/auth.routes.js
const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const { authRequired } = require("../middleware/auth.middleware"); // We'll create this middleware file next

const router = express.Router();
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const JWT_SECRET =
  process.env.JWT_SECRET || "development_secret_change_before_prod";

// Helper to create JWT
function createJwtForUser(user) {
  const payload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

// Start Google auth flow
router.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: [
      "profile",
      "email",
      "https://www.googleapis.com/auth/calendar.events",
    ],
    accessType: "offline",
    prompt: "consent",
    session: false,
  })
);

// Google callback URL
router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: CLIENT_URL + "/login?error=google_auth_failed",
    session: false,
  }),
  (req, res) => {
    const user = req.user;
    const token = createJwtForUser(user);

    const redirectPath = "/bookings";

    res.redirect(`${CLIENT_URL}${redirectPath}?token=${token}`);
  }
);

// Get current user
router.get("/api/me", authRequired, (req, res) => {
  res.json({ user: req.user });
});

// Logout
router.post("/auth/logout", (req, res) => {
  res.json({ message: "Logged out. Please delete JWT on client." });
});

module.exports = router;
