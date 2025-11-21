// server/src/services/calendar.service.js
const { google } = require("googleapis");
const pool = require("../config/db");

// You can move these to process.env later
const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ||
  "80964280306-760mqf0fp8v4bk40ak5br4o0megffd14.apps.googleusercontent.com";
const GOOGLE_CLIENT_SECRET =
  process.env.GOOGLE_CLIENT_SECRET || "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";
const GOOGLE_REDIRECT_URI = "http://localhost:4000/auth/google/callback";

async function getOAuthClientForUser(userId) {
  const result = await pool.query(
    `
      SELECT google_refresh_token, email, name
      FROM users
      WHERE id = $1
    `,
    [userId]
  );

  const user = result.rows[0];
  if (!user || !user.google_refresh_token) {
    throw new Error("No Google refresh token for this user");
  }

  const oAuth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );

  oAuth2Client.setCredentials({
    refresh_token: user.google_refresh_token,
  });

  return { oAuth2Client, user };
}

/**
 * Create a Google Calendar event (with Meet link) for a session
 * Returns { eventId, meetLink }
 */
async function createTherapyEventWithMeet({
  therapistId,
  clientEmail,
  clientName,
  startTime,
  endTime,
}) {
  const { oAuth2Client, user: therapist } = await getOAuthClientForUser(
    therapistId
  );

  const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

  const requestId = `ryyderbros-${therapistId}-${Date.now()}`;

  const event = {
    summary: `Therapy session with ${clientName}`,
    description: "Session booked via ryyderbros_wellness",
    start: {
      dateTime: startTime, // ISO string
    },
    end: {
      dateTime: endTime, // ISO string
    },
    attendees: [{ email: therapist.email }, { email: clientEmail }],
    conferenceData: {
      createRequest: {
        requestId,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 24 * 60 },
        { method: "popup", minutes: 60 },
      ],
    },
  };

  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: event,
    conferenceDataVersion: 1,
    sendUpdates: "all",
  });

  const created = response.data;

  // Meet link can be in hangoutLink or conferenceData.entryPoints
  let meetLink = created.hangoutLink;
  if (!meetLink && created.conferenceData?.entryPoints?.length) {
    const meetEntry = created.conferenceData.entryPoints.find(
      (e) => e.entryPointType === "video"
    );
    if (meetEntry) {
      meetLink = meetEntry.uri;
    }
  }

  return {
    eventId: created.id,
    meetLink,
    rawEvent: created,
  };
}

/**
 * Cancels a Google Calendar event using the therapist's credentials.
 */
async function deleteTherapyEvent({ therapistId, googleEventId }) {
  if (!googleEventId) {
    console.log("No Google Event ID provided, skipping calendar deletion.");
    return;
  }

  try {
    const { oAuth2Client } = await getOAuthClientForUser(therapistId);
    const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

    await calendar.events.delete({
      calendarId: "primary",
      eventId: googleEventId,
      sendNotifications: true, // Notifies attendees (client) of cancellation
    });

    console.log(`Google event ${googleEventId} deleted successfully.`);
  } catch (err) {
    // If the event doesn't exist (e.g., already deleted), we still proceed.
    console.error(
      `Failed to delete Google Calendar event ${googleEventId}:`,
      err.message
    );
  }
}

module.exports = {
  createTherapyEventWithMeet,
  deleteTherapyEvent, // 👈 Export the new function
};
