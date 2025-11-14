// client/src/components/Header.jsx
export default function Header() {
  return (
    <header className="w-full bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-400 to-sky-500" />
          <span className="font-semibold text-slate-900">
            ryyderbros_wellness
          </span>
        </div>

        {/* Simple nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
          <a href="#hero" className="hover:text-slate-900">
            Home
          </a>
          <a href="#about" className="hover:text-slate-900">
            About
          </a>
          <a href="#reviews" className="hover:text-slate-900">
            Reviews
          </a>
        </nav>
      </div>
    </header>
  );
}
