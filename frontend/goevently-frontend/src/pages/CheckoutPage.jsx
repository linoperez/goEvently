import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  Lock,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import ErrorState from "../components/ui/ErrorState";
import { createLock, releaseLock } from "../api/bookingApi";
import AnimatedQuantity from "../components/ui/AnimatedQuantity";

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

function unwrapData(response) {
  return response?.data ?? response;
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

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state || {};
  const event = state.event;
  const ticketTier = state.ticketTier;

  const [quantity, setQuantity] = useState(state.quantity || 1);
  const [lock, setLock] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const [creatingLock, setCreatingLock] = useState(false);
  const [releasingLock, setReleasingLock] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const [error, setError] = useState("");

  const totalAmount = useMemo(() => {
    return Number(ticketTier?.price || 0) * Number(quantity || 1);
  }, [ticketTier, quantity]);

  useEffect(() => {
    if (!lock?.expiresAt) return;

    setSecondsLeft(getSecondsLeft(lock.expiresAt));

    const interval = setInterval(() => {
      setSecondsLeft(getSecondsLeft(lock.expiresAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [lock]);

  if (!event || !ticketTier) {
    return (
      <AppLayout>
        <ErrorState
          title="Checkout data missing"
          message="Please go back to events, select a ticket tier, and continue again."
        />

        <div className="mt-6">
          <Link to="/events">
            <Button>Back to Events</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const locationText = event.location || event.venueName || "Venue details";
  const startTime = formatDateTime(event.startTime);
  const remainingQuantity = ticketTier.remainingQuantity ?? 1;
  const isBusy = creatingLock || releasingLock || continuing;

  const incrementQuantity = () => {
    if (lock || isBusy) return;
    setQuantity((prev) => Math.min(prev + 1, remainingQuantity));
  };

  const decrementQuantity = () => {
    if (lock || isBusy) return;
    setQuantity((prev) => Math.max(prev - 1, 1));
  };

  const handleCreateLock = async () => {
    if (creatingLock || releasingLock || lock) return;

    try {
      setCreatingLock(true);
      setError("");

      const payload = {
        eventId: event.id,
        ticketTierId: ticketTier.id,
        quantity,
      };

      const response = await createLock(payload);
      const lockData = unwrapData(response);

      if (!lockData?.lockId) {
        throw new Error("Lock ID not found in response");
      }

      setLock(lockData);
      setSecondsLeft(getSecondsLeft(lockData.expiresAt));
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Could not reserve tickets"
      );
    } finally {
      setCreatingLock(false);
    }
  };

  const handleReleaseLock = async () => {
    if (!lock?.lockId || releasingLock || creatingLock) return;

    try {
      setReleasingLock(true);
      setError("");

      await releaseLock(lock.lockId);
      setLock(null);
      setSecondsLeft(0);
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || "Could not release lock"
      );
    } finally {
      setReleasingLock(false);
    }
  };

  const handleContinueToBooking = () => {
    if (!lock?.lockId || continuing || releasingLock) return;

    setContinuing(true);

    navigate("/booking-details", {
      state: {
        event,
        ticketTier,
        quantity,
        totalAmount,
        lock,
      },
    });
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex items-center justify-center gap-4">
          <Step active done label="Tickets" number="1" />
          <div className="h-px w-28 bg-[#0ea5a4]" />
          <Step active label="Reserve Lock" number="2" />
          <div className="h-px w-28 bg-[#e6eaf2]" />
          <Step label="Booking Details" number="3" />
          <div className="h-px w-28 bg-[#e6eaf2]" />
          <Step label="Payment" number="4" />
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <section className="space-y-6">
            <Card className="p-7">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <Badge color="teal">CHECKOUT</Badge>
                  <h1 className="mt-4 text-4xl font800 tracking-[-0.04em] text-[#0b1533]">
                    Reserve your tickets
                  </h1>
                  <p className="mt-3 max-w-2xl text-base font500 leading-8 text-[#66708a]">
                    This step creates a temporary Redis-backed lock so your
                    selected tickets are held while you complete booking.
                  </p>
                </div>

                {lock ? (
                  <div className="w-36 shrink-0 rounded-2xl bg-teal-50 px-5 py-4 text-center">
                    <p className="whitespace-nowrap text-xs font800 text-[#0ea5a4]">
                      Seats reserved
                    </p>
                    <p className="mt-1 tabular-nums text-3xl font800 text-[#0b1533]">
                      {formatTimer(secondsLeft)}
                    </p>
                  </div>
                ) : null}
              </div>
            </Card>

            <Card className="p-7">
              <h2 className="text-2xl font800 tracking-[-0.03em] text-[#0b1533]">
                Selected Ticket
              </h2>

              <div className="mt-6 rounded-3xl border border-[#e6eaf2] bg-white p-5">
                <div className="flex items-start justify-between gap-5">
                  <div className="flex gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                      <Ticket size={28} />
                    </div>

                    <div>
                      <h3 className="text-lg font800 text-[#0b1533]">
                        {ticketTier.name}
                      </h3>
                      <p className="mt-1 text-sm font600 text-[#66708a]">
                        {ticketTier.description || "Standard event access"}
                      </p>
                      <p className="mt-2 text-sm font700 text-[#0ea5a4]">
                        {ticketTier.remainingQuantity} seats available
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font800 text-[#0b1533]">
                      {formatCurrency(ticketTier.price)}
                    </p>
                    <p className="mt-1 text-xs font600 text-[#66708a]">
                      / ticket
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-7 flex items-center justify-between rounded-3xl bg-slate-50 p-5">
                <div>
                  <p className="text-sm font800 text-[#0b1533]">Quantity</p>
                  <p className="mt-1 text-xs font600 text-[#66708a]">
                    Quantity cannot be changed after lock is created.
                  </p>
                </div>

                <div className="flex overflow-hidden rounded-2xl border border-[#e6eaf2] bg-white">
                  <button
                    type="button"
                    onClick={decrementQuantity}
                    disabled={Boolean(lock) || isBusy}
                    className="flex h-12 w-14 items-center justify-center text-[#66708a] hover:bg-slate-50 disabled:opacity-40"
                  >
                    <Minus size={17} />
                  </button>

                  <div className="flex h-12 w-16 items-center justify-center border-x border-[#e6eaf2] text-sm font800 text-[#0b1533]">
                    <AnimatedQuantity value={quantity} />
                  </div>

                  <button
                    type="button"
                    onClick={incrementQuantity}
                    disabled={Boolean(lock) || isBusy}
                    className="flex h-12 w-14 items-center justify-center text-[#66708a] hover:bg-slate-50 disabled:opacity-40"
                  >
                    <Plus size={17} />
                  </button>
                </div>
              </div>
            </Card>

            <Card className="p-7">
              <h2 className="text-2xl font800 tracking-[-0.03em] text-[#0b1533]">
                Lock Status
              </h2>

              {!lock ? (
                <div className="mt-5 rounded-3xl border border-orange-100 bg-orange-50 p-5">
                  <div className="flex gap-4">
                    <Lock className="text-orange-500" />
                    <div>
                      <p className="font800 text-[#0b1533]">
                        Tickets are not locked yet
                      </p>
                      <p className="mt-1 text-sm font600 leading-6 text-[#66708a]">
                        Click Reserve Tickets to call your booking-service lock
                        API and reduce inventory in event-service.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-3xl border border-teal-100 bg-teal-50 p-5">
                  <div className="flex gap-4">
                    <CheckCircle2 className="text-[#0ea5a4]" />
                    <div>
                      <p className="font800 text-[#0b1533]">
                        Lock created successfully
                      </p>
                      <p className="mt-1 text-sm font600 leading-6 text-[#66708a]">
                        Lock ID:{" "}
                        <span className="font800 text-[#0b1533]">
                          {lock.lockId}
                        </span>
                      </p>
                      <p className="mt-1 text-sm font600 leading-6 text-[#66708a]">
                        Expires at: {formatDateTime(lock.expiresAt)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error ? (
                <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font700 text-red-600">
                  {error}
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap gap-3">
                {!lock ? (
                  <Button
                    onClick={handleCreateLock}
                    disabled={creatingLock || releasingLock}
                  >
                    {creatingLock ? "Reserving..." : "Reserve Tickets"}
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleContinueToBooking}
                      disabled={continuing || releasingLock}
                    >
                      {continuing ? "Opening..." : "Continue to Booking Details"}
                    </Button>

                    <Button
                      variant="secondary"
                      onClick={handleReleaseLock}
                      disabled={releasingLock || continuing}
                    >
                      {releasingLock ? "Releasing..." : "Release Lock"}
                    </Button>
                  </>
                )}
              </div>
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
                  {event.name || event.title}
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
                <SummaryRow label="Ticket" value={ticketTier.name} />
                <SummaryRow
                  label="Price"
                  value={formatCurrency(ticketTier.price)}
                />
                <SummaryRow label="Quantity" value={quantity} />
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
                  <ShieldCheck className="text-[#0ea5a4]" />
                  <p className="text-sm font700 leading-6 text-[#0b1533]">
                    Lock + inventory sync is handled by your backend through
                    Redis and event-service inventory reservation.
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
            : "text-sm font800 text-[#0b1533]"
        }
      >
        {value}
      </span>
    </div>
  );
}