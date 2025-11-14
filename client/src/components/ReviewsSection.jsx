// client/src/components/ReviewsSection.jsx
const reviews = [
  {
    name: "Aarav",
    text: "Booking sessions is so smooth. It keeps me consistent with therapy.",
  },
  {
    name: "Meera",
    text: "The interface is calm and not overwhelming. That itself reduces anxiety.",
  },
  {
    name: "Jordan",
    text: "Love how quickly I can see my upcoming sessions and plan my week.",
  },
];

export default function ReviewsSection() {
  return (
    <div id="reviews" className="max-w-6xl mx-auto px-4 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-slate-900">
          What people are saying
        </h2>
        <p className="text-sm text-slate-600">
          Early testers on their experience with ryyderbros_wellness.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {reviews.map((r) => (
          <div
            key={r.name}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col justify-between"
          >
            <p className="text-sm text-slate-700 mb-3">
              &ldquo;{r.text}&rdquo;
            </p>
            <p className="text-xs font-semibold text-slate-900">– {r.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
