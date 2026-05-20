import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Building2,
  CalendarDays,
  IndianRupee,
  Layers3,
  Plus,
  RefreshCw,
  Ticket,
  Users,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import PageHeader from "../components/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import StatCard from "../components/ui/StatCard";
import LoadingState from "../components/ui/LoadingState";
import ErrorState from "../components/ui/ErrorState";
import EmptyState from "../components/ui/EmptyState";
import { getEvents, getTicketTiersForEvents } from "../api/eventsApi";
import { useAuth } from "../context/AuthContext";

function unwrapList(response) {
  const data = response?.data ?? response;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data?.content)) return data.data.content;

  return [];
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return "₹0";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function formatDate(value) {
  if (!value) return "Date TBA";

  try {
    const date = new Date(value);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(value);
  }
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

export default function OrganizerDashboardPage() {
  const [events, setEvents] = useState([]);
  const [tierMap, setTierMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();

  async function loadDashboard({ silent = false } = {}) {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const eventsResponse = await getEvents();
      const eventList = unwrapList(eventsResponse);

      const sortedEvents = [...eventList].sort((a, b) => {
        return Number(b.id || 0) - Number(a.id || 0);
      });

      setEvents(sortedEvents);

      const tierResults = await getTicketTiersForEvents(
        sortedEvents.slice(0, 8)
      );

      const nextTierMap = {};
      tierResults.forEach((item) => {
        nextTierMap[item.eventId] = item.tiers || [];
      });

      setTierMap(nextTierMap);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Could not load organizer dashboard"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = useMemo(() => {
    const allTiers = Object.values(tierMap).flat();

    const totalTiers = allTiers.length;

    const totalInventory = allTiers.reduce((sum, tier) => {
      return sum + Number(tier.totalQuantity || 0);
    }, 0);

    const remainingInventory = allTiers.reduce((sum, tier) => {
      return sum + Number(tier.remainingQuantity || 0);
    }, 0);

    const soldInventory = Math.max(0, totalInventory - remainingInventory);

    const estimatedRevenue = allTiers.reduce((sum, tier) => {
      const sold =
        Number(tier.totalQuantity || 0) - Number(tier.remainingQuantity || 0);
      return sum + sold * Number(tier.price || 0);
    }, 0);

    return {
      activeEvents: events.length,
      totalTiers,
      remainingInventory,
      soldInventory,
      estimatedRevenue,
    };
  }, [events, tierMap]);

  const inventoryRows = useMemo(() => {
    return events.slice(0, 5).map((event) => {
      const tiers = tierMap[event.id] || [];

      const total = tiers.reduce((sum, tier) => {
        return sum + Number(tier.totalQuantity || 0);
      }, 0);

      const remaining = tiers.reduce((sum, tier) => {
        return sum + Number(tier.remainingQuantity || 0);
      }, 0);

      const sold = Math.max(0, total - remaining);

      return {
        event,
        tiers,
        total,
        remaining,
        sold,
      };
    });
  }, [events, tierMap]);

  if (loading) {
    return (
      <AppLayout>
        <LoadingState message="Loading organizer dashboard..." />
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <ErrorState title="Could not load dashboard" message={error} />

        <div className="mt-6">
          <Button onClick={() => loadDashboard()}>Retry</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Organizer Dashboard"
        subtitle="Manage events, ticket inventory, and booking performance from one clean dashboard."
        action={
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              className="gap-2"
              onClick={() => loadDashboard({ silent: true })}
              disabled={refreshing}
            >
              <RefreshCw size={18} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>

            <Link to="/venues">
              <Button variant="secondary" className="gap-2">
                <Building2 size={18} />
                Manage Venues
              </Button>
            </Link>

            <Link to="/organizer/events/create">
              <Button className="gap-2">
                <Plus size={18} />
                Create Event
              </Button>
            </Link>
          </div>
        }
      />

      <div className="mb-8 grid gap-6 md:grid-cols-4">
        <StatCard
          icon={<CalendarDays size={26} />}
          label="Active Events"
          value={stats.activeEvents}
          helper="Available in event-service"
          tone="teal"
        />

        <StatCard
          icon={<Ticket size={26} />}
          label="Tickets Sold"
          value={stats.soldInventory}
          helper="Based on tier inventory"
          tone="indigo"
        />

        <StatCard
          icon={<Layers3 size={26} />}
          label="Remaining Inventory"
          value={stats.remainingInventory}
          helper={`${stats.totalTiers} ticket tiers`}
          tone="green"
        />

        <StatCard
          icon={<Wallet size={26} />}
          label="Estimated Revenue"
          value={formatCurrency(stats.estimatedRevenue)}
          helper="Calculated from sold tickets"
          tone="orange"
        />
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="space-y-8">
          <Card className="overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-[#e6eaf2] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font800 text-[#0b1533]">
                  Managed Events
                </h2>
                <p className="mt-1 text-sm font600 text-[#66708a]">
                  Events fetched from your backend event-service.
                </p>
              </div>

              <Link to="/events" className="text-sm font800 text-[#0b1533]">
                View all →
              </Link>
            </div>

            {events.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="No events found"
                  message="Create events in the backend to see them here."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse">
                  <thead>
                    <tr className="border-b border-[#e6eaf2] bg-slate-50 text-left">
                      <th className="px-5 py-4 text-xs font800 uppercase tracking-wide text-[#66708a]">
                        Event
                      </th>
                      <th className="px-5 py-4 text-xs font800 uppercase tracking-wide text-[#66708a]">
                        Date
                      </th>
                      <th className="px-5 py-4 text-xs font800 uppercase tracking-wide text-[#66708a]">
                        Category
                      </th>
                      <th className="px-5 py-4 text-xs font800 uppercase tracking-wide text-[#66708a]">
                        Organizer
                      </th>
                      <th className="px-5 py-4 text-xs font800 uppercase tracking-wide text-[#66708a]">
                        Ticket Tiers
                      </th>
                      <th className="px-5 py-4 text-xs font800 uppercase tracking-wide text-[#66708a]">
                        Inventory
                      </th>
                      <th className="px-5 py-4 text-xs font800 uppercase tracking-wide text-[#66708a]">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {events.slice(0, 8).map((event, index) => {
                      const tiers = tierMap[event.id] || [];
                      const total = tiers.reduce(
                        (sum, tier) => sum + Number(tier.totalQuantity || 0),
                        0
                      );
                      const remaining = tiers.reduce(
                        (sum, tier) =>
                          sum + Number(tier.remainingQuantity || 0),
                        0
                      );

                      return (
                        <tr
                          key={event.id}
                          className="border-b border-[#e6eaf2] last:border-b-0"
                        >
                          <td className="px-5 py-5">
                            <div className="flex items-center gap-4">
                              <div
                                className={`h-14 w-14 shrink-0 overflow-hidden rounded-2xl ${
                                  index % 3 === 0
                                    ? "bg-gradient-to-br from-purple-700 via-fuchsia-500 to-cyan-400"
                                    : index % 3 === 1
                                    ? "bg-gradient-to-br from-slate-800 via-indigo-500 to-teal-300"
                                    : "bg-gradient-to-br from-orange-100 via-stone-300 to-amber-700"
                                }`}
                              />
                              <div>
                                <p className="font800 text-[#0b1533]">
                                  {event.name || event.title || "Untitled Event"}
                                </p>
                                <p className="mt-1 text-xs font600 text-[#66708a]">
                                  Event ID: {event.id}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-5">
                            <p className="text-sm font700 text-[#0b1533]">
                              {formatDate(event.startTime)}
                            </p>
                          </td>

                          <td className="px-5 py-5">
                            <Badge color="teal">
                              {event.categoryName || "EVENT"}
                            </Badge>
                          </td>

                          <td className="px-5 py-5">
                            <div>
                              <p className="text-sm font800 text-[#0b1533]">
                                {event.organizerUsername || "N/A"}
                              </p>

                              {canEditEvent(event, user) ? (
                                <p className="mt-1 text-xs font800 text-[#0ea5a4]">
                                  You can edit
                                </p>
                              ) : (
                                <p className="mt-1 text-xs font600 text-[#66708a]">
                                  View only
                                </p>
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-5">
                            <p className="font800 text-[#0b1533]">
                              {tiers.length}
                            </p>
                          </td>

                          <td className="px-5 py-5">
                            <p className="font800 text-[#0ea5a4]">
                              {remaining}
                            </p>
                            <p className="mt-1 text-xs font600 text-[#66708a]">
                              of {total} remaining
                            </p>
                          </td>

                          <td className="px-5 py-5">
                            <div className="flex w-28 flex-col gap-2">
                              <Link to={`/events/${event.id}`}>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="w-full"
                                >
                                  View
                                </Button>
                              </Link>

                              {canEditEvent(event, user) ? (
                                <Link
                                  to={`/organizer/events/${event.id}/edit`}
                                >
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="w-full"
                                  >
                                    Edit
                                  </Button>
                                </Link>
                              ) : null}

                              {canEditEvent(event, user) ? (
                                <Link
                                  to={`/organizer/events/${event.id}/tickets`}
                                >
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="w-full"
                                  >
                                    Tickets
                                  </Button>
                                </Link>
                              ) : null}

                              {String(user?.role || "").toUpperCase() === "ADMIN" ? (
                                <Link to={`/organizer/events/${event.id}/bookings`}>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="w-full"
                                  >
                                    Bookings
                                  </Button>
                                </Link>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font800 text-[#0b1533]">
                  Ticket Inventory Overview
                </h2>
                <p className="mt-1 text-sm font600 text-[#66708a]">
                  Remaining seats across recent events.
                </p>
              </div>

              <BarChart3 className="text-[#0ea5a4]" />
            </div>

            <div className="space-y-5">
              {inventoryRows.length === 0 ? (
                <EmptyState
                  title="No inventory found"
                  message="Ticket tiers will appear here once available."
                />
              ) : (
                inventoryRows.map((row) => {
                  const percent =
                    row.total > 0
                      ? Math.min(100, (row.sold / row.total) * 100)
                      : 0;

                  return (
                    <div
                      key={row.event.id}
                      className="rounded-3xl border border-[#e6eaf2] bg-white p-5"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font800 text-[#0b1533]">
                            {row.event.name ||
                              row.event.title ||
                              "Untitled Event"}
                          </p>
                          <p className="mt-1 text-xs font600 text-[#66708a]">
                            Sold {row.sold} / {row.total}
                          </p>
                        </div>

                        <p className="text-xl font800 text-[#0ea5a4]">
                          {row.remaining}
                        </p>
                      </div>

                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full gev-gradient"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </section>

        <aside className="space-y-8">
          <Card className="p-6">
            <h2 className="text-xl font800 text-[#0b1533]">
              Recent Payments & Refunds
            </h2>
            <p className="mt-1 text-sm font600 text-[#66708a]">
              Demo summary based on payment flow.
            </p>

            <div className="mt-6 space-y-5">
              <ActivityItem
                title="Payment received"
                subtitle="Booking confirmed through Kafka"
                amount="Success"
                color="green"
              />
              <ActivityItem
                title="Payment failed"
                subtitle="Inventory restored automatically"
                amount="Failed"
                color="red"
              />
              <ActivityItem
                title="Booking expired"
                subtitle="TTL cleanup released inventory"
                amount="Expired"
                color="orange"
              />
            </div>
          </Card>

          <Card className="p-6">
            <div className="rounded-3xl bg-gradient-to-br from-teal-50 to-indigo-50 p-6">
              <div className="w-fit rounded-2xl bg-white p-4 text-[#0ea5a4]">
                <IndianRupee size={28} />
              </div>

              <h3 className="mt-5 text-xl font800 text-[#0b1533]">
                Backend-heavy organizer flow
              </h3>
              <p className="mt-3 text-sm font600 leading-7 text-[#66708a]">
                This dashboard highlights event-service inventory, booking
                lifecycle, payment orchestration, and Kafka-driven status
                updates.
              </p>
            </div>
          </Card>
        </aside>
      </div>
    </AppLayout>
  );
}

function ActivityItem({ title, subtitle, amount, color }) {
  const colors = {
    green: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex gap-3">
        <div
          className={`mt-1 flex h-9 w-9 items-center justify-center rounded-full ${colors[color]}`}
        >
          <div className="h-2 w-2 rounded-full bg-current" />
        </div>
        <div>
          <p className="font800 text-[#0b1533]">{title}</p>
          <p className="mt-1 text-xs font600 leading-5 text-[#66708a]">
            {subtitle}
          </p>
        </div>
      </div>

      <span
        className={`rounded-full px-3 py-1 text-sm font800 ${colors[color]}`}
      >
        {amount}
      </span>
    </div>
  );
}