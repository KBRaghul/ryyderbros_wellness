// client/src/components/ConfirmDialog.jsx
export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  message = "",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 p-5">
        {/* Title */}
        <h2 className="text-base md:text-lg font-semibold text-slate-900">
          {title}
        </h2>

        {/* Message */}
        {message && <p className="mt-2 text-sm text-slate-600">{message}</p>}

        {/* Actions */}
        <div className="mt-4 flex justify-end gap-3">
          {/* Only show Cancel button if cancelLabel is provided */}
          {cancelLabel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 rounded-full text-xs md:text-sm border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              {cancelLabel}
            </button>
          )}

          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-1.5 rounded-full text-xs md:text-sm bg-rose-400 text-white font-semibold hover:bg-rose-500"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
