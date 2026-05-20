import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CircleDollarSign,
  Layers3,
  PencilLine,
  Plus,
  RefreshCw,
  Trash2,
  Ticket,
  Users,
  X,
} from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import FormInput from "../components/ui/FormInput";
import StatCard from "../components/ui/StatCard";
import LoadingState from "../components/ui/LoadingState";
import ErrorState from "../components/ui/ErrorState";
import EmptyState from "../components/ui/EmptyState";
import {
  createTicketTier,
  deleteTicketTier,
  getEventById,
  getTicketTiersByEvent,
  updateTicketTier,
} from "../api/eventsApi";

function unwrapData(response) {
  return response?.data ?? response;
}

function unwrapList(response) {
  const data = response?.data ?? response;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
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

function getApiErrorMessage(err, fallback = "Something went wrong") {
  const data = err?.response?.data;

  if (!data) return err?.message || fallback;
  if (typeof data === "string") return data;
  if (data.message) return data.message;
  if (data.error) return data.error;

  if (data.data && typeof data.data === "object") {
    return Object.values(data.data).join(", ");
  }

  return fallback;
}

function getTierSoldCount(tier) {
  const total = Number(tier.totalQuantity || 0);
  const remaining = Number(tier.remainingQuantity || 0);
  return Math.max(0, total - remaining);
}

function getTierRemaining(tier) {
  return Number(tier.remainingQuantity ?? tier.totalQuantity ?? 0);
}

function getAvailabilityColor(remaining) {
  if (remaining <= 0) return "red";
  if (remaining <= 5) return "orange";
  return "green";
}

function getAvailabilityLabel(remaining) {
  if (remaining <= 0) return "Sold Out";
  if (remaining <= 5) return `Only ${remaining} left`;
  return `${remaining} available`;
}

function getCurrentUsername(user) {
  return user?.username || user?.name || user?.email || "";
}

function canManageEventTickets(event, user) {
  const currentUsername = getCurrentUsername(user);

  return (
    event?.organizerUsername &&
    currentUsername &&
    String(event.organizerUsername).toLowerCase() ===
      String(currentUsername).toLowerCase()
  );
}

export default function EventTicketTiersPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [tiers, setTiers] = useState([]);

  const [form, setForm] = useState({
    name: "",
    price: "",
    totalQuantity: "",
    description: "",
  });

  const [editingTierId, setEditingTierId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    price: "",
    totalQuantity: "",
    description: "",
  });

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingTierId, setUpdatingTierId] = useState(null);
  const [deletingTierId, setDeletingTierId] = useState(null);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [tierActionError, setTierActionError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadPage({ silent = false } = {}) {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [eventResponse, tiersResponse] = await Promise.all([
        getEventById(id),
        getTicketTiersByEvent(id),
      ]);

      setEvent(unwrapData(eventResponse));
      setTiers(unwrapList(tiersResponse));
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load ticket tiers"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadPage();
  }, [id]);

  const stats = useMemo(() => {
    const totalTiers = tiers.length;

    const totalCapacity = tiers.reduce(
      (sum, tier) => sum + Number(tier.totalQuantity || 0),
      0
    );

    const remaining = tiers.reduce(
      (sum, tier) => sum + getTierRemaining(tier),
      0
    );

    const sold = Math.max(0, totalCapacity - remaining);

    return {
      totalTiers,
      totalCapacity,
      remaining,
      sold,
    };
  }, [tiers]);

  const eventName = event?.name || event?.title || `Event #${id}`;
  const canManageTickets = canManageEventTickets(event, user);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleEditChange = (e) => {
    setEditForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      return "Ticket tier name is required.";
    }

    if (!form.price || Number(form.price) <= 0) {
      return "Price must be greater than zero.";
    }

    if (!form.totalQuantity || Number(form.totalQuantity) < 1) {
      return "Total quantity must be at least 1.";
    }

    return "";
  };

  const validateEditForm = () => {
    if (!editForm.name.trim()) {
      return "Ticket tier name is required.";
    }

    if (!editForm.price || Number(editForm.price) <= 0) {
      return "Price must be greater than zero.";
    }

    if (!editForm.totalQuantity || Number(editForm.totalQuantity) < 1) {
      return "Total quantity must be at least 1.";
    }

    return "";
  };

  const handleCreateTier = async (e) => {
    e.preventDefault();

    if (!canManageTickets) {
      setFormError("Only the creator of this event can create ticket tiers.");
      setSuccess("");
      return;
    }

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      setSuccess("");
      return;
    }

    try {
      setCreating(true);
      setFormError("");
      setTierActionError("");
      setSuccess("");

      const payload = {
        eventId: Number(id),
        name: form.name.trim(),
        price: Number(form.price),
        totalQuantity: Number(form.totalQuantity),
        description: form.description.trim(),
      };

      await createTicketTier(payload);

      setSuccess("Ticket tier created successfully.");

      setForm({
        name: "",
        price: "",
        totalQuantity: "",
        description: "",
      });

      await loadPage({ silent: true });
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Could not create ticket tier"));
    } finally {
      setCreating(false);
    }
  };

  const handleStartEdit = (tier) => {
    setEditingTierId(tier.id);
    setTierActionError("");
    setFormError("");
    setSuccess("");

    setEditForm({
      name: tier.name || "",
      price: tier.price ?? "",
      totalQuantity: tier.totalQuantity ?? "",
      description: tier.description || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingTierId(null);
    setTierActionError("");
    setEditForm({
      name: "",
      price: "",
      totalQuantity: "",
      description: "",
    });
  };

  const handleUpdateTier = async (tierId) => {
    if (!canManageTickets) {
      setTierActionError("Only the creator of this event can update ticket tiers.");
      return;
    }

    const validationError = validateEditForm();

    if (validationError) {
      setTierActionError(validationError);
      return;
    }

    try {
      setUpdatingTierId(tierId);
      setTierActionError("");
      setFormError("");
      setSuccess("");

      const payload = {
        name: editForm.name.trim(),
        price: Number(editForm.price),
        totalQuantity: Number(editForm.totalQuantity),
        description: editForm.description.trim(),
      };

      await updateTicketTier(tierId, payload);

      setSuccess("Ticket tier updated successfully.");
      handleCancelEdit();

      await loadPage({ silent: true });
    } catch (err) {
      setTierActionError(getApiErrorMessage(err, "Could not update ticket tier"));
    } finally {
      setUpdatingTierId(null);
    }
  };

  const handleDeleteTier = async (tier) => {
    if (!canManageTickets) {
      setTierActionError("Only the creator of this event can delete ticket tiers.");
      return;
    }

    const confirmed = window.confirm(
      `Delete "${tier.name || "this ticket tier"}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeletingTierId(tier.id);
      setTierActionError("");
      setFormError("");
      setSuccess("");

      await deleteTicketTier(tier.id);

      setSuccess("Ticket tier deleted successfully.");

      if (editingTierId === tier.id) {
        handleCancelEdit();
      }

      await loadPage({ silent: true });
    } catch (err) {
      setTierActionError(getApiErrorMessage(err, "Could not delete ticket tier"));
    } finally {
      setDeletingTierId(null);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <LoadingState message="Loading ticket tiers..." />
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <ErrorState title="Could not load ticket tiers" message={error} />

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/organizer">
            <Button>Back to Organizer</Button>
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
        title="Manage Ticket Tiers"
        subtitle={`Create and monitor ticket tiers for ${eventName}.`}
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
          </div>
        }
      />

      <div className="mb-8 grid gap-6 md:grid-cols-4">
        <StatCard
          icon={<Layers3 size={26} />}
          label="Ticket Tiers"
          value={stats.totalTiers}
          helper="Created for event"
          tone="indigo"
        />

        <StatCard
          icon={<Users size={26} />}
          label="Total Capacity"
          value={stats.totalCapacity}
          helper="Across all tiers"
          tone="green"
        />

        <StatCard
          icon={<Ticket size={26} />}
          label="Sold"
          value={stats.sold}
          helper="Based on remaining"
          tone="orange"
        />

        <StatCard
          icon={<Ticket size={26} />}
          label="Remaining"
          value={stats.remaining}
          helper="Available tickets"
          tone="green"
        />
      </div>

      <div className="grid gap-8 xl:grid-cols-[1fr_420px]">
        <section className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font800 tracking-[-0.03em] text-[#0b1533]">
                  Existing Ticket Tiers
                </h2>
                <p className="mt-2 text-sm font600 text-[#66708a]">
                  Monitor price, capacity, sold count and availability.
                </p>
              </div>

              <Button
                variant="secondary"
                onClick={() => loadPage({ silent: true })}
                disabled={refreshing}
              >
                <RefreshCw size={17} />
                {refreshing ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </Card>

          {tierActionError ? (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font700 text-red-600">
              {tierActionError}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font700 text-emerald-600">
              {success}
            </div>
          ) : null}

          {!canManageTickets ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font700 text-[#66708a]">
              You can view these ticket tiers, but only the event creator can
              create, edit, or delete them.
            </div>
          ) : null}

          {tiers.length === 0 ? (
            <EmptyState
              title="No ticket tiers yet"
              message={
                canManageTickets
                  ? "Create the first ticket tier for this event using the form on the right."
                  : "No ticket tiers have been created for this event yet."
              }
            />
          ) : (
            <div className="grid gap-5">
              {tiers.map((tier, index) => {
                const total = Number(tier.totalQuantity || 0);
                const remaining = getTierRemaining(tier);
                const sold = getTierSoldCount(tier);
                const progress = total ? Math.min(100, (sold / total) * 100) : 0;
                const isEditing = editingTierId === tier.id;

                return (
                  <Card key={tier.id || index} className="overflow-hidden">
                    <div className="grid gap-0 lg:grid-cols-[1fr_260px]">
                      <div className="p-6">
                        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="text-2xl font800 tracking-[-0.03em] text-[#0b1533]">
                                {tier.name || "Unnamed Tier"}
                              </h3>

                              <Badge color={getAvailabilityColor(remaining)}>
                                {getAvailabilityLabel(remaining)}
                              </Badge>
                            </div>

                            <p className="mt-2 max-w-2xl text-sm font600 leading-6 text-[#66708a]">
                              {tier.description ||
                                "No description added for this ticket tier."}
                            </p>
                          </div>

                          <div className="flex flex-col items-start gap-3 md:items-end">
                            <div className="rounded-3xl bg-teal-50 px-5 py-4 text-left md:text-right">
                              <p className="text-xs font800 uppercase tracking-wide text-[#66708a]">
                                Price
                              </p>
                              <p className="mt-1 text-2xl font800 text-[#0ea5a4]">
                                {formatCurrency(tier.price)}
                              </p>
                            </div>

                            {canManageTickets ? (
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  variant="secondary"
                                  onClick={() => handleStartEdit(tier)}
                                  disabled={isEditing}
                                >
                                  <PencilLine size={16} />
                                  Edit
                                </Button>

                                <Button
                                  variant="secondary"
                                  onClick={() => handleDeleteTier(tier)}
                                  disabled={deletingTierId === tier.id}
                                >
                                  <Trash2 size={16} />
                                  {deletingTierId === tier.id
                                    ? "Deleting..."
                                    : "Delete"}
                                </Button>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div className="mt-6">
                          <div className="mb-2 flex items-center justify-between text-xs font800 text-[#66708a]">
                            <span>Sold {sold}</span>
                            <span>Total {total}</span>
                          </div>

                          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full gev-gradient transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        {isEditing ? (
                          <div className="mt-6 rounded-3xl border border-[#e6eaf2] bg-slate-50 p-5">
                            <div className="mb-5 flex items-center justify-between gap-3">
                              <div>
                                <h4 className="text-lg font800 text-[#0b1533]">
                                  Edit Ticket Tier
                                </h4>
                                <p className="mt-1 text-xs font600 text-[#66708a]">
                                  Update name, price, quantity or description.
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#e6eaf2] bg-white text-[#66708a] transition hover:bg-slate-100 hover:text-[#0b1533]"
                              >
                                <X size={18} />
                              </button>
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                              <FormInput
                                label="Tier Name"
                                name="name"
                                value={editForm.name}
                                onChange={handleEditChange}
                                placeholder="General, Premium, VIP"
                                required
                              />

                              <FormInput
                                label="Price"
                                name="price"
                                type="number"
                                value={editForm.price}
                                onChange={handleEditChange}
                                placeholder="999"
                                required
                              />

                              <FormInput
                                label="Total Quantity"
                                name="totalQuantity"
                                type="number"
                                value={editForm.totalQuantity}
                                onChange={handleEditChange}
                                placeholder="100"
                                required
                              />
                            </div>

                            <div className="mt-4">
                              <label className="mb-2 block text-sm font700 text-[#0b1533]">
                                Description
                              </label>

                              <textarea
                                name="description"
                                value={editForm.description}
                                onChange={handleEditChange}
                                rows={3}
                                placeholder="Describe benefits or access details"
                                className="w-full rounded-2xl border border-[#e0e6f0] bg-white px-4 py-3.5 text-sm font600 text-[#0b1533] outline-none transition placeholder:text-[#9aa4b8] focus:border-[#0ea5a4] focus:ring-4 focus:ring-teal-500/10"
                              />
                            </div>

                            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                              <Button
                                onClick={() => handleUpdateTier(tier.id)}
                                disabled={updatingTierId === tier.id}
                              >
                                {updatingTierId === tier.id
                                  ? "Saving..."
                                  : "Save Changes"}
                              </Button>

                              <Button
                                variant="secondary"
                                onClick={handleCancelEdit}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <div className="border-t border-[#e6eaf2] bg-slate-50 p-6 lg:border-l lg:border-t-0">
                        <div className="grid grid-cols-2 gap-4">
                          <MiniMetric label="Total" value={total} />
                          <MiniMetric label="Sold" value={sold} />
                          <MiniMetric label="Remaining" value={remaining} />
                          <MiniMetric label="Tier ID" value={tier.id || "N/A"} />
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <Card className="p-6">
            <div className="mb-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-[#0ea5a4]">
                <Plus size={26} />
              </div>

              <h2 className="mt-5 text-2xl font800 tracking-[-0.03em] text-[#0b1533]">
                Create Ticket Tier
              </h2>

              <p className="mt-2 text-sm font600 leading-6 text-[#66708a]">
                Add a new ticket tier directly for this event.
              </p>
            </div>

            <form onSubmit={handleCreateTier} className="space-y-5">
              <FormInput
                label="Tier Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="General, Premium, VIP"
                icon={<Ticket size={20} />}
                required
              />

              <FormInput
                label="Price"
                name="price"
                type="number"
                value={form.price}
                onChange={handleChange}
                placeholder="999"
                icon={<CircleDollarSign size={20} />}
                required
              />

              <FormInput
                label="Total Quantity"
                name="totalQuantity"
                type="number"
                value={form.totalQuantity}
                onChange={handleChange}
                placeholder="100"
                icon={<Users size={20} />}
                required
              />

              <div>
                <label className="mb-2 block text-sm font700 text-[#0b1533]">
                  Description
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe benefits or access details"
                  className="w-full rounded-2xl border border-[#e0e6f0] bg-white px-4 py-3.5 text-sm font600 text-[#0b1533] outline-none transition placeholder:text-[#9aa4b8] focus:border-[#0ea5a4] focus:ring-4 focus:ring-teal-500/10"
                />
              </div>

              {!canManageTickets ? (
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font700 text-[#66708a]">
                  Only the creator of this event can create ticket tiers.
                </div>
              ) : null}

              {formError ? (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font700 text-red-600">
                  {formError}
                </div>
              ) : null}

              <Button
                type="submit"
                className="w-full"
                disabled={creating || !canManageTickets}
              >
                <Plus size={18} />
                {creating ? "Creating..." : "Create Ticket Tier"}
              </Button>
            </form>
          </Card>

          <Card className="p-6">
            <div className="rounded-3xl bg-gradient-to-br from-teal-50 to-indigo-50 p-6">
              <div className="w-fit rounded-2xl bg-white p-4 text-[#0ea5a4]">
                <Ticket size={28} />
              </div>

              <h3 className="mt-5 text-xl font800 text-[#0b1533]">
                Event Context
              </h3>

              <p className="mt-3 text-sm font600 leading-7 text-[#66708a]">
                Ticket tiers created here are attached to:
              </p>

              <p className="mt-3 break-words text-sm font800 text-[#0b1533]">
                {eventName}
              </p>

              <p className="mt-2 text-xs font700 text-[#66708a]">
                Event ID: {id}
              </p>

              <p className="mt-2 text-xs font700 text-[#66708a]">
                Organizer: {event?.organizerUsername || "N/A"}
              </p>

              {canManageTickets ? (
                <Badge color="green" className="mt-4">
                  You can manage tiers
                </Badge>
              ) : (
                <Badge color="gray" className="mt-4">
                  View only
                </Badge>
              )}
            </div>
          </Card>
        </aside>
      </div>
    </AppLayout>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="text-xs font800 uppercase tracking-wide text-[#66708a]">
        {label}
      </p>
      <p className="mt-2 break-words text-lg font800 text-[#0b1533]">
        {value}
      </p>
    </div>
  );
}