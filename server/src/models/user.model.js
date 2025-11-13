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

module.exports = {
  findUserById,
  findOrCreateGoogleUser,
};
