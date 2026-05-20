export default function FormInput({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  name,
  required = false,
  icon,
  className = "",
  ...props
}) {
  return (
    <div>
      {label ? (
        <label className="mb-2 block text-sm font700 text-[#0b1533]">
          {label} {required ? <span className="text-red-500">*</span> : null}
        </label>
      ) : null}

      <div className="relative">
        {icon ? (
          <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8b95aa]">
            {icon}
          </div>
        ) : null}

        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          {...props}
          className={`w-full rounded-2xl border border-[#e0e6f0] bg-white px-4 py-3.5 text-sm font600 text-[#0b1533] outline-none transition placeholder:text-[#9aa4b8] focus:border-[#0ea5a4] focus:ring-4 focus:ring-teal-500/10 ${
            icon ? "pl-12" : ""
          } ${className}`}
        />
      </div>
    </div>
  );
}