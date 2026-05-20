import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS = [
  { label: "Jan", value: "01" },
  { label: "Feb", value: "02" },
  { label: "Mar", value: "03" },
  { label: "Apr", value: "04" },
  { label: "May", value: "05" },
  { label: "Jun", value: "06" },
  { label: "Jul", value: "07" },
  { label: "Aug", value: "08" },
  { label: "Sep", value: "09" },
  { label: "Oct", value: "10" },
  { label: "Nov", value: "11" },
  { label: "Dec", value: "12" },
];

function getCurrentYear() {
  return new Date().getFullYear();
}

function getCurrentMonth() {
  return new Date().getMonth() + 1;
}

function parseValue(value) {
  if (!value || !String(value).includes("-")) {
    return {
      year: getCurrentYear(),
      month: "",
    };
  }

  const [year, month] = String(value).split("-");

  return {
    year: Number(year) || getCurrentYear(),
    month: month || "",
  };
}

function getDisplayValue(value, placeholder) {
  const parsed = parseValue(value);

  if (!parsed.month) return placeholder;

  const monthLabel =
    MONTHS.find((month) => month.value === parsed.month)?.label || parsed.month;

  return `${monthLabel} ${parsed.year}`;
}



export default function CustomMonthYearPicker({
  label,
  value,
  onChange,
  placeholder = "Select month and year",
  required = false,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(parseValue(value).year);

  const pickerRef = useRef(null);

  const selected = useMemo(() => parseValue(value), [value]);
  const displayValue = getDisplayValue(value, placeholder);
  const currentYear = getCurrentYear();
  const currentMonth = getCurrentMonth();
  const canGoPreviousYear = viewYear > currentYear;

  useEffect(() => {
    if (selected.year) {
      setViewYear(selected.year);
    }
  }, [selected.year]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelectMonth = (monthValue) => {
    onChange(`${viewYear}-${monthValue}`);
    setOpen(false);
  };

  const handleClear = (event) => {
    event.stopPropagation();
    onChange("");
    setOpen(false);
  };

  return (
    <div className={className} ref={pickerRef}>
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
          <div className="flex min-w-0 items-center gap-3">
            <CalendarDays size={18} className="shrink-0 text-[#8b95aa]" />

            <span
              className={`truncate ${
                value ? "text-[#0b1533]" : "text-[#9aa4b8]"
              }`}
            >
              {displayValue}
            </span>
          </div>

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
          <div className="p-3">
            <div className="mb-3 flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
              <button
                type="button"
                onClick={() => {
                  if (canGoPreviousYear) {
                    setViewYear((prev) => prev - 1);
                  }
                }}
                disabled={!canGoPreviousYear}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-[#66708a] transition hover:bg-white hover:text-[#0b1533] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-[#66708a]"
              >
                <ChevronLeft size={18} />
              </button>

              <p className="text-sm font800 text-[#0b1533]">{viewYear}</p>

              <button
                type="button"
                onClick={() => setViewYear((prev) => prev + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-[#66708a] transition hover:bg-white hover:text-[#0b1533]"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {MONTHS.map((month) => {
                const monthNumber = Number(month.value);

                const isPastMonth =
                  viewYear < currentYear ||
                  (viewYear === currentYear && monthNumber < currentMonth);

                const active =
                  selected.year === viewYear && selected.month === month.value;

                return (
                  <button
                    key={month.value}
                    type="button"
                    disabled={isPastMonth}
                    onClick={() => {
                      if (!isPastMonth) {
                        handleSelectMonth(month.value);
                      }
                    }}
                    className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font800 transition ${
                      isPastMonth
                        ? "cursor-not-allowed bg-slate-50 text-[#c0c7d6]"
                        : active
                        ? "bg-teal-50 text-[#0ea5a4]"
                        : "text-[#4b587c] hover:bg-slate-50 hover:text-[#0b1533]"
                    }`}
                  >
                    <span>{month.label}</span>
                    {active ? <Check size={15} /> : null}
                  </button>
                );
              })}
            </div>

            {value ? (
              <button
                type="button"
                onClick={handleClear}
                className="mt-3 w-full rounded-xl px-3 py-2.5 text-sm font800 text-[#66708a] transition hover:bg-slate-50 hover:text-[#0b1533]"
              >
                Clear month
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}