// client/src/components/Footer.jsx
export default function Footer() {
  return (
    <footer className="w-full bg-white bg-lime-100 border-t border-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} ryyderbros_wellness — Built with care by
        Raghul.
      </div>
    </footer>
  );
}
