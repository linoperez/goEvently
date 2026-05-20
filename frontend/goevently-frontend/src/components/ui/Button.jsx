export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl font700 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-5 py-3 text-sm",
    lg: "px-6 py-4 text-base",
  };

  const variants = {
    primary:
      "gev-gradient text-white shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/25",
    secondary:
      "border border-[#e6eaf2] bg-white text-[#0b1533] hover:border-[#cfd7e6] hover:bg-slate-50",
    ghost:
      "text-[#66708a] hover:bg-slate-100 hover:text-[#0b1533]",
    danger:
      "bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-600",
  };

  return (
    <button
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}