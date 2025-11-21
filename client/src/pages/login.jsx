// client/src/pages/Login.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../config";
axios.defaults.withCredentials = true;

function Login() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/me`);
        setUser(res.data.user);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/auth/google`;
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE}/auth/logout`);
      setUser(null);
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-600 text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 space-y-6">
        <h1 className="text-2xl font-semibold text-center text-slate-900">
          ryyderbros_wellness
        </h1>
        <p className="text-sm text-slate-500 text-center">
          {user ? "You are signed in" : "Sign in with your Google account"}
        </p>

        {user ? (
          <div className="flex flex-col items-center space-y-3">
            {user.picture && (
              <img
                src={user.picture}
                alt="avatar"
                className="w-16 h-16 rounded-full border border-slate-200"
              />
            )}
            <div className="text-center">
              <p className="font-medium text-slate-900">
                {user.name || "User"}
              </p>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>

            <button
              onClick={handleLogout}
              className="mt-4 inline-flex items-center justify-center w-full rounded-full bg-slate-900 text-white py-2.5 text-sm font-medium hover:bg-slate-800 transition"
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50 transition"
            >
              <span className="text-lg">🔑</span>
              <span>Continue with Google</span>
            </button>
          </div>
        )}

        <p className="text-xs text-slate-400 text-center">
          This is just the start. Soon this becomes a full therapy booking app
          ✨
        </p>
      </div>
    </div>
  );
}

// 👇 THIS is the important bit
export default Login;
