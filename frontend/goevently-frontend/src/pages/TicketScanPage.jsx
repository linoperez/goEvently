import { Link, useSearchParams } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  Hash,
  MapPin,
  ShieldCheck,
  Ticket,
  Users,
} from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";

function formatEventDate(value) {
  if (!value) return "Date unavailable";

  try {
    const date = new Date(value);

    const datePart = date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const dayPart = date.toLocaleDateString("en-IN", {
      weekday: "short",
    });

    const timePart = date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    return `${datePart}, ${dayPart} • ${timePart}`;
  } catch {
    return String(value);
  }
}

function normalizeStatus(status) {
  return String(status || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

export default function TicketScanPage() {
  const [searchParams] = useSearchParams();

  const bookingId = searchParams.get("bookingId");
  const eventId = searchParams.get("eventId");
  const ticketTierId = searchParams.get("ticketTierId");
  const quantity = searchParams.get("quantity") || "1";
  const status = normalizeStatus(searchParams.get("status"));
  const paymentId = searchParams.get("paymentId");
  const ticketCode = searchParams.get("ticketCode");
  const eventName = searchParams.get("eventName") || "goEvently Event";
  const ticketTierName = searchParams.get("ticketTierName") || "Ticket";
  const location = searchParams.get("location") || "Venue unavailable";
  const eventDate = searchParams.get("eventDate");

  const isConfirmed = status === "CONFIRMED";

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl">
        <Card className="overflow-hidden">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#061024] via-[#111a3d] to-[#0ea5a4] p-8 text-white md:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.18),transparent_26%),radial-gradient(circle_at_20%_80%,rgba(79,70,229,0.28),transparent_30%)]" />

            <div className="relative z-10">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font800 uppercase tracking-[0.24em] text-white/60">
                    goEvently Ticket Verification
                  </p>

                  <h1 className="mt-4 text-4xl font800 tracking-[-0.05em] md:text-5xl">
                    {eventName}
                  </h1>

                  <p className="mt-4 max-w-2xl text-sm font600 leading-7 text-white/75">
                    This ticket was scanned from a goEvently booking QR code.
                  </p>
                </div>

                <div
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font800 ${
                    isConfirmed
                      ? "bg-emerald-400/15 text-emerald-100"
                      : "bg-orange-400/15 text-orange-100"
                  }`}
                >
                  <CheckCircle2 size={18} />
                  {status || "UNKNOWN"}
                </div>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <TicketScanInfo
                  icon={<Ticket />}
                  label="Ticket Tier"
                  value={ticketTierName}
                />

                <TicketScanInfo
                  icon={<Users />}
                  label="Quantity"
                  value={quantity}
                />

                <TicketScanInfo
                  icon={<Hash />}
                  label="Booking ID"
                  value={`GEV-${bookingId || "N/A"}`}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-0 md:grid-cols-[1fr_320px]">
            <div className="p-7">
              <h2 className="text-2xl font800 tracking-[-0.03em] text-[#0b1533]">
                Ticket Details
              </h2>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <DetailBox
                  icon={<CalendarDays size={20} />}
                  label="Event Date & Time"
                  value={formatEventDate(eventDate)}
                />

                <DetailBox
                  icon={<MapPin size={20} />}
                  label="Location"
                  value={location}
                />

                <DetailBox
                  icon={<Hash size={20} />}
                  label="Event ID"
                  value={eventId || "N/A"}
                />

                <DetailBox
                  icon={<Hash size={20} />}
                  label="Ticket Tier ID"
                  value={ticketTierId || "N/A"}
                />

                <DetailBox
                  icon={<ShieldCheck size={20} />}
                  label="Payment ID"
                  value={paymentId || "N/A"}
                />

                <DetailBox
                  icon={<Ticket size={20} />}
                  label="Ticket Code"
                  value={ticketCode || "N/A"}
                  mono
                />
              </div>
            </div>

            <div className="border-t border-[#e6eaf2] bg-slate-50 p-7 md:border-l md:border-t-0">
              <div className="rounded-3xl bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
                <div
                  className={`mx-auto flex h-20 w-20 items-center justify-center rounded-3xl ${
                    isConfirmed
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-orange-50 text-orange-600"
                  }`}
                >
                  <ShieldCheck size={36} />
                </div>

                <div className="mt-5 text-center">
                  <Badge color={isConfirmed ? "green" : "orange"}>
                    {isConfirmed ? "VALID TICKET" : "CHECK STATUS"}
                  </Badge>

                  <h3 className="mt-4 text-xl font800 text-[#0b1533]">
                    {isConfirmed ? "Ticket Confirmed" : "Not Confirmed"}
                  </h3>

                  <p className="mt-3 text-sm font600 leading-6 text-[#66708a]">
                    {isConfirmed
                      ? "This QR belongs to a confirmed goEvently booking."
                      : "This ticket is not currently marked as confirmed."}
                  </p>
                </div>

                <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font700 text-[#66708a]">
                    Verification Code
                  </p>
                  <p className="mt-1 break-words font-mono text-sm font800 text-[#0b1533]">
                    {ticketCode || "N/A"}
                  </p>
                </div>

                <Link to={eventId ? `/events/${eventId}` : "/events"}>
                  <Button className="mt-5 w-full">View Event</Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}

function TicketScanInfo({ icon, label, value }) {
  return (
    <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur">
      <div className="text-white/80">{icon}</div>
      <p className="mt-3 text-xs font800 uppercase tracking-wide text-white/50">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font800 text-white">{value}</p>
    </div>
  );
}

function DetailBox({ icon, label, value, mono = false }) {
  return (
    <div className="rounded-3xl border border-[#e6eaf2] bg-white p-5">
      <div className="flex items-center gap-3 text-[#0ea5a4]">
        {icon}
        <p className="text-xs font800 uppercase tracking-wide text-[#66708a]">
          {label}
        </p>
      </div>

      <p
        className={`mt-3 break-words text-sm font800 text-[#0b1533] ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}