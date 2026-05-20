export default function LoadingState({ message = "Loading..." }) {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-3xl border border-[#e6eaf2] bg-white">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-teal-100 border-t-[#0ea5a4]" />
        <p className="mt-4 text-sm font700 text-[#66708a]">{message}</p>
      </div>
    </div>
  );
}