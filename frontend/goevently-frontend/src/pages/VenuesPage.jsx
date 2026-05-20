import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Edit3,
  MapPin,
  Plus,
  RefreshCw,
  Trash2,
  Users,
  X,
} from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import FormInput from "../components/ui/FormInput";
import StatCard from "../components/ui/StatCard";
import LoadingState from "../components/ui/LoadingState";
import ErrorState from "../components/ui/ErrorState";
import EmptyState from "../components/ui/EmptyState";
import {
  createVenue,
  deleteVenue,
  getVenues,
  updateVenue,
} from "../api/eventsApi";

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

  if (data.data && typeof data.data === "object") {
    return Object.values(data.data).join(", ");
  }

  return fallback;
}

function isAdmin(user) {
  return String(user?.role || "").toUpperCase() === "ADMIN";
}

function isOrganizerOrAdmin(user) {
  const role = String(user?.role || "").toUpperCase();
  return role === "ADMIN" || role === "ORGANIZER";
}


const emptyForm = {
  name: "",
  address: "",
  city: "",
  state: "",
  country: "India",
  zipCode: "",
  capacity: "",
  description: "",
};

export default function VenuesPage() {
  const { user } = useAuth();

  const [venues, setVenues] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const [editingVenueId, setEditingVenueId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updatingVenueId, setUpdatingVenueId] = useState(null);
  const [deletingVenueId, setDeletingVenueId] = useState(null);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");
  const [success, setSuccess] = useState("");

  const canCreateVenue = isOrganizerOrAdmin(user);
  const canModifyVenue = isAdmin(user);

  async function loadVenues({ silent = false } = {}) {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await getVenues();
      setVenues(unwrapList(response));
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load venues"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadVenues();
  }, []);

  const stats = useMemo(() => {
    const total = venues.length;

    const capacity = venues.reduce(
        (sum, venue) => sum + Number(venue.capacity || 0),
        0
    );

    return {
        total,
        capacity,
    };
    }, [venues]);

  const filteredVenues = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return venues.filter((venue) => {
        const combined = [
        venue.name,
        venue.address,
        venue.city,
        venue.state,
        venue.country,
        venue.zipCode,
        venue.description,
        ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

        return !normalizedSearch || combined.includes(normalizedSearch);
    });
    }, [venues, search]);

  const cityCount = useMemo(() => {
    return new Set(venues.map((venue) => venue.city).filter(Boolean)).size;
  }, [venues]);

  const handleChange = (event) => {
    setForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleEditChange = (event) => {
    setEditForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const validateVenueForm = (values) => {
    if (!values.name.trim()) return "Venue name is required.";
    if (!values.address.trim()) return "Address is required.";
    if (!values.city.trim()) return "City is required.";
    if (!values.state.trim()) return "State is required.";
    if (!values.country.trim()) return "Country is required.";

    if (!values.capacity || Number(values.capacity) < 1) {
      return "Capacity must be at least 1.";
    }

    return "";
  };

  const buildPayload = (values) => ({
    name: values.name.trim(),
    address: values.address.trim(),
    city: values.city.trim(),
    state: values.state.trim(),
    country: values.country.trim(),
    zipCode: values.zipCode.trim(),
    capacity: Number(values.capacity),
    description: values.description.trim(),
    });

  const handleCreateVenue = async (event) => {
    event.preventDefault();

    if (!canCreateVenue) {
      setFormError("Only admins and organizers can create venues.");
      return;
    }

    const validationError = validateVenueForm(form);

    if (validationError) {
      setFormError(validationError);
      setSuccess("");
      return;
    }

    try {
      setCreating(true);
      setFormError("");
      setActionError("");
      setSuccess("");

      await createVenue(buildPayload(form));

      setSuccess("Venue created successfully.");
      setForm(emptyForm);

      await loadVenues({ silent: true });
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Could not create venue"));
    } finally {
      setCreating(false);
    }
  };

  const handleStartEdit = (venue) => {
    setEditingVenueId(venue.id);
    setActionError("");
    setFormError("");
    setSuccess("");

    setEditForm({
      name: venue.name || "",
      address: venue.address || "",
      city: venue.city || "",
      state: venue.state || "",
      country: venue.country || "India",
      zipCode: venue.zipCode || "",
      capacity: venue.capacity ?? "",
      description: venue.description || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingVenueId(null);
    setEditForm(emptyForm);
    setActionError("");
  };

  const handleUpdateVenue = async (venueId) => {
    if (!canModifyVenue) {
      setActionError("Only admins can update venues.");
      return;
    }

    const validationError = validateVenueForm(editForm);

    if (validationError) {
      setActionError(validationError);
      return;
    }

    try {
      setUpdatingVenueId(venueId);
      setActionError("");
      setFormError("");
      setSuccess("");

      await updateVenue(venueId, buildPayload(editForm));

      setSuccess("Venue updated successfully.");
      handleCancelEdit();

      await loadVenues({ silent: true });
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Could not update venue"));
    } finally {
      setUpdatingVenueId(null);
    }
  };

  const handleDeleteVenue = async (venue) => {
    if (!canModifyVenue) {
      setActionError("Only admins can delete venues.");
      return;
    }

    const confirmed = window.confirm(
      `Delete "${venue.name || "this venue"}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeletingVenueId(venue.id);
      setActionError("");
      setFormError("");
      setSuccess("");

      await deleteVenue(venue.id);

      setSuccess("Venue deleted successfully.");

      if (editingVenueId === venue.id) {
        handleCancelEdit();
      }

      await loadVenues({ silent: true });
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Could not delete venue"));
    } finally {
      setDeletingVenueId(null);
    }
  };


  const handleClearFilters = () => {
    setSearch("");
  };

  if (loading) {
    return (
      <AppLayout>
        <LoadingState message="Loading venues..." />
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <ErrorState title="Could not load venues" message={error} />

        <div className="mt-6">
          <Button onClick={() => loadVenues()}>Retry</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Venue Management"
        subtitle="Create, review and manage venues used while creating events."
        action={
          <Button
            variant="secondary"
            onClick={() => loadVenues({ silent: true })}
            disabled={refreshing}
          >
            <RefreshCw size={17} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        }
      />

      <div className="mb-8 grid gap-6 md:grid-cols-3">
        <StatCard
            icon={<Building2 size={26} />}
            label="Total Venues"
            value={stats.total}
            helper="All venues"
            tone="indigo"
        />

        <StatCard
            icon={<Users size={26} />}
            label="Total Capacity"
            value={stats.capacity}
            helper="Across all venues"
            tone="green"
        />

        <StatCard
            icon={<MapPin size={26} />}
            label="Cities"
            value={cityCount}
            helper="Locations covered"
            tone="orange"
        />
        </div>

      <div className="grid gap-8 xl:grid-cols-[1fr_420px]">
        <section className="space-y-6">
          <Card className="p-6">
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                <div>
                <label className="mb-2 block text-sm font700 text-[#0b1533]">
                    Search Venues
                </label>
                <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by name, city, state..."
                    className="w-full rounded-2xl border border-[#e0e6f0] bg-white px-4 py-3.5 text-sm font600 text-[#0b1533] outline-none transition placeholder:text-[#9aa4b8] focus:border-[#0ea5a4] focus:ring-4 focus:ring-teal-500/10"
                />
                </div>

                <Button
                variant="secondary"
                onClick={handleClearFilters}
                disabled={!search}
                >
                Clear
                </Button>
            </div>
            </Card>

          {actionError ? (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font700 text-red-600">
              {actionError}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font700 text-emerald-600">
              {success}
            </div>
          ) : null}

          {!canModifyVenue ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font700 text-[#66708a]">
              You can create and view venues. Editing, deleting and status
              changes are available only for admins.
            </div>
          ) : null}

          {filteredVenues.length === 0 ? (
            <EmptyState
              title="No venues found"
              message="Try clearing filters or create a new venue."
            />
          ) : (
            <div className="grid gap-5">
              {filteredVenues.map((venue) => {
                const isEditing = editingVenueId === venue.id;

                return (
                  <Card key={venue.id} className="overflow-hidden">
                    <div className="grid gap-0 lg:grid-cols-[1fr_250px]">
                      <div className="p-6">
                        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="text-2xl font800 tracking-[-0.03em] text-[#0b1533]">
                                {venue.name || "Unnamed Venue"}
                              </h3>
                            </div>

                            <div className="mt-3 flex items-start gap-2 text-sm font600 leading-6 text-[#66708a]">
                              <MapPin
                                size={18}
                                className="mt-0.5 shrink-0 text-[#0ea5a4]"
                              />
                              <span>
                                {[
                                  venue.address,
                                  venue.city,
                                  venue.state,
                                  venue.country,
                                  venue.zipCode,
                                ]
                                  .filter(Boolean)
                                  .join(", ")}
                              </span>
                            </div>

                            <p className="mt-3 max-w-2xl text-sm font600 leading-6 text-[#66708a]">
                              {venue.description ||
                                "No description added for this venue."}
                            </p>
                          </div>

                          <div className="rounded-3xl bg-teal-50 px-5 py-4 text-left md:text-right">
                            <p className="text-xs font800 uppercase tracking-wide text-[#66708a]">
                              Capacity
                            </p>
                            <p className="mt-1 text-2xl font800 text-[#0ea5a4]">
                              {venue.capacity || 0}
                            </p>
                          </div>
                        </div>

                        {isEditing ? (
                          <div className="mt-6 rounded-3xl border border-[#e6eaf2] bg-slate-50 p-5">
                            <div className="mb-5 flex items-center justify-between gap-3">
                              <div>
                                <h4 className="text-lg font800 text-[#0b1533]">
                                  Edit Venue
                                </h4>
                                <p className="mt-1 text-xs font600 text-[#66708a]">
                                  Update venue details and status.
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

                            <VenueFormFields
                              values={editForm}
                              onChange={handleEditChange}
                            />

                            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                              <Button
                                onClick={() => handleUpdateVenue(venue.id)}
                                disabled={updatingVenueId === venue.id}
                              >
                                {updatingVenueId === venue.id
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
                        <div className="space-y-3">
                          <MiniInfo label="Venue ID" value={venue.id || "N/A"} />
                          <MiniInfo label="City" value={venue.city || "N/A"} />
                          <MiniInfo label="State" value={venue.state || "N/A"} />
                          <MiniInfo
                            label="Zip"
                            value={venue.zipCode || "N/A"}
                          />

                          {canModifyVenue ? (
                            <div className="pt-3">
                              <div className="flex flex-col gap-2">
                                <Button
                                  variant="secondary"
                                  className="w-full"
                                  onClick={() => handleStartEdit(venue)}
                                  disabled={isEditing}
                                >
                                  <Edit3 size={16} />
                                  Edit
                                </Button>

                                <Button
                                  variant="secondary"
                                  className="w-full"
                                  onClick={() => handleDeleteVenue(venue)}
                                  disabled={deletingVenueId === venue.id}
                                >
                                  <Trash2 size={16} />
                                  {deletingVenueId === venue.id
                                    ? "Deleting..."
                                    : "Delete"}
                                </Button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        <aside>
          <Card className="sticky top-28 p-6">
            <div className="mb-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-[#0ea5a4]">
                <Plus size={26} />
              </div>

              <h2 className="mt-5 text-2xl font800 tracking-[-0.03em] text-[#0b1533]">
                Create Venue
              </h2>

              <p className="mt-2 text-sm font600 leading-6 text-[#66708a]">
                Add venues that can be selected while creating events.
              </p>
            </div>

            <form onSubmit={handleCreateVenue} className="space-y-5">
              <VenueFormFields
                values={form}
                onChange={handleChange}
              />

              {!canCreateVenue ? (
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font700 text-[#66708a]">
                  Only admins and organizers can create venues.
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
                disabled={creating || !canCreateVenue}
              >
                <Plus size={18} />
                {creating ? "Creating..." : "Create Venue"}
              </Button>
            </form>
          </Card>
        </aside>
      </div>
    </AppLayout>
  );
}

function VenueFormFields({ values, onChange }) {
  return (
    <div className="space-y-4">
      <FormInput
        label="Venue Name"
        name="name"
        value={values.name}
        onChange={onChange}
        placeholder="Pune Indoor Arena"
        required
      />

      <FormInput
        label="Address"
        name="address"
        value={values.address}
        onChange={onChange}
        placeholder="Baner Road, Pune"
        required
      />

      <div className="grid gap-4 md:grid-cols-2">
        <FormInput
          label="City"
          name="city"
          value={values.city}
          onChange={onChange}
          placeholder="Pune"
          required
        />

        <FormInput
          label="State"
          name="state"
          value={values.state}
          onChange={onChange}
          placeholder="Maharashtra"
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormInput
          label="Country"
          name="country"
          value={values.country}
          onChange={onChange}
          placeholder="India"
          required
        />

        <FormInput
          label="Zip Code"
          name="zipCode"
          value={values.zipCode}
          onChange={onChange}
          placeholder="411045"
        />
      </div>

      <FormInput
        label="Capacity"
        name="capacity"
        type="number"
        value={values.capacity}
        onChange={onChange}
        placeholder="500"
        required
        />

      <div>
        <label className="mb-2 block text-sm font700 text-[#0b1533]">
          Description
        </label>

        <textarea
          name="description"
          value={values.description}
          onChange={onChange}
          rows={4}
          placeholder="Describe venue facilities, seating, accessibility..."
          className="w-full rounded-2xl border border-[#e0e6f0] bg-white px-4 py-3.5 text-sm font600 text-[#0b1533] outline-none transition placeholder:text-[#9aa4b8] focus:border-[#0ea5a4] focus:ring-4 focus:ring-teal-500/10"
        />
      </div>
    </div>
  );
}

function MiniInfo({ label, value }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="text-xs font800 uppercase tracking-wide text-[#66708a]">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font800 text-[#0b1533]">
        {value}
      </p>
    </div>
  );
}