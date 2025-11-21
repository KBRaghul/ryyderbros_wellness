// client/src/pages/Bookings.jsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { API_BASE } from "../config";

const resolvePhotoUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/uploads")) return `${API_BASE}${url}`;
  return url;
};

export default function Bookings() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [therapists, setTherapists] = useState([]);
  const [loadingTherapists, setLoadingTherapists] = useState(true);

  const [selectedTherapistId, setSelectedTherapistId] = useState(null);
  const [selectedTherapist, setSelectedTherapist] = useState(null);

  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // State for success/info messages
  const [infoDialog, setInfoDialog] = useState({
    open: false,
    title: "",
    message: "",
  });

  const navigate = useNavigate();
  const location = useLocation();

  const [confirmState, setConfirmState] = useState({
    open: false,
    slotId: null,
  });

  // 0. Capture ?token=... from Google redirect
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlToken = params.get("token");

    if (urlToken) {
      localStorage.setItem("authToken", urlToken);
      navigate("/bookings", { replace: true });
    }
  }, [location.search, navigate]);

  // Shared function to load bookings
  const fetchBookings = useCallback(async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setLoadingBookings(false);
      return;
    }

    try {
      const res = await axios.get(`${API_BASE}/api/my/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(res.data.bookings || []);
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
    } finally {
      setLoadingBookings(false);
    }
  }, []);

  // 1. Load user
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setLoadingUser(false);
        return;
      }

      try {
        const res = await axios.get(`${API_BASE}/api/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data.user);
      } catch (err) {
        console.error("Bookings: failed to fetch user", err);
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUser();
  }, []);

  // 2. After user loaded, fetch therapists + bookings
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setLoadingTherapists(false);
      setLoadingBookings(false);
      return;
    }

    const fetchTherapists = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/therapists`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTherapists(res.data.therapists || []);
      } catch (err) {
        console.error("Failed to fetch therapists:", err);
      } finally {
        setLoadingTherapists(false);
      }
    };

    fetchTherapists();
    fetchBookings();
  }, [loadingUser, fetchBookings]);

  const handleSignOut = async () => {
    try {
      await axios.post(`${API_BASE}/auth/logout`);
    } catch (err) {
      console.error("Logout failed (ignored):", err);
    }
    localStorage.removeItem("authToken");
    setUser(null);
    navigate("/", { replace: true });
  };

  const handleSelectTherapist = async (therapist) => {
    if (selectedTherapistId === therapist.id) {
      setSelectedTherapistId(null);
      setSelectedTherapist(null);
      setSlots([]);
      return;
    }

    setSelectedTherapistId(therapist.id);
    setSelectedTherapist(therapist);
    setLoadingSlots(true);
    setSlots([]);

    const token = localStorage.getItem("authToken");
    if (!token) {
      setLoadingSlots(false);
      return;
    }

    try {
      const res = await axios.get(
        `${API_BASE}/api/therapists/${therapist.id}/slots`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSlots(res.data.slots || []);
    } catch (err) {
      console.error("Failed to fetch therapist slots:", err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBookSlot = async (slotId) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      alert("You need to be logged in to book.");
      return;
    }

    try {
      await axios.post(
        `${API_BASE}/api/bookings`,
        { slot_id: slotId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      await fetchBookings();
      setSlots((prev) => prev.filter((s) => s.id !== slotId));

      setInfoDialog({
        open: true,
        title: "Booking Confirmed!",
        message:
          "You have successfully booked this session. You can find the details in 'Your bookings'.",
      });
    } catch (err) {
      console.error("Failed to create booking:", err);
      if (err.response?.status === 409) {
        setInfoDialog({
          open: true,
          title: "Slot Unavailable",
          message:
            "That slot was just booked by someone else. Please choose another.",
        });
      } else {
        alert("Failed to book. Please try again.");
      }
    }
  };

  const formatDateTimeRange = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleDateString()} • ${startDate.toLocaleTimeString(
      [],
      { hour: "2-digit", minute: "2-digit" }
    )} – ${endDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-lime-100 flex items-center justify-center">
        <p className="text-slate-700 text-lg">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-lime-100 flex flex-col">
        <Header user={null} onLogout={handleSignOut} />
        <main className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
          <div className="max-w-md w-full bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-rose-100 px-6 py-6 text-center">
            <h1 className="text-lg font-semibold text-slate-900 mb-2">
              Sign in to manage your sessions
            </h1>
            <p className="text-sm text-slate-600 mb-4">
              You need to sign in with your Google account to view therapists
              and book sessions.
            </p>
            <a
              href="http://localhost:4000/auth/google"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-rose-400 text-white text-sm font-semibold shadow-sm hover:bg-rose-500"
            >
              Sign in with Google
            </a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const firstName = user.name?.split(" ")[0] || "there";

  return (
    <div className="min-h-screen bg-lime-100 flex flex-col">
      <Header user={user} onLogout={handleSignOut} />

      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 md:py-10 space-y-8 md:space-y-10">
        {/* 🔹 DASHBOARD BUTTONS (Only for Admin or Therapist) 🔹 */}
        {user && (user.role === "admin" || user.role === "therapist") && (
          <div className="flex justify-end gap-3">
            {/* Button to Therapist Dashboard (For Therapists & Admins) */}
            <button
              onClick={() => navigate("/therapist")}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 text-white rounded-full text-sm font-semibold shadow-sm hover:bg-rose-600 transition-all"
            >
              {user.role === "admin"
                ? "👩‍⚕️ Manage as Therapist"
                : "⚡ Go to Dashboard"}
            </button>

            {/* Button to Admin Portal (Only for Admins) */}
            {user.role === "admin" && (
              <button
                onClick={() => navigate("/admin")}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-full text-sm font-semibold shadow-sm hover:bg-slate-700 transition-all"
              >
                🛡️ Admin Portal
              </button>
            )}
          </div>
        )}

        {/* Page header */}
        <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-rose-500 font-medium mb-1">
              Your therapy hub
            </p>
            <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
              Welcome, <span className="text-rose-500">{firstName}</span>
            </h1>
            <p className="text-sm md:text-base text-slate-700 mt-2 max-w-xl">
              Choose a therapist, view their available sessions, and manage your
              upcoming bookings.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs md:text-sm">
            <span className="px-3 py-1 rounded-full bg-white/80 border border-rose-100 text-slate-700">
              Step 1 · Choose therapist
            </span>
            <span className="px-3 py-1 rounded-full bg-white/80 border border-rose-100 text-slate-700">
              Step 2 · Pick a slot
            </span>
            <span className="px-3 py-1 rounded-full bg-white/80 border border-rose-100 text-slate-700">
              Step 3 · Confirm booking
            </span>
          </div>
        </section>

        {/* Main booking workspace */}
        <section className="grid gap-6 md:grid-cols-[2.1fr,2.4fr]">
          {/* Therapists list */}
          <div className="bg-white rounded-3xl shadow-sm border border-rose-100 px-4 md:px-5 py-4 md:py-5 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="text-sm md:text-base font-semibold text-slate-900">
                  Therapists
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select a therapist to view their available sessions.
                </p>
              </div>
            </div>

            {loadingTherapists ? (
              <p className="text-sm text-slate-600">Loading therapists...</p>
            ) : therapists.length === 0 ? (
              <p className="text-sm text-slate-600">
                No therapists are available yet.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {therapists.map((t) => {
                  const avatarUrl = resolvePhotoUrl(t.photo_url);
                  const firstInitial = t.name?.charAt(0)?.toUpperCase() || "?";

                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleSelectTherapist(t)}
                      className={`w-full text-left bg-white rounded-2xl shadow-sm border px-4 py-3 hover:border-rose-400 transition ${
                        selectedTherapistId === t.id
                          ? "border-rose-400 ring-1 ring-rose-300"
                          : "border-rose-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-rose-300 via-rose-400 to-rose-500 overflow-hidden flex items-center justify-center text-white text-sm font-semibold">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={t.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{firstInitial}</span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900">
                            {t.name}
                          </p>
                          {t.headline && (
                            <p className="text-xs text-rose-500 mt-0.5 truncate">
                              {t.headline}
                            </p>
                          )}
                          <p className="text-xs text-slate-600 mt-1 truncate">
                            {t.email}
                          </p>
                        </div>

                        <div className="shrink-0 pl-2 text-right">
                          <p className="text-xs text-rose-500 font-medium whitespace-nowrap">
                            View slots &rarr;
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Available sessions */}
          <div className="bg-white rounded-3xl shadow-sm border border-rose-100 px-4 md:px-5 py-4 md:py-5 flex flex-col">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h2 className="text-sm md:text-base font-semibold text-slate-900">
                  Available sessions
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedTherapist
                    ? `Sessions with ${selectedTherapist.name}`
                    : "Pick a therapist to see open session times."}
                </p>
              </div>
            </div>

            <div className="flex-1 min-h-[180px]">
              {!selectedTherapist && (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm text-slate-500 text-center max-w-xs">
                    Select a therapist on the left to view their available
                    sessions.
                  </p>
                </div>
              )}

              {selectedTherapist && loadingSlots && (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm text-slate-600">Loading slots...</p>
                </div>
              )}

              {selectedTherapist && !loadingSlots && slots.length === 0 && (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm text-slate-600 text-center max-w-xs">
                    No available sessions with{" "}
                    <span className="font-semibold">
                      {selectedTherapist.name}
                    </span>{" "}
                    right now.
                  </p>
                </div>
              )}

              {selectedTherapist && !loadingSlots && slots.length > 0 && (
                <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {slots.map((slot) => (
                    <div
                      key={slot.id}
                      className="bg-lime-50 rounded-2xl border border-rose-100 px-3.5 py-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex flex-col">
                        <p className="text-xs font-semibold text-slate-900">
                          {formatDateTimeRange(slot.start_time, slot.end_time)}
                        </p>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Status:{" "}
                          <span className="font-medium text-emerald-600">
                            Available
                          </span>
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setConfirmState({ open: true, slotId: slot.id })
                        }
                        className="px-4 py-1.5 rounded-full bg-rose-400 text-white text-xs font-semibold hover:bg-rose-500"
                      >
                        Book this slot
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Your bookings */}
        <section className="bg-white rounded-3xl shadow-sm border border-rose-100 px-4 md:px-5 py-4 md:py-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm md:text-base font-semibold text-slate-900">
                Your bookings
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                View your upcoming and past sessions.
              </p>
            </div>
          </div>

          {loadingBookings ? (
            <p className="text-sm text-slate-600">Loading your bookings...</p>
          ) : bookings.length === 0 ? (
            <p className="text-sm text-slate-600">
              You don&apos;t have any bookings yet.
            </p>
          ) : (
            <div className="space-y-2.5">
              {bookings.map((b) => (
                <div
                  key={b.id}
                  className="bg-white rounded-2xl shadow-sm border border-rose-200 px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {b.therapist_name
                        ? `With ${b.therapist_name}`
                        : "Therapy session"}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      {formatDateTimeRange(b.start_time, b.end_time)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Status:{" "}
                      <span className="font-medium">
                        {b.status || "confirmed"}
                      </span>
                    </p>
                    {b.meet_link && (
                      <p className="text-xs text-rose-500 mt-1">
                        This session has a Google Meet link.
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {b.meet_link && (
                      <button
                        onClick={() => window.open(b.meet_link, "_blank")}
                        className="px-4 py-1.5 rounded-full bg-rose-400 text-white text-xs font-semibold hover:bg-rose-500"
                      >
                        Join session
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmState.open}
        title="Book this session?"
        message="Once booked, you’ll receive a Meet link and this session will appear in your upcoming bookings."
        confirmLabel="Confirm booking"
        cancelLabel="Back"
        onCancel={() => setConfirmState({ open: false, slotId: null })}
        onConfirm={() => {
          if (confirmState.slotId) {
            handleBookSlot(confirmState.slotId);
          }
          setConfirmState({ open: false, slotId: null });
        }}
      />

      {/* Success / Info Dialog */}
      <ConfirmDialog
        open={infoDialog.open}
        title={infoDialog.title}
        message={infoDialog.message}
        confirmLabel="OK"
        cancelLabel={null}
        onConfirm={() => setInfoDialog({ ...infoDialog, open: false })}
      />

      <Footer />
    </div>
  );
}
