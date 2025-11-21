// server/src/routes/admin.routes.js
const express = require("express");
const pool = require("../config/db");
const { authRequired, requireRole } = require("../middleware/auth.middleware");

const router = express.Router();

// Middleware: Ensure only admins can access these routes
router.use(authRequired, requireRole("admin"));

// 1. GET ALL USERS
// Returns user details + a count of their bookings
router.get("/users", async (req, res) => {
  try {
    const query = `
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role, 
        u.picture, 
        u.photo_url,
        (SELECT COUNT(*) FROM bookings b WHERE b.client_id = u.id) as booking_count
      FROM users u
      ORDER BY u.id ASC;
    `;
    const result = await pool.query(query);
    res.json({ users: result.rows });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// 2. GET ALL THERAPISTS
// Returns therapist details + their slots nested inside
router.get("/therapists", async (req, res) => {
  try {
    const query = `
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role, 
        u.photo_url,
        u.picture,
        COALESCE(
          json_agg(
            json_build_object(
              'id', s.id,
              'start_time', s.start_time,
              'end_time', s.end_time,
              'is_booked', s.is_booked
            ) ORDER BY s.start_time DESC
          ) FILTER (WHERE s.id IS NOT NULL), 
          '[]'
        ) as slots
      FROM users u
      LEFT JOIN slots s ON u.id = s.therapist_id
      WHERE u.role = 'therapist'
      GROUP BY u.id
      ORDER BY u.name ASC;
    `;
    const result = await pool.query(query);
    res.json({ therapists: result.rows });
  } catch (err) {
    console.error("Error fetching therapists:", err);
    res.status(500).json({ message: "Failed to fetch therapists" });
  }
});

// 3. GET ALL BOOKINGS (MASTER LIST)
// Joins Bookings -> Users (Client) -> Slots -> Users (Therapist)
router.get("/bookings", async (req, res) => {
  try {
    const query = `
      SELECT 
        b.id, 
        b.status, 
        b.meet_link, 
        b.created_at,
        client.id as client_id,
        client.name as client_name, 
        client.email as client_email,
        therapist.name as therapist_name,
        therapist.email as therapist_email,
        s.start_time,
        s.end_time
      FROM bookings b
      JOIN users client ON b.client_id = client.id
      JOIN slots s ON b.slot_id = s.id
      JOIN users therapist ON s.therapist_id = therapist.id
      ORDER BY s.start_time DESC;
    `;
    const result = await pool.query(query);
    res.json({ bookings: result.rows });
  } catch (err) {
    console.error("Error fetching bookings:", err);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
});

// 4. CHANGE USER ROLE
router.put("/users/:id/role", async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!["user", "therapist", "admin"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  try {
    const result = await pool.query(
      `UPDATE users SET role = $1 WHERE id = $2 RETURNING id, role, name`,
      [role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Role updated successfully",
      user: result.rows[0],
    });
  } catch (err) {
    console.error("Error updating role:", err);
    res.status(500).json({ message: "Failed to update role" });
  }
});

module.exports = router;
