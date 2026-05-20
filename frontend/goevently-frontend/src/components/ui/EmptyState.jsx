export default function EmptyState({
  title = "No data found",
  message = "There is nothing to show right now.",
}) {
  return (
    <div className="rounded-3xl border border-[#e6eaf2] bg-white p-10 text-center gev-card-shadow">
      <h3 className="text-xl font800 text-[#0b1533]">{title}</h3>
      <p className="mt-2 text-sm font600 text-[#66708a]">{message}</p>
    </div>
  );
}