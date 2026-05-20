import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Ticket,
  UserRound,
} from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import FormInput from "../components/ui/FormInput";
import ErrorState from "../components/ui/ErrorState";
import { createBooking } from "../api/bookingApi";

function unwrapData(response) {
  return response?.data ?? response;
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return "₹0";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function formatDateTime(value) {
  if (!value) return "Date TBA";

  try {
    const date = new Date(value);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return String(value);
  }
}

function getSecondsLeft(expiresAt) {
  if (!expiresAt) return 0;

  const expiryTime = new Date(expiresAt).getTime();
  const now = Date.now();

  return Math.max(0, Math.floor((expiryTime - now) / 1000));
}

function formatTimer(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function BookingDetailsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state || {};
  const event = state.event;
  const ticketTier = state.ticketTier;
  const lock = state.lock;
  const quantity = state.quantity || 1;
  const totalAmount = state.totalAmount || Number(ticketTier?.price || 0) * quantity;

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    mobile: "",
    city: "",
  });

  const [secondsLeft, setSecondsLeft] = useState(() =>
    getSecondsLeft(lock?.expiresAt)
  );

  const [creatingBooking, setCreatingBooking] = useState(false);
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState("");

  const isLockExpired = secondsLeft <= 0;

  useEffect(() => {
    if (!lock?.expiresAt) return;

    const interval = setInterval(() => {
      setSecondsLeft(getSecondsLeft(lock.expiresAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [lock]);

  const eventTitle = event?.name || event?.title || "Untitled Event";
  const locationText = event?.location || event?.venueName || "Venue details";
  const startTime = formatDateTime(event?.startTime);

  const canSubmit = useMemo(() => {
    return (
      form.fullName.trim() &&
      form.email.trim() &&
      form.mobile.trim() &&
      form.city.trim() &&
      lock?.lockId &&
      !isLockExpired &&
      !booking
    );
  }, [form, lock, isLockExpired, booking]);

  if (!event || !ticketTier || !lock?.lockId) {
    return (
      <AppLayout>
        <ErrorState
          title="Booking data missing"
          message="Please reserve tickets again before creating a booking."
        />

        <div className="mt-6">
          <Link to="/events">
            <Button>Back to Events</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();

    if (isLockExpired) {
      setError("Lock expired. Please reserve tickets again.");
      return;
    }

    try {
      setCreatingBooking(true);
      setError("");

      const payload = {
        eventId: event.id,
        ticketTierId: ticketTier.id,
        quantity,
        lockId: lock.lockId,
      };

      const response = await createBooking(payload);
      const bookingData = unwrapData(response);

      if (!bookingData?.id) {
        throw new Error("Booking ID not found in response");
      }

      setBooking(bookingData);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Could not create booking"
      );
    } finally {
      setCreatingBooking(false);
    }
  };

  const handleContinueToPayment = () => {
    navigate("/payment", {
      state: {
        event,
        ticketTier,
        lock,
        quantity,
        totalAmount,
        booking,
      },
    });
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex items-center justify-center gap-4">
          <Step done label="Tickets" number="1" />
          <div className="h-px w-28 bg-[#0ea5a4]" />
          <Step done label="Reserve Lock" number="2" />
          <div className="h-px w-28 bg-[#0ea5a4]" />
          <Step active label="Booking Details" number="3" />
          <div className="h-px w-28 bg-[#e6eaf2]" />
          <Step label="Payment" number="4" />
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <section className="space-y-6">
            <Card className="p-7">
              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                <div>
                  <Badge color="teal">BOOKING DETAILS</Badge>
                  <h1 className="mt-4 text-4xl font800 tracking-[-0.04em] text-[#0b1533]">
                    Enter attendee details
                  </h1>
                  <p className="mt-3 max-w-2xl text-base font500 leading-8 text-[#66708a]">
                    Your seat lock is active. Create the booking before the timer
                    expires.
                  </p>
                </div>

                <div
                  className={`w-36 shrink-0 rounded-2xl px-5 py-4 text-center ${
                    isLockExpired ? "bg-red-50" : "bg-teal-50"
                  }`}
                >
                  <p
                    className={`whitespace-nowrap text-xs font800 ${
                      isLockExpired ? "text-red-500" : "text-[#0ea5a4]"
                    }`}
                  >
                    Lock timer
                  </p>
                  <p className="mt-1 tabular-nums text-3xl font800 text-[#0b1533]">
                    {formatTimer(secondsLeft)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-7">
              <form onSubmit={handleCreateBooking} className="space-y-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <FormInput
                    label="Full Name"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="Enter attendee name"
                    icon={<UserRound size={20} />}
                    required
                  />

                  <FormInput
                    label="Email Address"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    icon={<Mail size={20} />}
                    required
                  />

                  <FormInput
                    label="Mobile Number"
                    name="mobile"
                    value={form.mobile}
                    onChange={handleChange}
                    placeholder="98765 43210"
                    icon={<Phone size={20} />}
                    required
                  />

                  <FormInput
                    label="City"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="Bengaluru"
                    icon={<MapPin size={20} />}
                    required
                  />
                </div>

                <div className="rounded-3xl border border-[#e6eaf2] bg-slate-50 p-5">
                  <div className="flex gap-4">
                    <ShieldCheck className="text-[#0ea5a4]" />
                    <div>
                      <p className="font800 text-[#0b1533]">
                        Backend note
                      </p>
                      <p className="mt-1 text-sm font600 leading-6 text-[#66708a]">
                        These attendee fields are UI-level details for now. Your
                        backend booking API currently stores booking using
                        event, ticket tier, quantity, and lock ID.
                      </p>
                    </div>
                  </div>
                </div>

                {isLockExpired ? (
                  <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font700 text-red-600">
                    This lock has expired. Please go back and reserve tickets again.
                  </div>
                ) : null}

                {error ? (
                  <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font700 text-red-600">
                    {error}
                  </div>
                ) : null}

                {booking ? (
                  <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
                    <div className="flex gap-4">
                      <CheckCircle2 className="text-emerald-600" />
                      <div>
                        <p className="font800 text-[#0b1533]">
                          Booking created successfully
                        </p>
                        <p className="mt-1 text-sm font600 text-[#66708a]">
                          Booking ID:{" "}
                          <span className="font800 text-[#0b1533]">
                            {booking.id}
                          </span>
                        </p>
                        <p className="mt-1 text-sm font600 text-[#66708a]">
                          Status:{" "}
                          <span className="font800 text-[#0ea5a4]">
                            {booking.status}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  {!booking ? (
                    <Button
                      type="submit"
                      disabled={!canSubmit || creatingBooking}
                    >
                      {creatingBooking ? "Creating Booking..." : "Create Booking"}
                    </Button>
                  ) : (
                    <Button type="button" onClick={handleContinueToPayment}>
                      Continue to Payment
                    </Button>
                  )}

                  <Link to={`/events/${event.id}`}>
                    <Button type="button" variant="secondary">
                      Back to Event
                    </Button>
                  </Link>
                </div>
              </form>
            </Card>
          </section>

          <aside className="space-y-6">
            <Card className="overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-purple-700 via-fuchsia-500 to-cyan-400" />

              <div className="p-6">
                <Badge color="indigo">
                  {String(event.categoryName || "EVENT").toUpperCase()}
                </Badge>

                <h2 className="mt-4 text-2xl font800 leading-8 tracking-[-0.03em] text-[#0b1533]">
                  {eventTitle}
                </h2>

                <div className="mt-5 space-y-3 text-sm font600 text-[#66708a]">
                  <div className="flex gap-3">
                    <CalendarDays size={18} />
                    <span>{startTime}</span>
                  </div>

                  <div className="flex gap-3">
                    <MapPin size={18} />
                    <span>{locationText}</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font800 text-[#0b1533]">Order Summary</h3>

              <div className="mt-6 space-y-4">
                <SummaryRow label="Ticket Tier" value={ticketTier.name} />
                <SummaryRow label="Price" value={formatCurrency(ticketTier.price)} />
                <SummaryRow label="Quantity" value={quantity} />
                <SummaryRow label="Lock ID" value={lock.lockId.slice(0, 8) + "..."} />
                <div className="border-t border-[#e6eaf2] pt-4">
                  <SummaryRow
                    label="Total Amount"
                    value={formatCurrency(totalAmount)}
                    strong
                  />
                </div>
              </div>

              <div className="mt-6 rounded-3xl bg-teal-50 p-4">
                <div className="flex gap-3">
                  <Lock className="text-[#0ea5a4]" />
                  <p className="text-sm font700 leading-6 text-[#0b1533]">
                    Booking will be created using the active lock. Payment will
                    confirm it in the next step.
                  </p>
                </div>
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}

function Step({ label, number, active = false, done = false }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font800 ${
          done
            ? "bg-[#0ea5a4] text-white"
            : active
            ? "bg-[#0ea5a4] text-white"
            : "border border-[#cfd7e6] bg-white text-[#66708a]"
        }`}
      >
        {done ? <CheckCircle2 size={20} /> : number}
      </div>
      <span
        className={`hidden text-sm font800 md:inline ${
          active ? "text-[#0b1533]" : "text-[#66708a]"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function SummaryRow({ label, value, strong = false }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font600 text-[#66708a]">{label}</span>
      <span
        className={
          strong
            ? "text-2xl font800 text-[#0ea5a4]"
            : "text-right text-sm font800 text-[#0b1533]"
        }
      >
        {value}
      </span>
    </div>
  );
}