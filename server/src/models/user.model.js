// server/src/models/user.model.js
const pool = require("../config/db");

async function findUserById(id) {
  const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  return result.rows[0] || null;
}

async function findUserByGoogleId(googleId) {
  const result = await pool.query("SELECT * FROM users WHERE google_id = $1", [
    googleId,
  ]);
  return result.rows[0] || null;
}

async function createUserFromGoogleProfile(profile) {
  const googleId = profile.id;
  const email = profile.emails?.[0]?.value || null;
  const name = profile.displayName || null;
  const picture = profile.photos?.[0]?.value || null;

  const result = await pool.query(
    `INSERT INTO users (google_id, email, name, picture)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [googleId, email, name, picture]
  );

  return result.rows[0];
}

async function findOrCreateGoogleUser(profile) {
  const googleId = profile.id;

  let user = await findUserByGoogleId(googleId);
  if (user) return user;

  user = await createUserFromGoogleProfile(profile);
  return user;
}

async function getAllTherapists() {
  const result = await pool.query(
    `
    SELECT id, name, email, photo_url, headline, profile_bio
    FROM users
    WHERE role = 'therapist'
    ORDER BY name ASC;
    `
  );
  return result.rows;
}

async function getTherapistProfile(userId) {
  const result = await pool.query(
    `
    SELECT id, name, email, photo_url, headline, profile_bio
    FROM users
    WHERE id = $1 AND role = 'therapist';
    `,
    [userId]
  );
  return result.rows[0] || null;
}

async function updateTherapistProfile(
  userId,
  { photo_url, headline, profile_bio }
) {
  const result = await pool.query(
    `
    UPDATE users
    SET photo_url = $1,
        headline = $2,
        profile_bio = $3
    WHERE id = $4 AND role = 'therapist'
    RETURNING id, name, email, photo_url, headline, profile_bio;
    `,
    [photo_url || null, headline || null, profile_bio || null, userId]
  );
  return result.rows[0] || null;
}

async function saveGoogleRefreshToken(userId, refreshToken) {
  if (!refreshToken) return;

  await pool.query(
    `
    UPDATE users
    SET google_refresh_token = $2
    WHERE id = $1
    `,
    [userId, refreshToken]
  );
}

module.exports = {
  findOrCreateGoogleUser,
  findUserById,
  getAllTherapists,
  getTherapistProfile,
  updateTherapistProfile,
  saveGoogleRefreshToken,
};
