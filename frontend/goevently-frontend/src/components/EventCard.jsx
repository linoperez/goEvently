import { CalendarDays, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import Card from "./ui/Card";

function getCategoryColor(categoryName) {
  const name = String(categoryName || "").toLowerCase();

  if (name.includes("music")) return "indigo";
  if (name.includes("tech")) return "teal";
  if (name.includes("comedy")) return "orange";
  if (name.includes("art")) return "red";
  return "gray";
}

function getEventGradient(index) {
  const gradients = [
    "from-purple-700 via-fuchsia-500 to-cyan-400",
    "from-slate-800 via-indigo-500 to-teal-300",
    "from-orange-100 via-stone-300 to-amber-700",
    "from-red-900 via-orange-500 to-yellow-300",
    "from-cyan-600 via-teal-400 to-emerald-200",
  ];

  return gradients[index % gradients.length];
}

export default function EventCard({ event, index = 0 }) {
  const eventId = event.id;
  const title = event.title || event.name || "Untitled Event";
  const category =
    event.categoryName ||
    event.category?.name ||
    event.category ||
    "EVENT";

  const city = event.city || event.venueCity || event.venue?.city || "";
  const venue =
    event.venueName ||
    event.venue?.name ||
    event.location ||
    event.venue ||
    "Venue details";

  const startDate =
    event.startDate ||
    event.eventDate ||
    event.date ||
    event.startTime ||
    "Date TBA";

  const price =
    event.price ||
    event.startingPrice ||
    event.minPrice ||
    event.ticketPrice ||
    null;

  return (
    <Card className="group overflow-hidden transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
      <div
        className={`h-48 bg-gradient-to-br ${getEventGradient(index)} relative overflow-hidden`}
      >
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute right-4 top-4 rounded-full border border-white/50 bg-white/20 px-3 py-1 text-xs font800 text-white backdrop-blur">
          Live
        </div>
      </div>

      <div className="p-5">
        <Badge color={getCategoryColor(category)}>{String(category).toUpperCase()}</Badge>

        <h3 className="mt-4 min-h-14 text-lg font800 leading-7 text-[#0b1533]">
          {title}
        </h3>

        <div className="mt-4 space-y-3 text-sm font600 text-[#66708a]">
          <div className="flex items-center gap-2">
            <CalendarDays size={17} />
            <span>{String(startDate)}</span>
          </div>

          <div className="flex items-start gap-2">
            <MapPin size={17} className="mt-0.5 shrink-0" />
            <span>
              {venue}
              {city ? `, ${city}` : ""}
            </span>
          </div>
        </div>

        <div className="mt-6 flex items-end justify-between">
          <div>
            <p className="text-xs font600 text-[#66708a]">From</p>
            <p className="text-2xl font800 text-[#0ea5a4]">
              {price ? `₹${price}` : "View tiers"}
            </p>
          </div>

          <Link to={`/events/${eventId}`}>
            <Button variant="secondary" size="sm">
              View Details
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}