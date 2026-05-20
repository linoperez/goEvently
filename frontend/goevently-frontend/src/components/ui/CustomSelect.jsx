import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

function getOptionValue(option) {
  return typeof option === "object" && option !== null ? option.value : option;
}

function getOptionLabel(option) {
  return typeof option === "object" && option !== null ? option.label : option;
}

function getSelectedLabel(options, value, placeholder) {
  const selectedOption = options.find(
    (option) => String(getOptionValue(option)) === String(value)
  );

  return selectedOption ? getOptionLabel(selectedOption) : placeholder;
}

export default function CustomSelect({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Select option",
  required = false,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedLabel = getSelectedLabel(options, value, placeholder);

  return (
    <div className={className} ref={selectRef}>
      {label ? (
        <label className="mb-2 block text-sm font700 text-[#0b1533]">
          {label} {required ? <span className="text-red-500">*</span> : null}
        </label>
      ) : null}

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={`flex w-full items-center justify-between gap-3 rounded-2xl border border-[#e0e6f0] bg-white px-4 py-3.5 text-left text-sm font700 outline-none transition ${
            open
              ? "border-[#0ea5a4] ring-4 ring-teal-500/10"
              : "hover:border-[#cfd7e6]"
          }`}
        >
          <span
            className={
              value ? "text-[#0b1533]" : "text-[#9aa4b8]"
            }
          >
            {selectedLabel}
          </span>

          <ChevronDown
            size={18}
            className={`shrink-0 text-[#66708a] transition-transform duration-300 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        <div
          className={`absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-[#e6eaf2] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.14)] transition-all duration-300 ease-out ${
            open
              ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
              : "pointer-events-none -translate-y-2 scale-[0.98] opacity-0"
          }`}
        >
          <div className="max-h-64 overflow-y-auto p-2">
            {options.map((option) => {
              const optionValue = getOptionValue(option);
              const optionLabel = getOptionLabel(option);
              const active = String(optionValue) === String(value);

              return (
                <button
                  key={String(optionValue)}
                  type="button"
                  onClick={() => {
                    onChange(optionValue);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm font700 transition ${
                    active
                      ? "bg-teal-50 text-[#0ea5a4]"
                      : "text-[#4b587c] hover:bg-slate-50 hover:text-[#0b1533]"
                  }`}
                >
                  <span>{optionLabel}</span>

                  {active ? <Check size={16} /> : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}