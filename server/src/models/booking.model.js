// server/src/models/booking.model.js
const pool = require("../config/db");
const { createTherapyEventWithMeet } = require("../services/calendar.service");

async function createBooking(slotId, clientId) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Lock slot row
    const slotRes = await client.query(
      `
      SELECT s.*, u.email AS therapist_email, u.name AS therapist_name
      FROM slots s
      JOIN users u ON s.therapist_id = u.id
      WHERE s.id = $1
      FOR UPDATE
      `,
      [slotId]
    );

    const slot = slotRes.rows[0];
    if (!slot || slot.is_booked) {
      await client.query("ROLLBACK");
      return { error: "SlotUnavailable" };
    }

    // Get client info
    const clientRes = await client.query(
      `
      SELECT id, email, name
      FROM users
      WHERE id = $1
      `,
      [clientId]
    );
    const clientUser = clientRes.rows[0];

    // Mark slot as booked
    await client.query(
      `
      UPDATE slots
      SET is_booked = true
      WHERE id = $1
      `,
      [slotId]
    );

    // Create booking (without meet_link initially)
    const bookingRes = await client.query(
      `
      INSERT INTO bookings (slot_id, client_id, status)
      VALUES ($1, $2, 'confirmed')
      RETURNING *;
      `,
      [slotId, clientId]
    );

    let booking = bookingRes.rows[0];

    // Try to create Google Meet event
    try {
      const { eventId, meetLink } = await createTherapyEventWithMeet({
        therapistId: slot.therapist_id,
        clientEmail: clientUser.email,
        clientName: clientUser.name || "Client",
        startTime: slot.start_time, // must be ISO strings
        endTime: slot.end_time,
      });

      const updateRes = await client.query(
        `
        UPDATE bookings
        SET google_event_id = $2,
            meet_link = $3
        WHERE id = $1
        RETURNING *;
        `,
        [booking.id, eventId, meetLink]
      );

      booking = updateRes.rows[0];
    } catch (err) {
      console.error(
        "Failed to create Google Calendar/Meet event:",
        err.message
      );
      // keep booking, but meet_link will be null
    }

    await client.query("COMMIT");

    return { booking, slot, error: null };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error in createBooking:", err);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  createBooking,
  // ...other exports
};

// Get all bookings for a given client
async function getBookingsForClient(clientId) {
  const query = `
    SELECT 
      b.id,
      b.status,
      b.created_at,
      b.meet_link,
      s.start_time,
      s.end_time,
      s.therapist_id,
      u.name AS therapist_name,
      u.email AS therapist_email
    FROM bookings b
    JOIN slots s ON s.id = b.slot_id
    JOIN users u ON u.id = s.therapist_id
    WHERE b.client_id = $1
    ORDER BY s.start_time ASC;
  `;

  const result = await pool.query(query, [clientId]);
  return result.rows;
}

/**
 * Get upcoming bookings for a given therapist.
 * Adjust `b.client_id` below if your foreign-key column
 * in `bookings` is named differently.
 */
async function getBookingsForTherapist(therapistId) {
  const result = await pool.query(
    `
      SELECT
        b.id,
        b.status,
        b.created_at,
        s.start_time,
        s.end_time,
        u.name  AS client_name,
        u.email AS client_email
      FROM bookings b
      JOIN slots s ON b.slot_id = s.id
      JOIN users u ON b.client_id = u.id   -- 🔹 CHANGE HERE IF NEEDED
      WHERE s.therapist_id = $1
        AND s.start_time >= NOW() - INTERVAL '5 minutes'
      ORDER BY s.start_time ASC;
    `,
    [therapistId]
  );

  return result.rows;
}

module.exports = {
  createBooking,
  getBookingsForClient,
  getBookingsForTherapist,
};
