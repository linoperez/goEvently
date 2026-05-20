import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Heart,
  MapPin,
  Minus,
  Plus,
  PencilLine,
  ShieldCheck,
  Ticket,
  Users,
  Zap,
} from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import LoadingState from "../components/ui/LoadingState";
import ErrorState from "../components/ui/ErrorState";
import EmptyState from "../components/ui/EmptyState";
import { getEventById, getTicketTiersByEvent } from "../api/eventsApi";
import AnimatedQuantity from "../components/ui/AnimatedQuantity";
import OrganizerInfoCard from "../components/OrganizerInfoCard";
import { useAuth } from "../context/AuthContext";

function unwrapData(response) {
  return response?.data ?? response;
}

// function formatDateTime(value) {
//   if (!value) return "Date TBA";

//   try {
//     const date = new Date(value);
//     return date.toLocaleString("en-IN", {
//       day: "2-digit",
//       month: "short",
//       year: "numeric",
//       hour: "numeric",
//       minute: "2-digit",
//     });
//   } catch {
//     return String(value);
//   }
// }

function formatEventDate(value) {
  if (!value) return "Date TBA";

  try {
    const date = new Date(value);

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      weekday: "short",
    });
  } catch {
    return String(value);
  }
}

function formatEventStartTime(value) {
  if (!value) return "Time TBA";

  try {
    const date = new Date(value);

    const time = date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    return `${time} onwards`;
  } catch {
    return String(value);
  }
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return "₹0";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function getAvailabilityLabel(remainingQuantity) {
  const remaining = Number(remainingQuantity || 0);

  if (remaining <= 0) return "Sold out";
  if (remaining <= 5) return `Only ${remaining} left`;
  return `${remaining} seats available`;
}

function getAvailabilityClass(remainingQuantity) {
  const remaining = Number(remainingQuantity || 0);

  if (remaining <= 0) return "text-red-500";
  if (remaining <= 5) return "text-orange-500";
  return "text-[#0ea5a4]";
}

function getCurrentUsername(user) {
  return user?.username || user?.name || user?.email || "";
}

function canEditEvent(event, user) {
  const currentUsername = getCurrentUsername(user);

  return (
    event?.organizerUsername &&
    currentUsername &&
    String(event.organizerUsername).toLowerCase() ===
      String(currentUsername).toLowerCase()
  );
}


export default function EventDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [event, setEvent] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [selectedTierId, setSelectedTierId] = useState(null);
  const [quantity, setQuantity] = useState(1);


  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEventDetails() {
      try {
        setLoading(true);
        setError("");

        const [eventResponse, tierResponse] = await Promise.all([
          getEventById(id),
          getTicketTiersByEvent(id),
        ]);

        const eventData = unwrapData(eventResponse);
        const tierData = unwrapData(tierResponse);

        const tierList = Array.isArray(tierData) ? tierData : [];

        setEvent(eventData);
        setTiers(tierList);

        const firstAvailableTier = tierList.find(
          (tier) => Number(tier.remainingQuantity || 0) > 0
        );

        if (firstAvailableTier) {
          setSelectedTierId(firstAvailableTier.id);
        } else if (tierList.length > 0) {
          setSelectedTierId(tierList[0].id);
        }
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err.message ||
            "Could not load event details"
        );
      } finally {
        setLoading(false);
      }
    }

    loadEventDetails();
  }, [id]);

  const selectedTier = useMemo(() => {
    return tiers.find((tier) => tier.id === selectedTierId) || null;
  }, [tiers, selectedTierId]);

  const totalAmount = selectedTier ? Number(selectedTier.price || 0) * quantity : 0;

  const selectedRemaining = Number(selectedTier?.remainingQuantity || 0);
  const isSelectedTierSoldOut = selectedRemaining <= 0;
  const canDecreaseQuantity = quantity > 1;
  const canIncreaseQuantity = selectedTier && quantity < selectedRemaining;

  const handleSelectTier = (tier) => {
    if (Number(tier.remainingQuantity || 0) <= 0) {
      return;
    }

    setSelectedTierId(tier.id);
    setQuantity(1);
  };

  const incrementQuantity = () => {
    const remaining = Number(selectedTier?.remainingQuantity || 0);

    if (remaining <= 0) return;

    setQuantity((prev) => Math.min(prev + 1, remaining));
  };

  const decrementQuantity = () => {
    setQuantity((prev) => Math.max(prev - 1, 1));
  };

  const handleReserveContinue = () => {
    if (!selectedTier) return;

    navigate("/checkout", {
      state: {
        event,
        ticketTier: selectedTier,
        quantity,
        totalAmount,
      },
    });
  };

  if (loading) {
    return (
      <AppLayout>
        <LoadingState message="Loading event details..." />
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <ErrorState title="Could not load event" message={error} />
      </AppLayout>
    );
  }

  if (!event) {
    return (
      <AppLayout>
        <ErrorState
          title="Event not found"
          message="This event could not be loaded. It may have been deleted or the event ID is invalid."
        />

        <div className="mt-6">
          <Link to="/events">
            <Button>Back to Events</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const title = event.name || event.title || "Untitled Event";
  const category = event.categoryName || "EVENT";
  const location = event.location || event.venueName || "Venue details";
  const eventDate = formatEventDate(event.startTime);
  const eventStartTime = formatEventStartTime(event.startTime);
  const description =
    event.description ||
    "Join us for an unforgettable experience with secure booking and live ticket availability.";

  return (
    <div className="min-h-screen bg-white">
      <AppLayout>
        <section className="mb-8 overflow-hidden rounded-[2rem] bg-[#061024]">
          <div className="relative min-h-[430px] bg-gradient-to-br from-[#061024] via-[#111a3d] to-[#0ea5a4]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.24),transparent_25%),radial-gradient(circle_at_30%_70%,rgba(79,70,229,0.38),transparent_28%)]" />
            <div className="absolute inset-0 bg-black/25" />

            <button className="absolute right-8 top-8 z-10 flex h-14 w-14 items-center justify-center rounded-full border border-white/40 bg-white/10 text-white backdrop-blur">
              <Heart size={25} />
            </button>

            {event?.id && isAuthenticated && canEditEvent(event, user) ? (
              <Link
                to={`/organizer/events/${event.id}/edit`}
                className="absolute bottom-8 right-8 z-10"
              >
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font800 text-white shadow-lg backdrop-blur-md transition hover:bg-white/25"
                >
                  <PencilLine size={16} />
                  Edit Event
                </button>
              </Link>
            ) : null}

            <div className="relative z-10 max-w-3xl px-8 py-16 text-white md:px-14">
              <Badge color="indigo">{String(category).toUpperCase()}</Badge>

              <h1 className="mt-6 text-5xl font800 leading-tight tracking-[-0.05em] md:text-6xl">
                {title}
              </h1>

              <div className="mt-8 grid gap-4 text-sm font700 text-white/90 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <CalendarDays size={21} />
                  <span>{eventDate}</span>
                </div>

                <div className="flex items-center gap-3">
                  <Clock size={21} />
                  <span>{eventStartTime}</span>
                </div>

                <div className="flex items-start gap-3 sm:col-span-2">
                  <MapPin size={21} className="mt-0.5" />
                  <span>{location}</span>
                </div>
              </div>

              <p className="mt-8 max-w-xl text-base font500 leading-8 text-white/85">
                {description}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1fr_420px]">
          <div className="space-y-7">
            <Card className="p-7">
              <h2 className="text-2xl font800 tracking-[-0.03em] text-[#0b1533]">
                About the event
              </h2>
              <p className="mt-4 text-base font500 leading-8 text-[#66708a]">
                {description}
              </p>

              <div className="mt-8 grid gap-5 sm:grid-cols-3">
                <InfoPill
                  icon={<Zap />}
                  title="Instant"
                  text="Booking updates"
                />
                <InfoPill
                  icon={<ShieldCheck />}
                  title="Secure"
                  text="JWT protected"
                />
                <InfoPill
                  icon={<Users />}
                  title="Capacity"
                  text={`${event.maxAttendees || "Limited"} attendees`}
                />
              </div>
            </Card>

            <OrganizerInfoCard
              organizerUsername={event?.organizerUsername}
              currentUsername={getCurrentUsername(user)}
            />

            <Card className="p-7">
              <h2 className="text-2xl font800 tracking-[-0.03em] text-[#0b1533]">
                Highlights
              </h2>

              <div className="mt-5 space-y-4">
                <Highlight text="Live ticket tier availability from backend" />
                <Highlight text="Redis-based temporary reservation before booking" />
                <Highlight text="Payment-driven booking confirmation flow" />
                <Highlight text="Notifications after payment and booking updates" />
              </div>
            </Card>

            <Card className="p-7">
              <h2 className="text-2xl font800 tracking-[-0.03em] text-[#0b1533]">
                Venue
              </h2>

              <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-3 text-[#0b1533]">
                    <MapPin className="text-[#0ea5a4]" />
                    <p className="font800">{location}</p>
                  </div>
                  <p className="mt-2 text-sm font600 text-[#66708a]">
                    {event.venueName || "Venue details available on event day"}
                  </p>
                </div>

                <div className="h-32 rounded-3xl border border-[#e6eaf2] bg-gradient-to-br from-slate-100 to-teal-50 md:w-72" />
              </div>
            </Card>
          </div>

          <aside>
            <Card className="sticky top-28 p-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-2xl font800 tracking-[-0.03em] text-[#0b1533]">
                  Book Tickets
                </h2>

                <div className="flex items-center gap-2 text-xs font800 text-[#66708a]">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Live availability
                </div>
              </div>

              {tiers.length === 0 ? (
                <EmptyState
                  title="No ticket tiers"
                  message="This event does not have any ticket tiers yet."
                />
              ) : (
                <div className="space-y-4">
                  {tiers.map((tier) => {
                    const active = tier.id === selectedTierId;
                    const remaining = Number(tier.remainingQuantity || 0);
                    const soldOut = remaining <= 0;
                    const sold = Number(tier.totalQuantity || 0) - Number(remaining || 0);

                    return (
                      <button
                        key={tier.id}
                        type="button"
                        disabled={soldOut}
                        onClick={() => handleSelectTier(tier)}
                        className={`w-full rounded-3xl border p-5 text-left transition ${
                          soldOut
                            ? "cursor-not-allowed border-[#e6eaf2] bg-slate-50 opacity-70"
                            : active
                            ? "border-[#0ea5a4] bg-teal-50/40 shadow-[0_18px_45px_rgba(14,165,164,0.12)]"
                            : "border-[#e6eaf2] bg-white hover:border-[#0ea5a4]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex gap-3">
                            <span
                              className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                soldOut
                                  ? "border-[#cfd7e6] bg-slate-100"
                                  : active
                                  ? "border-[#0ea5a4] bg-[#0ea5a4]"
                                  : "border-[#cfd7e6] bg-white"
                              }`}
                            >
                              {active && !soldOut ? (
                                <span className="h-2 w-2 shrink-0 rounded-full bg-white" />
                              ) : null}
                            </span>

                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-lg font800 text-[#0b1533]">
                                  {tier.name}
                                </h3>

                                {soldOut ? (
                                  <span className="rounded-full bg-red-50 px-3 py-1 text-xs font800 text-red-500">
                                    SOLD OUT
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-1 text-sm font600 text-[#66708a]">
                                {tier.description || "Standard event access"}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-xl font800 text-[#0ea5a4]">
                              {formatCurrency(tier.price)}
                            </p>
                            <p
                              className={`mt-1 text-xs font800 ${getAvailabilityClass(
                                remaining
                              )}`}
                            >
                              {getAvailabilityLabel(remaining)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5">
                          <div className="mb-2 flex items-center justify-between text-xs font700 text-[#66708a]">
                            <span>Sold {sold}</span>
                            <span>Total {tier.totalQuantity ?? "N/A"}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full gev-gradient"
                              style={{
                                width: `${
                                  tier.totalQuantity
                                    ? Math.min(
                                        100,
                                        (sold / tier.totalQuantity) * 100
                                      )
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  <div className="rounded-3xl border border-[#e6eaf2] bg-white p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font800 text-[#0b1533]">
                          Quantity
                        </p>
                        <p className="mt-1 text-xs font600 text-[#66708a]">
                          {selectedTier
                            ? isSelectedTierSoldOut
                              ? "This ticket tier is sold out"
                              : `You can reserve up to ${selectedRemaining} tickets`
                            : "Select a ticket tier first"}
                        </p>
                      </div>

                      <div className="flex overflow-hidden rounded-2xl border border-[#e6eaf2]">
                        <button
                          type="button"
                          onClick={decrementQuantity}
                          disabled={!canDecreaseQuantity || isSelectedTierSoldOut}
                          className="flex h-11 w-12 items-center justify-center text-[#66708a] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Minus size={17} />
                        </button>

                        <div className="flex h-11 w-14 items-center justify-center border-x border-[#e6eaf2] text-sm font800 text-[#0b1533]">
                          <AnimatedQuantity value={quantity} />
                        </div>

                        <button
                          type="button"
                          onClick={incrementQuantity}
                          disabled={!canIncreaseQuantity || isSelectedTierSoldOut}
                          className="flex h-11 w-12 items-center justify-center text-[#66708a] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Plus size={17} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-[#e6eaf2] pt-5">
                      <span className="text-sm font700 text-[#66708a]">
                        Estimated total
                      </span>
                      <span className="text-2xl font800 text-[#0ea5a4]">
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    disabled={!selectedTier || isSelectedTierSoldOut}
                    onClick={handleReserveContinue}
                  >
                    {isSelectedTierSoldOut ? "Sold Out" : "Reserve & Continue"}
                  </Button>

                  <div className="rounded-3xl bg-slate-50 p-5">
                    <div className="flex gap-3">
                      <Ticket className="text-indigo-600" />
                      <div>
                        <p className="text-sm font800 text-[#0b1533]">
                          Seats are temporarily locked
                        </p>
                        <p className="mt-1 text-xs font600 leading-5 text-[#66708a]">
                          In the next step, your selected tickets will be locked
                          before booking creation.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </aside>
        </section>
      </AppLayout>
    </div>
  );
}

function InfoPill({ icon, title, text }) {
  return (
    <div className="flex items-center gap-3 rounded-3xl border border-[#e6eaf2] bg-white p-4">
      <div className="rounded-2xl bg-teal-50 p-3 text-[#0ea5a4]">{icon}</div>
      <div>
        <p className="text-sm font800 text-[#0b1533]">{title}</p>
        <p className="text-xs font600 text-[#66708a]">{text}</p>
      </div>
    </div>
  );
}

function Highlight({ text }) {
  return (
    <div className="flex items-center gap-3">
      <CheckCircle2 size={19} className="text-[#0ea5a4]" />
      <p className="text-sm font600 text-[#66708a]">{text}</p>
    </div>
  );
}