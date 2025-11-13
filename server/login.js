// server/login.js

const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const cors = require("cors");

const {
  findUserById,
  findOrCreateGoogleUser,
} = require("./src/models/user.model");

const app = express();

// ===== CONFIG =====
const CLIENT_URL = "http://localhost:5173"; // Vite default port; change to 3000 if using CRA
const PORT = 4000;

// Replace with your real values
const GOOGLE_CLIENT_ID =
  "80964280306-760mqf0fp8v4bk40ak5br4o0megffd14.apps.googleusercontent.com";
const GOOGLE_CLIENT_SECRET = "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";

// ===== MIDDLEWARE =====
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());

app.use(
  session({
    secret: "supersecretkey",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// ===== PASSPORT CONFIG =====
passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:4000/auth/google/callback",
    },
    async function (accessToken, refreshToken, profile, done) {
      try {
        // Find or create user in Postgres
        const user = await findOrCreateGoogleUser(profile);
        return done(null, user);
      } catch (err) {
        console.error("Error in GoogleStrategy:", err);
        return done(err, null);
      }
    }
  )
);

// store only user.id in session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// load full user from DB for each request
passport.deserializeUser(async (id, done) => {
  try {
    const user = await findUserById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// ===== ROUTES =====
app.get("/", (req, res) => {
  res.send("ryyderbros_wellness API is running");
});

// Start Google auth flow
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google callback URL
app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: CLIENT_URL + "/login?error=google_auth_failed",
    session: true,
  }),
  (req, res) => {
    // Successful login, redirect to frontend
    res.redirect(CLIENT_URL);
  }
);

// Get current logged in user (from DB)
app.get("/api/me", (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    // req.user is DB user row
    res.json({ user: req.user });
  } else {
    res.status(401).json({ user: null });
  }
});

// Logout
app.post("/auth/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return res.status(500).json({ message: "LogOut Error" });
    }

    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.json({ message: "Logged Out" });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
