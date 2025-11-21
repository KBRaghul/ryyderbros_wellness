// server/src/models/slot.model.js
const pool = require("../config/db"); // same as in user.model.js
const { deleteTherapyEvent } = require("../services/calendar.service");

async function getSlotsForTherapist(therapistId) {
  const query = `
    SELECT id, therapist_id, start_time, end_time, is_booked, created_at
    FROM slots
    WHERE therapist_id = $1
    ORDER BY start_time ASC;
  `;
  const result = await pool.query(query, [therapistId]);
  return result.rows;
}

async function createSlotForTherapist(therapistId, startTime, endTime) {
  const query = `
    INSERT INTO slots (therapist_id, start_time, end_time)
    VALUES ($1, $2, $3)
    RETURNING id, therapist_id, start_time, end_time, is_booked, created_at;
  `;
  const result = await pool.query(query, [therapistId, startTime, endTime]);
  return result.rows[0];
}

async function deleteSlotForTherapist(therapistId, slotId) {
  const client = await pool.connect();
  let googleEventIds = [];

  try {
    await client.query("BEGIN");

    // 1. Fetch any bookings for this slot and remember their Google event IDs
    const bookingsRes = await client.query(
      `
      SELECT google_event_id
      FROM bookings
      WHERE slot_id = $1
      `,
      [slotId]
    );

    googleEventIds = bookingsRes.rows
      .map((row) => row.google_event_id)
      .filter((id) => !!id); // keep only non-null IDs

    // 2. Delete associated bookings
    await client.query(
      `
      DELETE FROM bookings
      WHERE slot_id = $1
      `,
      [slotId]
    );

    // 3. Delete the slot itself
    const slotDeleteRes = await client.query(
      `
      DELETE FROM slots
      WHERE id = $1 AND therapist_id = $2
      RETURNING id;
      `,
      [slotId, therapistId]
    );

    await client.query("COMMIT");

    // 4. After DB commit, cancel Google Calendar events (if any)
    for (const googleEventId of googleEventIds) {
      try {
        await deleteTherapyEvent({ therapistId, googleEventId });
      } catch (err) {
        // This should rarely throw, but don't break deletion if it does
        console.error(
          "Error cancelling Google event for deleted slot:",
          err.message
        );
      }
    }

    // Return true if the slot itself was deleted
    return slotDeleteRes.rowCount > 0;
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error deleting slot and booking:", err);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  getSlotsForTherapist,
  createSlotForTherapist,
  deleteSlotForTherapist,
};
