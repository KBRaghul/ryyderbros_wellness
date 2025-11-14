// client/src/components/Slider.jsx
import { useEffect, useState } from "react";

const slides = [
  {
    title: "Book therapy in a few clicks",
    subtitle: "Find a time that works for you and your therapist.",
  },
  {
    title: "Track your wellbeing",
    subtitle: "Keep an eye on your mental health journey over time.",
  },
  {
    title: "Safe & private space",
    subtitle: "Your sessions and data are treated with care.",
  },
];

export default function Slider() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const current = slides[index];

  return (
    <div className="bg-gradient-to-r from-emerald-100 to-sky-100">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1 space-y-2 text-center md:text-left">
          <p className="text-xs uppercase tracking-[0.25em] text-emerald-700">
            Featured
          </p>
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-900">
            {current.title}
          </h2>
          <p className="text-slate-700">{current.subtitle}</p>
        </div>

        <div className="flex-1 flex justify-center">
          <div className="w-64 h-36 rounded-2xl bg-white shadow-md border border-emerald-100 flex items-center justify-center text-slate-500 text-sm">
            Calm, focused sessions. Anytime.
          </div>
        </div>
      </div>

      {/* dots */}
      <div className="flex justify-center gap-2 pb-3">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`w-2.5 h-2.5 rounded-full ${
              i === index ? "bg-emerald-600" : "bg-emerald-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
