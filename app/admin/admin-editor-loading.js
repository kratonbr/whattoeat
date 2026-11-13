export default function AdminEditorLoading({ message }) {
  return (
    <div role="status" aria-live="polite" className="rounded-2xl border border-[#E1E7DC] bg-[#FFFEFA] p-6 text-sm text-[#667469]">
      {message}
    </div>
  );
}
