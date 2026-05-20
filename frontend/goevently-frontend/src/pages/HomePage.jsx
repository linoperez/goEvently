import { useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Grid2X2,
  MapPin,
  Music,
  Code2,
  Palette,
  Laugh,
  ShieldCheck,
  Armchair,
  Zap,
} from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";

const categories = [
  { name: "Music", icon: <Music size={18} /> },
  { name: "Tech", icon: <Code2 size={18} /> },
  { name: "Workshops", icon: <Palette size={18} /> },
  { name: "Comedy", icon: <Laugh size={18} /> },
  { name: "Art & Culture", icon: <Palette size={18} /> },
];

const demoEvents = [
  {
    title: "Armaan Malik – Live in Concert",
    category: "MUSIC",
    price: "₹1,299",
    date: "24 May 2025",
    venue: "Kanteerava Stadium",
  },
  {
    title: "Bengaluru Devs Meetup #24",
    category: "TECH",
    price: "₹299",
    date: "25 May 2025",
    venue: "91springboard, Koramangala",
  },
  {
    title: "Ceramic Pottery Workshop",
    category: "WORKSHOP",
    price: "₹1,199",
    date: "31 May 2025",
    venue: "Clay Station Studio",
  },
];

export default function HomePage() {
  const [filters, setFilters] = useState({
    city: "Bengaluru, India",
    date: "Any Date",
    category: "All Categories",
  });

  const handleFilterChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };
  return (
    <AppLayout>
      <section className="grid items-center gap-12 py-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <h1 className="max-w-3xl text-6xl font800 leading-[1.05] tracking-[-0.055em] text-[#0b1533]">
            Discover events worth{" "}
            <span className="bg-gradient-to-r from-[#0ea5a4] via-[#2563eb] to-[#4f46e5] bg-clip-text text-transparent">
              showing up
            </span>{" "}
            for
          </h1>

          <p className="mt-6 max-w-2xl text-xl font500 leading-9 text-[#66708a]">
            Find experiences that inspire, connect, and stay with you. Book
            securely in just a few clicks.
          </p>
        </div>

        <div className="hidden lg:block">
          <div className="relative h-72 rounded-[2rem] border border-[#e6eaf2] bg-gradient-to-br from-teal-50 via-indigo-50 to-white p-8">
            <div className="absolute bottom-8 left-8 right-8 h-28 rounded-3xl border border-white/80 bg-white/70 backdrop-blur" />
            <div className="absolute right-10 top-8 h-24 w-24 rounded-full border-[10px] border-indigo-100" />
            <div className="absolute left-12 top-12 h-20 w-20 rounded-full bg-teal-100" />
            <div className="absolute bottom-16 right-20 h-36 w-16 rounded-t-full bg-indigo-100" />
            <p className="relative z-10 text-sm font800 text-[#0ea5a4]">
              Live booking system
            </p>
            <h2 className="relative z-10 mt-3 max-w-sm text-3xl font800 tracking-[-0.03em] text-[#0b1533]">
              Locks, payments, confirmations, notifications.
            </h2>
          </div>
        </div>
      </section>

      <Card className="mb-12 p-4">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto]">
          <FilterSelect
            icon={<MapPin size={24} />}
            label="City"
            name="city"
            value={filters.city}
            onChange={handleFilterChange}
            options={[
              "Bengaluru, India",
              "Pune, India",
              "Mumbai, India",
              "Delhi, India",
              "Hyderabad, India",
            ]}
            bordered
          />

          <FilterSelect
            icon={<CalendarDays size={24} />}
            label="Date"
            name="date"
            value={filters.date}
            onChange={handleFilterChange}
            options={[
              "Any Date",
              "Today",
              "Tomorrow",
              "This Weekend",
              "This Month",
            ]}
            bordered
          />

          <FilterSelect
            icon={<Grid2X2 size={24} />}
            label="Category"
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
            options={[
              "All Categories",
              "Music",
              "Tech",
              "Workshops",
              "Comedy",
              "Art & Culture",
              "Business",
              "Health",
            ]}
          />

          <Link to="/events" className="p-2">
            <Button className="h-full w-full px-8">Search Events</Button>
          </Link>
        </div>
      </Card>

      <section className="mb-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font800 text-[#0b1533]">Browse by category</h2>
          <button className="text-sm font800 text-[#0b1533]">
            View all categories →
          </button>
        </div>

        <div className="flex flex-wrap gap-4">
          {categories.map((category) => (
            <button
              key={category.name}
              className="flex items-center gap-3 rounded-2xl border border-[#e6eaf2] bg-white px-6 py-4 text-sm font800 text-[#0b1533] transition hover:border-[#0ea5a4] hover:text-[#0ea5a4]"
            >
              <span className="text-indigo-600">{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>
      </section>

      <Card className="mb-14 p-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-teal-50 p-4 text-[#0ea5a4]">
              <ShieldCheck />
            </div>
            <div>
              <h3 className="font800 text-[#0b1533]">Secure Booking</h3>
              <p className="mt-1 text-sm font500 text-[#66708a]">
                JWT-protected backend flow.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="rounded-full bg-teal-50 p-4 text-[#0ea5a4]">
              <Armchair />
            </div>
            <div>
              <h3 className="font800 text-[#0b1533]">Live Seat Availability</h3>
              <p className="mt-1 text-sm font500 text-[#66708a]">
                Redis locks prevent overbooking.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="rounded-full bg-teal-50 p-4 text-[#0ea5a4]">
              <Zap />
            </div>
            <div>
              <h3 className="font800 text-[#0b1533]">Instant Confirmations</h3>
              <p className="mt-1 text-sm font500 text-[#66708a]">
                Kafka updates booking state.
              </p>
            </div>
          </div>
        </div>
      </Card>

      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font800 tracking-[-0.03em] text-[#0b1533]">
            Trending Events
          </h2>
          <Link to="/events" className="text-sm font800 text-[#0b1533]">
            See all events →
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {demoEvents.map((event, index) => (
            <Card key={event.title} className="overflow-hidden">
              <div
                className={`h-44 ${
                  index === 0
                    ? "bg-gradient-to-br from-purple-700 via-fuchsia-500 to-cyan-400"
                    : index === 1
                    ? "bg-gradient-to-br from-slate-800 via-indigo-500 to-teal-300"
                    : "bg-gradient-to-br from-orange-100 via-stone-300 to-amber-700"
                }`}
              />
              <div className="p-5">
                <Badge color={index === 0 ? "indigo" : "teal"}>
                  {event.category}
                </Badge>
                <h3 className="mt-4 min-h-14 text-lg font800 leading-7 text-[#0b1533]">
                  {event.title}
                </h3>
                <p className="mt-3 text-sm font600 text-[#66708a]">
                  {event.date}
                </p>
                <p className="mt-2 text-sm font600 text-[#66708a]">
                  {event.venue}
                </p>

                <div className="mt-6 flex items-end justify-between">
                  <div>
                    <p className="text-xs font600 text-[#66708a]">From</p>
                    <p className="text-2xl font800 text-[#0ea5a4]">
                      {event.price}
                    </p>
                  </div>
                  <Button variant="secondary" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </AppLayout>
  );
}

function FilterSelect({
  icon,
  label,
  name,
  value,
  onChange,
  options,
  bordered = false,
}) {
  const [open, setOpen] = useState(false);

  const handleSelect = (option) => {
    onChange({
      target: {
        name,
        value: option,
      },
    });
    setOpen(false);
  };

  return (
    <div
      className={`relative flex items-center gap-4 p-4 ${
        bordered ? "border-b border-[#e6eaf2] md:border-b-0 md:border-r" : ""
      }`}
    >
      <div className="text-[#66708a]">{icon}</div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font700 text-[#66708a]">{label}</p>

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="mt-1 flex w-full items-center justify-between gap-3 text-left"
        >
          <span className="truncate text-base font800 text-[#0b1533]">
            {value}
          </span>

          <ChevronDown
            size={18}
            className={`shrink-0 text-[#66708a] transition ${
              open ? "rotate-180 text-[#0ea5a4]" : ""
            }`}
          />
        </button>

        {open ? (
          <div className="absolute left-4 right-4 top-[78px] z-40 overflow-hidden rounded-2xl border border-[#e6eaf2] bg-white p-2 shadow-[0_22px_60px_rgba(15,23,42,0.14)]">
            <div className="max-h-72 overflow-y-auto">
              {options.map((option) => {
                const active = option === value;

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font700 transition ${
                      active
                        ? "bg-teal-50 text-[#0ea5a4]"
                        : "text-[#0b1533] hover:bg-slate-50"
                    }`}
                  >
                    <span>{option}</span>

                    {active ? (
                      <Check size={17} className="text-[#0ea5a4]" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}