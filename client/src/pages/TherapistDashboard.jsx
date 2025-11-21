// client/src/pages/TherapistDashboard.jsx
import { useEffect, useState } from "react";

import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE } from "../config";
import Header from "../components/Header.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import Footer from "../components/Footer.jsx";

// Turn stored DB photo_url into a usable <img src="..."> URL
const resolvePhotoUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/uploads")) return `${API_BASE}${url}`;
  return url;
};

// Allow “Join session” only around the session time
const canJoinNow = (start, end) => {
  if (!start) return false;
  const now = new Date();
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;

  // join allowed from 10 min before start until 30 min after end
  const earlyWindow = new Date(startDate.getTime() - 10 * 60 * 1000);
  const lateWindow = endDate
    ? new Date(endDate.getTime() + 30 * 60 * 1000)
    : new Date(startDate.getTime() + 90 * 60 * 1000);

  return now >= earlyWindow && now <= lateWindow;
};

export default function TherapistDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Slots
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [slotDate, setSlotDate] = useState("");
  const [slotTime, setSlotTime] = useState("");
  const [confirmState, setConfirmState] = useState({
    open: false,
    slotId: null,
  });

  // Therapist profile
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");

  // Upcoming sessions
  const [therapistBookings, setTherapistBookings] = useState([]);
  const [loadingTherapistBookings, setLoadingTherapistBookings] =
    useState(true);

  // 1️⃣ Capture token from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlToken = params.get("token");

    if (urlToken) {
      localStorage.setItem("authToken", urlToken);
      navigate("/therapist", { replace: true });
    }
  }, [location.search, navigate]);

  // 2️⃣ Fetch logged-in user (Updated to allow Admins)
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
        const u = res.data.user;

        // --- CHECK UPDATED HERE: Allow therapist OR admin ---
        if (u.role !== "therapist" && u.role !== "admin") {
          return navigate("/bookings", { replace: true });
        }
        setUser(u);
      } catch (err) {
        console.error("Failed to fetch user", err);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUser();
  }, [navigate]);

  // 3️⃣ Fetch therapist's own slots
  useEffect(() => {
    const fetchSlots = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setLoadingSlots(false);
        return;
      }

      try {
        const res = await axios.get(`${API_BASE}/api/therapist/slots`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSlots(res.data.slots || []);
      } catch (err) {
        console.error("Failed to fetch therapist slots", err);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, []);

  // 4️⃣ Fetch therapist profile (Updated to allow Admins)
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setProfileLoading(false);
        return;
      }

      try {
        const res = await axios.get(`${API_BASE}/api/therapist/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const p = res.data.profile;
        setProfile(p);
        setPhotoUrl(p?.photo_url || "");
        setHeadline(p?.headline || "");
        setBio(p?.profile_bio || "");
      } catch (err) {
        console.error("Failed to fetch therapist profile", err);
      } finally {
        setProfileLoading(false);
      }
    };

    // --- CHECK UPDATED HERE ---
    if (user && (user.role === "therapist" || user.role === "admin")) {
      fetchProfile();
    }
  }, [user]);

  // 5️⃣ Fetch upcoming bookings (Updated to allow Admins)
  useEffect(() => {
    // --- CHECK UPDATED HERE ---
    if (!user || (user.role !== "therapist" && user.role !== "admin")) return;

    let cancelled = false;

    const fetchTherapistBookings = async (showLoading = false) => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        if (showLoading) setLoadingTherapistBookings(false);
        return;
      }

      if (showLoading) setLoadingTherapistBookings(true);

      try {
        const res = await axios.get(`${API_BASE}/api/therapist/bookings`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (cancelled) return;

        const all = res.data.bookings || [];
        all.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
        setTherapistBookings(all);
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to fetch therapist bookings", err);
        }
      } finally {
        if (showLoading && !cancelled) {
          setLoadingTherapistBookings(false);
        }
      }
    };

    // initial load with spinner
    fetchTherapistBookings(true);

    // then refresh every 15 seconds
    const intervalId = setInterval(() => {
      fetchTherapistBookings(false);
    }, 15000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [user]);

  const handleSignOut = async () => {
    try {
      await axios.post(`${API_BASE}/auth/logout`);
    } catch (err) {
      console.error("Logout failed", err);
    }
    localStorage.removeItem("authToken");
    navigate("/", { replace: true });
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();

    if (!slotDate || !slotTime) {
      alert("Please select both date and time.");
      return;
    }

    const start = new Date(`${slotDate}T${slotTime}`);
    if (isNaN(start.getTime())) {
      alert("Invalid date/time, please try again.");
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      alert("Not authenticated");
      return;
    }

    try {
      const res = await axios.post(
        `${API_BASE}/api/therapist/slots`,
        { start_time: start.toISOString() },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const newSlot = res.data.slot;
      setSlots((prev) =>
        [...prev, newSlot].sort(
          (a, b) => new Date(a.start_time) - new Date(b.start_time)
        )
      );

      setSlotDate("");
      setSlotTime("");
    } catch (err) {
      console.error("Failed to create slot:", err);
      alert("Failed to create slot");
    }
  };

  const handleDeleteSlot = async (slotId) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      alert("Not authenticated");
      return;
    }

    try {
      await axios.delete(`${API_BASE}/api/therapist/slots/${slotId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSlots((prev) => prev.filter((s) => s.id !== slotId));
      setTherapistBookings((prev) => prev.filter((b) => b.slot_id !== slotId));
    } catch (err) {
      console.error("Failed to delete slot:", err);
      alert("Failed to delete slot");
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("authToken");
    if (!token) {
      alert("Not authenticated");
      return;
    }

    try {
      const res = await axios.put(
        `${API_BASE}/api/therapist/profile`,
        {
          photo_url: photoUrl,
          headline,
          profile_bio: bio,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setProfile(res.data.profile);
      alert("Profile updated!");
    } catch (err) {
      console.error("Failed to update profile:", err);
      alert("Failed to update profile");
    }
  };

  const handlePhotoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = localStorage.getItem("authToken");
    if (!token) return;

    const formData = new FormData();
    formData.append("photo", file);

    try {
      const res = await axios.post(
        `${API_BASE}/api/therapist/profile/photo`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const newUrl = res.data.photo_url || res.data.profile?.photo_url;
      if (newUrl) {
        setPhotoUrl(newUrl);
        setProfile((prev) => ({
          ...prev,
          photo_url: newUrl,
        }));
      }
      alert("Photo updated!");
    } catch (err) {
      console.error("Failed to upload photo:", err);
      alert("Failed to upload photo");
    } finally {
      e.target.value = "";
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
        <p className="text-slate-700 text-lg">Loading therapist dashboard...</p>
      </div>
    );
  }

  // Final Render Check: Allow if therapist OR admin
  if (!user || (user.role !== "therapist" && user.role !== "admin")) {
    return (
      <div className="min-h-screen bg-lime-100 flex flex-col items-center justify-center gap-4">
        <p className="text-slate-700">
          You&apos;re not logged in as a therapist.
        </p>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 rounded-full bg-rose-400 text-white text-sm font-medium hover:bg-rose-500"
        >
          Go to Home
        </button>
      </div>
    );
  }

  const firstName = user.name?.split(" ")[0] || "Therapist";

  return (
    <div className="min-h-screen bg-lime-100 flex flex-col">
      <Header user={user} onLogout={handleSignOut} />

      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Back Button for Admins */}
        {user.role === "admin" && (
          <div className="flex justify-end">
            <button
              onClick={() => navigate("/admin")}
              className="text-sm font-semibold text-rose-500 border border-rose-200 px-4 py-2 rounded-full hover:bg-rose-50 bg-white"
            >
              &larr; Back to Admin Portal
            </button>
          </div>
        )}

        {/* Welcome */}
        <section>
          <h1 className="text-2xl font-semibold text-slate-900">
            Welcome, <span className="text-rose-500">{firstName}</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {user.role === "admin"
              ? "Admin Mode: You are viewing this dashboard as a therapist."
              : "Here you can manage your availability and see who's booked with you."}
          </p>
        </section>

        {/* Slots header + Add form */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg md:text-xl font-semibold text-slate-900">
              Your slots
            </h2>
          </div>

          {/* Add slot form */}
          <form
            onSubmit={handleAddSlot}
            className="bg-white rounded-2xl shadow-sm border border-rose-200 px-4 py-3 flex flex-col md:flex-row md:items-center md:gap-4 gap-2"
          >
            <div className="flex flex-col">
              <label className="text-xs text-slate-600 mb-1">
                Date (session is 1h 15m)
              </label>
              <input
                type="date"
                value={slotDate}
                onChange={(e) => setSlotDate(e.target.value)}
                className="border border-rose-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-rose-400"
                required
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs text-slate-600 mb-1">Start time</label>
              <input
                type="time"
                value={slotTime}
                onChange={(e) => setSlotTime(e.target.value)}
                className="border border-rose-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-rose-400"
                required
              />
            </div>

            <div className="mt-2 md:mt-6">
              <button
                type="submit"
                className="px-4 py-2 rounded-full bg-rose-400 text-white text-xs md:text-sm font-semibold hover:bg-rose-500"
              >
                + Add slot
              </button>
            </div>
          </form>

          {/* Slots list */}
          {loadingSlots ? (
            <p className="text-sm text-slate-600">Loading your slots...</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-slate-600">
              You don&apos;t have any slots yet. Use the form above to create
              one.
            </p>
          ) : (
            <div className="space-y-3">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className="bg-white rounded-2xl shadow-sm border border-rose-200 px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {new Date(slot.start_time).toLocaleString()} –{" "}
                      {new Date(slot.end_time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="text-xs text-slate-600">
                      Status:{" "}
                      <span className="font-medium">
                        {slot.is_booked ? "Booked" : "Available"}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 md:ml-4">
                    <button
                      onClick={() =>
                        setConfirmState({ open: true, slotId: slot.id })
                      }
                      className="px-3 py-1.5 rounded-full border border-rose-300 text-xs text-rose-500 hover:bg-rose-50"
                    >
                      Delete slot
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Upcoming sessions */}
        <section className="space-y-4 mt-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg md:text-xl font-semibold text-slate-900">
              Upcoming sessions
            </h2>
          </div>

          {loadingTherapistBookings ? (
            <p className="text-sm text-slate-600">Loading your sessions...</p>
          ) : therapistBookings.length === 0 ? (
            <p className="text-sm text-slate-600">
              You don&apos;t have any upcoming sessions yet.
            </p>
          ) : (
            <div className="space-y-3">
              {therapistBookings.map((b) => {
                const joinEnabled =
                  b.meet_link && canJoinNow(b.start_time, b.end_time);

                return (
                  <div
                    key={b.id}
                    className="bg-white rounded-2xl shadow-sm border border-rose-200 px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Session with {b.client_name || "Client"}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        {formatDateTimeRange(b.start_time, b.end_time)}
                      </p>
                      {b.client_email && (
                        <p className="text-xs text-slate-500 mt-1">
                          {b.client_email}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {b.meet_link ? (
                        <button
                          type="button"
                          onClick={() =>
                            joinEnabled
                              ? window.open(b.meet_link, "_blank", "noopener")
                              : null
                          }
                          disabled={!joinEnabled}
                          className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold ${
                            joinEnabled
                              ? "bg-rose-400 text-white hover:bg-rose-500"
                              : "bg-slate-100 text-slate-400 cursor-not-allowed"
                          }`}
                        >
                          {joinEnabled
                            ? "Join session"
                            : "Join available 10 min before"}
                        </button>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-[11px] text-slate-600">
                          Meet link will appear here once created
                        </span>
                      )}

                      <span className="px-3 py-1 rounded-full bg-lime-50 border border-lime-200 text-[11px] text-slate-700">
                        Status:{" "}
                        <span className="font-medium">
                          {b.status || "upcoming"}
                        </span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* About Me Section */}
        <section className="space-y-4 mt-8">
          <h2 className="text-lg md:text-xl font-semibold text-slate-900">
            About Me
          </h2>

          <div className="grid gap-4 md:grid-cols-[2fr,3fr]">
            {/* Preview card */}
            <div className="bg-white rounded-2xl shadow-sm border border-rose-200 px-4 py-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-300 via-rose-400 to-rose-500 overflow-hidden flex items-center justify-center text-white text-xl font-semibold">
                {photoUrl ? (
                  <img
                    src={resolvePhotoUrl(photoUrl)}
                    alt={firstName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{firstName.charAt(0)}</span>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {profile?.name || user.name}
                </p>
                <p className="text-xs text-rose-500">
                  {headline || "Therapist"}
                </p>
                <p className="text-xs text-slate-600 mt-2 line-clamp-3">
                  {bio ||
                    "Write a short intro about yourself so clients know you better."}
                </p>
              </div>
            </div>

            {/* Edit form */}
            <form
              onSubmit={handleSaveProfile}
              className="bg-white rounded-2xl shadow-sm border border-rose-200 px-4 py-4 space-y-3"
            >
              {profileLoading && (
                <p className="text-xs text-slate-500 mb-1">
                  Loading your profile...
                </p>
              )}

              {/* Photo upload */}
              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  Profile photo
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoFileChange}
                    className="text-xs text-slate-600"
                  />
                  {photoUrl && (
                    <span className="text-[11px] text-slate-500 break-all">
                      Current: <span className="underline">{photoUrl}</span>
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  Photo URL (optional)
                </label>
                <input
                  type="text"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="w-full border border-rose-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-rose-400"
                  placeholder="https://example.com/my-photo.jpg"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  Headline
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full border border-rose-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-rose-400"
                  placeholder="Clinical Psychologist, CBT, 5+ years"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  About you
                </label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full border border-rose-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-rose-400 resize-none"
                  placeholder="Share your approach, experience, and what clients can expect in sessions."
                />
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-full bg-rose-400 text-white text-xs md:text-sm font-semibold hover:bg-rose-500"
                >
                  Save profile
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
      <ConfirmDialog
        open={confirmState.open}
        title="Delete this slot?"
        message="This will remove the slot and any associated upcoming session. This action cannot be undone."
        confirmLabel="Delete slot"
        cancelLabel="Cancel"
        onCancel={() => setConfirmState({ open: false, slotId: null })}
        onConfirm={() => {
          if (confirmState.slotId) {
            handleDeleteSlot(confirmState.slotId);
          }
          setConfirmState({ open: false, slotId: null });
        }}
      />

      <Footer />
    </div>
  );
}
