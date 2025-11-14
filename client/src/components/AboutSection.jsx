// client/src/components/AboutSection.jsx
export default function AboutSection() {
  return (
    <div
      id="about"
      className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-8 items-center"
    >
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-900">
          About ryyderbros_wellness
        </h2>
        <p className="text-slate-600 text-sm leading-relaxed">
          I&apos;m Raghul, a developer building tools that make mental health
          support easier to access. ryyderbros_wellness started as a small idea
          to simplify therapy bookings and has grown into a personal passion
          project focused on wellbeing, clarity, and consistency.
        </p>
        <p className="text-slate-600 text-sm leading-relaxed">
          The goal is simple: reduce friction between “I need help” and
          “I&apos;m talking to someone who can support me.”
        </p>
      </div>

      <div className="flex justify-center">
        <div className="w-56 h-56 rounded-full bg-gradient-to-tr from-emerald-300 to-sky-300 flex items-center justify-center">
          <span className="text-slate-900 font-medium text-sm text-center px-4">
            Helping you show up for yourself, one session at a time.
          </span>
        </div>
      </div>
    </div>
  );
}
