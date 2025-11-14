// client/src/components/HeroSection.jsx
export default function HeroSection() {
  const handleLogin = () => {
    window.location.href = "http://localhost:4000/auth/google";
  };

  return (
    <div
      id="hero"
      className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center gap-10"
    >
      <div className="flex-1 space-y-5 text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
          Therapy that fits your life.
        </h1>
        <p className="text-slate-600">
          ryyderbros_wellness helps you book sessions, stay consistent, and
          build a healthier mind with the right therapist.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
          <button
            onClick={handleLogin}
            className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition"
          >
            Sign in with Google
          </button>
          <button className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-100 transition">
            Learn more
          </button>
        </div>
      </div>

      <div className="flex-1 flex justify-center">
        <div className="w-64 h-64 rounded-3xl bg-white shadow-lg border border-slate-100 flex flex-col justify-center items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-2xl">
            🧠
          </div>
          <p className="font-semibold text-slate-900">Your next session</p>
          <p className="text-xs text-slate-500">
            “You’re doing better than you think.”
          </p>
        </div>
      </div>
    </div>
  );
}
