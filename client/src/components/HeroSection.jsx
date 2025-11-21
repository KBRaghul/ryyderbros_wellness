// client/src/components/HeroSection.jsx
import { useNavigate } from "react-router-dom";
import { API_AUTH_URL } from "../config";

export default function HeroSection({ user }) {
  const navigate = useNavigate();

  const firstName = user?.name?.split(" ")[0];

  const handleSignIn = () => {
    window.location.href = API_AUTH_URL;
  };

  const handleGoToBookings = () => {
    navigate("/bookings");
  };

  const handleGoToTherapistDashboard = () => {
    navigate("/therapist");
  };

  const isTherapist = user?.role === "therapist";

  return (
    <section
      id="hero"
      className="max-w-6xl mx-auto px-4 py-10 md:py-16 grid md:grid-cols-2 gap-10 items-center"
    >
      {/* Right: Simple visual / blob */}
      <div className="relative">
        <div className="w-full h-56 md:h-72 rounded-3xl bg-gradient-to-br from-lime-100 via-rose-200 to-rose-400 shadow-md flex items-center justify-center overflow-hidden">
          <div className="text-center px-6">
            <p className="text-xs uppercase tracking-[0.15em] text-slate-700 mb-2">
              Gentle. Structured. Consistent.
            </p>
            <p className="text-lg md:text-xl font-semibold text-slate-900">
              One small session can change
              <span className="text-rose-600"> how your week feels.</span>
            </p>
          </div>
        </div>
      </div>

      {/* Left: Text */}
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-rose-500">
          ryyderbros_wellness
        </p>

        <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 leading-tight">
          {user ? (
            <>
              Welcome back, <span className="text-rose-500">{firstName}</span>.
              Let&apos;s keep you consistent with therapy.
            </>
          ) : (
            <>
              Book therapy that actually{" "}
              <span className="text-rose-500">fits your life</span>.
            </>
          )}
        </h1>

        <p className="text-sm md:text-base text-slate-700">
          One place to discover therapists, manage your sessions, and track your
          wellbeing. No drama, no fluff — just calm, structured support.
        </p>

        {/* CTA buttons change based on auth + role */}
        <div className="flex flex-wrap items-center gap-3 mt-4">
          {/* NOT logged in → Sign in with Google */}
          {!user && (
            <button
              onClick={handleSignIn}
              className="px-5 py-2.5 rounded-full bg-rose-400 text-white text-sm font-semibold shadow-sm hover:bg-rose-500"
            >
              Sign in to get started
            </button>
          )}

          {/* Logged-in user (client or therapist) → Bookings button */}
          {user && (
            <button
              onClick={handleGoToBookings}
              className="px-5 py-2.5 rounded-full bg-rose-400 text-white text-sm font-semibold shadow-sm hover:bg-rose-500"
            >
              Go to my bookings
            </button>
          )}

          {/* Extra button only for therapists */}
          {isTherapist && (
            <button
              onClick={handleGoToTherapistDashboard}
              className="px-4 py-2 rounded-full bg-white text-xs font-semibold text-rose-500 border border-rose-300 hover:bg-rose-50"
            >
              Therapist dashboard
            </button>
          )}
        </div>

        {/* Tiny reassurance line */}
        <p className="text-xs text-slate-500 mt-2">
          {user
            ? "You can manage your sessions anytime from your bookings page."
            : "Sign in securely with Google — we never share your data with anyone."}
        </p>
      </div>
    </section>
  );
}
