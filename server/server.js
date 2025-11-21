// server.js
const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
require("dotenv").config();

const {
  findOrCreateGoogleUser,
  saveGoogleRefreshToken,
} = require("./src/models/user.model");

// Routes
const authRoutes = require("./src/routes/auth.routes");
const therapistRoutes = require("./src/routes/therapist.routes");
const clientRoutes = require("./src/routes/client.routes");
const adminRoutes = require("./src/routes/admin.routes");

const app = express();
const PORT = process.env.PORT || 4000;

// Environment Vars
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Middleware
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(passport.initialize());
app.use("/uploads", express.static(uploadDir));

// Passport Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        "http://localhost:4000/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await findOrCreateGoogleUser(profile);
        if (refreshToken) await saveGoogleRefreshToken(user.id, refreshToken);
        return done(null, user);
      } catch (err) {
        console.error("Google Strategy Error:", err);
        return done(err, null);
      }
    }
  )
);

// Required by passport (even if no session)
passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser((id, done) => {
  done(null, { id });
});

// Routes
app.use("/", authRoutes);
app.use("/api/therapist", therapistRoutes);
app.use("/api", clientRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("ryyderbros_wellness API Running");
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
