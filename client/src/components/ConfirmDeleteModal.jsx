export default function ConfirmDeleteModal({
  isOpen,
  title = "Confirm Deletion",
  message = "Are you sure you want to delete this? This action cannot be undone.",
  confirmText = "Yes, Delete",
  cancelText = "Cancel",
  isDeleting = false,
  onConfirm,
  onCancel
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md glass-card rounded-3xl p-6 border border-white/80 shadow-2xl bg-white/95 text-stone-800 space-y-5 animate-scale-up">
        {/* Top Warning Icon Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-600 text-2xl font-bold shadow-xs">
            🗑️
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-stone-900">{title}</h3>
            <p className="text-xs text-stone-500 font-medium">Please confirm your decision below</p>
          </div>
        </div>

        {/* Message Box */}
        <div className="rounded-2xl bg-rose-50/70 border border-rose-200/80 p-4 text-xs sm:text-sm text-stone-700 leading-relaxed font-medium">
          {message}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-stone-200/80">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-100 transition disabled:opacity-50 cursor-pointer"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:shadow-rose-600/30 transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {isDeleting ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <span>🗑️</span>
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
