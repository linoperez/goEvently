export default function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-3xl border border-[#e6eaf2] bg-white gev-card-shadow ${className}`}
    >
      {children}
    </div>
  );
}