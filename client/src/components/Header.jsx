// client/src/components/Header.jsx
import { Link } from "react-router-dom";
import { API_AUTH_URL } from "../config";

export default function Header({ user, onLogout }) {
  const firstName = user?.name?.split(" ")[0];

  return (
    <header className="w-full bg-white/90 backdrop-blur border-b border-slate-200 bg-lime-100">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-300 via-rose-400 to-rose-500" />
          <Link to="/" className="font-semibold text-slate-900">
            RyyderBros Wellness
          </Link>
        </div>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
          <Link to="/" className="hover:text-slate-900">
            Home
          </Link>
          <a href="#about" className="hover:text-slate-900">
            About
          </a>
          <a href="#reviews" className="hover:text-slate-900">
            Reviews
          </a>
        </nav>

        {/* Auth + actions */}
        <div className="flex items-center gap-3">
          {/* If NOT logged in */}
          {!user && (
            <a
              href={API_AUTH_URL}
              className="px-4 py-1.5 rounded-full bg-rose-400 text-white text-sm font-medium hover:bg-rose-500"
            >
              Sign In
            </a>
          )}

          {/* If logged in */}
          {user && (
            <>
              <span className="hidden md:block text-slate-700 text-sm">
                Hi, {firstName}
              </span>

              {/* Bookings button for all logged-in users */}
              <Link
                to="/bookings"
                className="px-3 py-1.5 rounded-full bg-white text-xs font-semibold text-rose-500 border border-rose-300 hover:bg-rose-50"
              >
                My bookings
              </Link>

              {/* Extra button for therapists */}
              {user.role === "therapist" && (
                <Link
                  to="/therapist"
                  className="px-3 py-1.5 rounded-full bg-rose-100 text-xs font-semibold text-rose-600 border border-rose-300 hover:bg-rose-200"
                >
                  Therapist dashboard
                </Link>
              )}

              <button
                onClick={onLogout}
                className="px-4 py-1.5 rounded-full bg-rose-400 text-white text-sm font-medium hover:bg-rose-500"
              >
                Sign out
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
