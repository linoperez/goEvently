import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  IndianRupee,
  RefreshCw,
  Ticket,
  User,
  Users,
} from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import PageHeader from "../components/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import StatCard from "../components/ui/StatCard";
import LoadingState from "../components/ui/LoadingState";
import ErrorState from "../components/ui/ErrorState";
import EmptyState from "../components/ui/EmptyState";
import { getEventBookings } from "../api/bookingApi";
import { getEventById, getTicketTiersByEvent } from "../api/eventsApi";

function unwrapData(response) {
  return response?.data ?? response;
}

function unwrapPage(response) {
  const data = response?.data ?? response;

  if (Array.isArray(data)) {
    return {
      content: data,
      totalElements: data.length,
      totalPages: 1,
      number: 0,
      size: data.length,
    };
  }

  if (Array.isArray(data?.content)) return data;

  if (Array.isArray(data?.data)) {
    return {
      content: data.data,
      totalElements: data.data.length,
      totalPages: 1,
      number: 0,
      size: data.data.length,
    };
  }

  if (Array.isArray(data?.data?.content)) return data.data;

  return {
    content: [],
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size: 10,
  };
}

function unwrapList(response) {
  const data = response?.data ?? response;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data?.content)) return data.data.content;

  return [];
}

function getApiErrorMessage(err, fallback = "Something went wrong") {
  const data = err?.response?.data;

  if (!data) return err?.message || fallback;
  if (typeof data === "string") return data;
  if (data.message) return data.message;
  if (data.error) return data.error;

  return fallback;
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
  if (!value) return "N/A";

  try {
    return new Date(value).toLocaleString("en-IN", {
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

function getStatusColor(status) {
  const normalized = String(status || "").toUpperCase();

  if (normalized === "CONFIRMED" || normalized === "SUCCESS") return "green";
  if (normalized === "PENDING" || normalized === "PENDING_PAYMENT") return "orange";
  if (normalized === "FAILED" || normalized === "CANCELLED" || normalized === "EXPIRED") return "red";

  return "gray";
}

function getBookingAmount(booking) {
  return (
    booking?.totalAmount ??
    booking?.amount ??
    booking?.paymentAmount ??
    booking?.finalAmount ??
    0
  );
}

function getBookingQuantity(booking) {
  return booking?.quantity ?? booking?.ticketQuantity ?? booking?.numberOfTickets ?? 0;
}

function getBookingStatus(booking) {
  return booking?.status || booking?.bookingStatus || "UNKNOWN";
}

function getBookingCreatedAt(booking) {
  return booking?.createdAt || booking?.bookingTime || booking?.createdDate || booking?.updatedAt;
}

export default function EventBookingsPage() {
  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [tiers, setTiers] = useState([]);

  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadPage({ silent = false } = {}) {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [eventResponse, tiersResponse, bookingsResponse] = await Promise.all([
        getEventById(id),
        getTicketTiersByEvent(id),
        getEventBookings(id, {
          page,
          size,
        }),
      ]);

      const bookingPage = unwrapPage(bookingsResponse);

      setEvent(unwrapData(eventResponse));
      setTiers(unwrapList(tiersResponse));
      setBookings(bookingPage.content || []);
      setTotalPages(bookingPage.totalPages || 0);
      setTotalElements(bookingPage.totalElements || 0);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load event bookings"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadPage();
  }, [id, page, size]);

  const tierMap = useMemo(() => {
    const map = {};

    tiers.forEach((tier) => {
      map[tier.id] = tier;
    });

    return map;
  }, [tiers]);

  const stats = useMemo(() => {
    const totalBookings = totalElements || bookings.length;

    const totalTickets = bookings.reduce((sum, booking) => {
      return sum + Number(getBookingQuantity(booking) || 0);
    }, 0);

    const totalRevenue = bookings.reduce((sum, booking) => {
      return sum + Number(getBookingAmount(booking) || 0);
    }, 0);

    const confirmed = bookings.filter((booking) => {
      return String(getBookingStatus(booking)).toUpperCase() === "CONFIRMED";
    }).length;

    return {
      totalBookings,
      totalTickets,
      totalRevenue,
      confirmed,
    };
  }, [bookings, totalElements]);

  const eventName = event?.name || event?.title || `Event #${id}`;

  if (loading) {
    return (
      <AppLayout>
        <LoadingState message="Loading event bookings..." />
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <ErrorState title="Could not load event bookings" message={error} />

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/organizer">
            <Button>
              <ArrowLeft size={18} />
              Organizer
            </Button>
          </Link>

          <Button variant="secondary" onClick={() => loadPage()}>
            Retry
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Event Bookings"
        subtitle={`Review bookings and attendees for ${eventName}.`}
        action={
          <div className="flex flex-wrap gap-3">
            <Link to="/organizer">
              <Button variant="secondary">
                <ArrowLeft size={18} />
                Organizer
              </Button>
            </Link>

            <Link to={`/events/${id}`}>
              <Button variant="secondary">View Event</Button>
            </Link>

            <Button
              variant="secondary"
              onClick={() => loadPage({ silent: true })}
              disabled={refreshing}
            >
              <RefreshCw size={17} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        }
      />

      <div className="mb-8 grid gap-6 md:grid-cols-4">
        <StatCard
          icon={<Ticket size={26} />}
          label="Bookings"
          value={stats.totalBookings}
          helper="Total booking records"
          tone="indigo"
        />

        <StatCard
          icon={<Users size={26} />}
          label="Tickets"
          value={stats.totalTickets}
          helper="From current page"
          tone="green"
        />

        <StatCard
          icon={<IndianRupee size={26} />}
          label="Revenue"
          value={formatCurrency(stats.totalRevenue)}
          helper="From current page"
          tone="orange"
        />

        <StatCard
          icon={<CalendarDays size={26} />}
          label="Confirmed"
          value={stats.confirmed}
          helper="Confirmed bookings"
          tone="green"
        />
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-[#e6eaf2] px-6 py-5">
          <h2 className="text-xl font800 text-[#0b1533]">
            Attendee / Booking List
          </h2>
          <p className="mt-1 text-sm font600 text-[#66708a]">
            Showing bookings returned by booking-service for this event.
          </p>
        </div>

        {bookings.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No bookings found"
              message="No users have booked tickets for this event yet."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse">
              <thead>
                <tr className="border-b border-[#e6eaf2] bg-slate-50 text-left">
                  <th className="px-5 py-4 text-xs font800 uppercase tracking-wide text-[#66708a]">
                    Booking
                  </th>
                  <th className="px-5 py-4 text-xs font800 uppercase tracking-wide text-[#66708a]">
                    User
                  </th>
                  <th className="px-5 py-4 text-xs font800 uppercase tracking-wide text-[#66708a]">
                    Ticket Tier
                  </th>
                  <th className="px-5 py-4 text-xs font800 uppercase tracking-wide text-[#66708a]">
                    Quantity
                  </th>
                  <th className="px-5 py-4 text-xs font800 uppercase tracking-wide text-[#66708a]">
                    Amount
                  </th>
                  <th className="px-5 py-4 text-xs font800 uppercase tracking-wide text-[#66708a]">
                    Status
                  </th>
                  <th className="px-5 py-4 text-xs font800 uppercase tracking-wide text-[#66708a]">
                    Created
                  </th>
                  <th className="px-5 py-4 text-xs font800 uppercase tracking-wide text-[#66708a]">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {bookings.map((booking) => {
                  const tierId = booking.ticketTierId || booking.tierId;
                  const tier = tierMap[tierId];
                  const status = getBookingStatus(booking);

                  return (
                    <tr
                      key={booking.id}
                      className="border-b border-[#e6eaf2] last:border-b-0"
                    >
                      <td className="px-5 py-5">
                        <p className="font800 text-[#0b1533]">
                          Booking #{booking.id}
                        </p>
                        <p className="mt-1 text-xs font600 text-[#66708a]">
                          Event ID: {booking.eventId || id}
                        </p>
                      </td>

                      <td className="px-5 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 text-[#0ea5a4]">
                            <User size={18} />
                          </div>

                          <div>
                            <p className="font800 text-[#0b1533]">
                              {booking.username || booking.userName || `User #${booking.userId || "N/A"}`}
                            </p>
                            <p className="mt-1 text-xs font600 text-[#66708a]">
                              User ID: {booking.userId || "N/A"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-5">
                        <p className="font800 text-[#0b1533]">
                          {booking.ticketTierName ||
                            booking.tierName ||
                            tier?.name ||
                            `Tier #${tierId || "N/A"}`}
                        </p>
                        <p className="mt-1 text-xs font600 text-[#66708a]">
                          Tier ID: {tierId || "N/A"}
                        </p>
                      </td>

                      <td className="px-5 py-5">
                        <p className="font800 text-[#0b1533]">
                          {getBookingQuantity(booking)}
                        </p>
                      </td>

                      <td className="px-5 py-5">
                        <p className="font800 text-[#0ea5a4]">
                          {formatCurrency(getBookingAmount(booking))}
                        </p>
                      </td>

                      <td className="px-5 py-5">
                        <Badge color={getStatusColor(status)}>
                          {String(status).replaceAll("_", " ")}
                        </Badge>
                      </td>

                      <td className="px-5 py-5">
                        <p className="text-sm font700 text-[#0b1533]">
                          {formatDateTime(getBookingCreatedAt(booking))}
                        </p>
                      </td>

                      <td className="px-5 py-5">
                        <Link to={`/bookings/${booking.id}`}>
                          <Button size="sm" variant="secondary">
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {totalPages > 1 ? (
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            disabled={page <= 0}
            onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
          >
            Previous
          </Button>

          <div className="rounded-2xl border border-[#e6eaf2] bg-white px-5 py-3 text-sm font800 text-[#0b1533]">
            Page {page + 1} of {totalPages}
          </div>

          <Button
            variant="secondary"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
          >
            Next
          </Button>
        </div>
      ) : null}
    </AppLayout>
  );
}