// server/src/models/slot.model.js
const pool = require("../config/db"); // same as in user.model.js

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
  const query = `
    DELETE FROM slots
    WHERE id = $1 AND therapist_id = $2
    RETURNING id;
  `;
  const result = await pool.query(query, [slotId, therapistId]);
  return result.rowCount > 0;
}

module.exports = {
  getSlotsForTherapist,
  createSlotForTherapist,
  deleteSlotForTherapist,
};
