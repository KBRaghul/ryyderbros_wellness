// client/src/pages/AdminDashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { API_BASE } from "../config";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("users");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // For Role Change Dialog
  const [roleDialog, setRoleDialog] = useState({
    open: false,
    userId: null,
    userName: "",
    newRole: "",
  });

  // For "View History" Modal
  const [historyDialog, setHistoryDialog] = useState({
    open: false,
    userName: "",
    bookings: [],
  });

  // 1. Capture Token from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlToken = params.get("token");

    if (urlToken) {
      localStorage.setItem("authToken", urlToken);
      navigate("/admin", { replace: true });
    }
  }, [location.search, navigate]);

  // 2. Define the Logout Function
  const handleSignOut = async () => {
    try {
      // Call backend logout (optional)
      await axios.post(`${API_BASE}/auth/logout`);
    } catch (err) {
      console.error("Logout failed (ignored):", err);
    }
    // Clear local storage and redirect
    localStorage.removeItem("authToken");
    navigate("/", { replace: true });
  };

  // Fetch data based on active tab
  const fetchData = async () => {
    const token = localStorage.getItem("authToken");
    // Wait for token to be set
    if (!token) return;

    setLoading(true);
    try {
      const endpoint =
        activeTab === "users"
          ? "/api/admin/users"
          : activeTab === "therapists"
          ? "/api/admin/therapists"
          : "/api/admin/bookings";

      const res = await axios.get(`${API_BASE}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (activeTab === "users") setData(res.data.users || []);
      if (activeTab === "therapists") setData(res.data.therapists || []);
      if (activeTab === "bookings") setData(res.data.bookings || []);
    } catch (err) {
      console.error("Admin fetch error:", err);
      if (err.response?.status === 403) {
        alert("Access Denied. You must be an admin to view this page.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, location]);

  const handleRoleChange = async () => {
    const token = localStorage.getItem("authToken");
    try {
      await axios.put(
        `${API_BASE}/api/admin/users/${roleDialog.userId}/role`,
        { role: roleDialog.newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRoleDialog({ open: false, userId: null, userName: "", newRole: "" });
      fetchData();
    } catch (err) {
      console.error("Role update failed:", err);
      alert("Failed to update role");
    }
  };

  const openRoleDialog = (user) => {
    const newRole = user.role === "therapist" ? "user" : "therapist";
    setRoleDialog({
      open: true,
      userId: user.id,
      userName: user.name,
      newRole: newRole,
    });
  };

  const openHistoryDialog = async (user) => {
    const token = localStorage.getItem("authToken");
    try {
      const res = await axios.get(`${API_BASE}/api/admin/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const userBookings = res.data.bookings.filter(
        (b) => b.client_id === user.id
      );

      setHistoryDialog({
        open: true,
        userName: user.name,
        bookings: userBookings,
      });
    } catch (err) {
      console.error("Failed to load history", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 3. Pass onLogout to Header */}
      <Header
        user={{ name: "Admin Portal", role: "admin" }}
        onLogout={handleSignOut}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Admin Portal</h1>
          <p className="text-slate-600">
            Manage users, therapists, and platform activity.
          </p>
        </div>

        {/* TABS */}
        <div className="flex gap-2 mb-6 border-b border-slate-200">
          {["users", "therapists", "bookings"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab
                  ? "border-rose-500 text-rose-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* CONTENT AREA */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
          {loading ? (
            <div className="p-12 text-center text-slate-500">
              Loading data...
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* 1. USERS TABLE */}
              {activeTab === "users" && (
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-900 font-semibold border-b">
                    <tr>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Bookings</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {u.picture || u.photo_url ? (
                              <img
                                src={u.picture || u.photo_url}
                                alt=""
                                className="w-8 h-8 rounded-full"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                            )}
                            <div>
                              <div className="font-medium text-slate-900">
                                {u.name}
                              </div>
                              <div className="text-xs text-slate-500">
                                {u.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              u.role === "therapist"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-lime-100 text-lime-800"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {u.booking_count} bookings
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => openHistoryDialog(u)}
                            className="text-slate-500 hover:text-slate-700 text-xs font-medium underline"
                          >
                            View History
                          </button>
                          <button
                            onClick={() => openRoleDialog(u)}
                            className="text-rose-500 hover:text-rose-700 font-medium text-xs border border-rose-200 px-3 py-1 rounded-full hover:bg-rose-50"
                          >
                            {u.role === "therapist" ? "Demote" : "Promote"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* 2. THERAPISTS TABLE */}
              {activeTab === "therapists" && (
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-900 font-semibold border-b">
                    <tr>
                      <th className="px-6 py-4">Therapist</th>
                      <th className="px-6 py-4">Slot Stats</th>
                      <th className="px-6 py-4">Recent Slots</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.map((t) => {
                      const slots = t.slots || [];
                      const bookedCount = slots.filter(
                        (s) => s.is_booked
                      ).length;
                      return (
                        <tr key={t.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-medium text-slate-900">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-600">
                                {t.name?.[0]}
                              </div>
                              <div>
                                <div className="font-semibold">{t.name}</div>
                                <div className="text-xs text-slate-500">
                                  {t.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-slate-900 font-bold">
                              {bookedCount}
                            </span>{" "}
                            booked / {slots.length} total
                          </td>
                          <td className="px-6 py-4 text-xs">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {slots.slice(0, 3).map((s) => (
                                <span
                                  key={s.id}
                                  className={`px-2 py-0.5 rounded border ${
                                    s.is_booked
                                      ? "bg-rose-50 border-rose-200 text-rose-600"
                                      : "bg-emerald-50 border-emerald-200 text-emerald-600"
                                  }`}
                                >
                                  {new Date(s.start_time).toLocaleDateString()}
                                </span>
                              ))}
                              {slots.length > 3 && (
                                <span className="text-slate-400 px-1">
                                  +{slots.length - 3} more
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {/* 3. BOOKINGS TABLE */}
              {activeTab === "bookings" && (
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-900 font-semibold border-b">
                    <tr>
                      <th className="px-6 py-4">Session Time</th>
                      <th className="px-6 py-4">Client</th>
                      <th className="px-6 py-4">Therapist</th>
                      <th className="px-6 py-4">Meet Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {new Date(b.start_time).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          {b.client_name}{" "}
                          <span className="text-slate-400 text-xs">
                            ({b.client_email})
                          </span>
                        </td>
                        <td className="px-6 py-4">{b.therapist_name}</td>
                        <td className="px-6 py-4">
                          {b.meet_link ? (
                            <a
                              href={b.meet_link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-rose-500 underline hover:text-rose-700"
                            >
                              Launch Meet
                            </a>
                          ) : (
                            <span className="text-slate-400 italic">
                              No link generated
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Confirmation Dialog for Role Change */}
      <ConfirmDialog
        open={roleDialog.open}
        title={`Change Role for ${roleDialog.userName}?`}
        message={`Are you sure you want to change this user's role to "${roleDialog.newRole}"?`}
        confirmLabel={`Make ${roleDialog.newRole}`}
        onCancel={() => setRoleDialog({ ...roleDialog, open: false })}
        onConfirm={handleRoleChange}
      />

      {/* History Modal (Simple Overlay) */}
      {historyDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-900">
                Booking History: {historyDialog.userName}
              </h2>
              <button
                onClick={() =>
                  setHistoryDialog({ open: false, userName: "", bookings: [] })
                }
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {historyDialog.bookings.length === 0 ? (
              <p className="text-slate-500">No bookings found for this user.</p>
            ) : (
              <div className="space-y-3">
                {historyDialog.bookings.map((b) => (
                  <div
                    key={b.id}
                    className="border border-slate-200 rounded-lg p-3 flex justify-between items-center"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">
                        {new Date(b.start_time).toLocaleString()}
                      </div>
                      <div className="text-sm text-slate-500">
                        with {b.therapist_name}
                      </div>
                    </div>
                    {b.meet_link && (
                      <a
                        href={b.meet_link}
                        target="_blank"
                        className="text-xs bg-rose-100 text-rose-700 px-3 py-1 rounded-full"
                      >
                        Join Meet
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
