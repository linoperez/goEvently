import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  FileText,
  MapPin,
  Save,
  Ticket,
  Users,
} from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import PageHeader from "../components/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import FormInput from "../components/ui/FormInput";
import CustomSelect from "../components/ui/CustomSelect";
import LoadingState from "../components/ui/LoadingState";
import ErrorState from "../components/ui/ErrorState";
import {
  getCategories,
  getEventById,
  getVenues,
  updateEvent,
} from "../api/eventsApi";
import { useAuth } from "../context/AuthContext";


function unwrapData(response) {
  return response?.data ?? response;
}

function unwrapList(response) {
  const data = response?.data ?? response;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data?.content)) return data.data.content;

  return [];
}

function toDateTimeLocal(value) {
  if (!value) return "";

  try {
    const date = new Date(value);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
  } catch {
    return String(value).slice(0, 16);
  }
}

function toLocalDateTime(value) {
  if (!value) return "";
  return value.length === 16 ? `${value}:00` : value;
}

function parseLocationParts(location = "") {
  const parts = String(location)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    venueName: parts[0] || "",
    city: parts[1] || "",
    state: parts[2] || "",
  };
}

function getApiErrorMessage(err, fallback = "Something went wrong") {
  const data = err?.response?.data;

  if (!data) return err?.message || fallback;

  if (typeof data === "string") return data;

  if (data.message) return data.message;

  if (data.error) return data.error;

  if (data.errors && Array.isArray(data.errors)) {
    return data.errors.join(", ");
  }

  if (data.data && typeof data.data === "object") {
    return Object.values(data.data).join(", ");
  }

  return fallback;
}

function validateEventForm(form, selectedCategory, selectedVenue) {
  if (!form.name.trim() || form.name.trim().length < 3) {
    return "Event name must be at least 3 characters.";
  }

  if (!form.description.trim() || form.description.trim().length < 10) {
    return "Description must be at least 10 characters.";
  }

  if (!form.startTime) {
    return "Start time is required.";
  }

  if (!form.endTime) {
    return "End time is required.";
  }

  const start = new Date(form.startTime);
  const end = new Date(form.endTime);
  const now = new Date();

  if (start <= now) {
    return "Start time must be in the future.";
  }

  if (end <= start) {
    return "End time must be after start time.";
  }

  if (!form.maxAttendees || Number(form.maxAttendees) < 1) {
    return "Max attendees must be at least 1.";
  }

  if (!selectedCategory?.id) {
    return "Please select a valid category.";
  }

  if (!selectedVenue?.id) {
    return "Please select a valid venue.";
  }

  return "";
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


export default function EditEventPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [categories, setCategories] = useState([]);
  const [venues, setVenues] = useState([]);

  const [form, setForm] = useState({
    name: "",
    description: "",
    startTime: "",
    endTime: "",
    maxAttendees: "",
  });

  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedVenueName, setSelectedVenueName] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadPage() {
      try {
        setLoading(true);
        setError("");

        const [eventResponse, categoryResponse, venueResponse] =
          await Promise.all([getEventById(id), getCategories(), getVenues()]);

        const eventData = unwrapData(eventResponse);
        const categoryList = unwrapList(categoryResponse);
        const venueList = unwrapList(venueResponse);

        setEvent(eventData);
        setCategories(categoryList);
        setVenues(venueList);

        setForm({
          name: eventData.name || eventData.title || "",
          description: eventData.description || "",
          startTime: toDateTimeLocal(eventData.startTime),
          endTime: toDateTimeLocal(eventData.endTime),
          maxAttendees: eventData.maxAttendees || "",
        });

        const categoryFromEvent =
          eventData.categoryName ||
          categoryList.find((category) => category.id === eventData.categoryId)
            ?.name ||
          categoryList[0]?.name ||
          "";

        setSelectedCategoryName(categoryFromEvent);

        const locationParts = parseLocationParts(eventData.location);

        const venueFromLocation = venueList.find(
          (venue) =>
            venue.name === locationParts.venueName &&
            venue.city === locationParts.city &&
            venue.state === locationParts.state
        );

        const venueFromId = venueList.find(
          (venue) => venue.id === eventData.venueId
        );

        const selectedVenue = venueFromLocation || venueFromId || venueList[0];

        if (selectedVenue) {
          setSelectedState(selectedVenue.state || "");
          setSelectedCity(selectedVenue.city || "");
          setSelectedVenueName(selectedVenue.name || "");
        }
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err.message ||
            "Could not load event for editing"
        );
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, [id]);

  const selectedCategory = useMemo(() => {
    return categories.find((category) => category.name === selectedCategoryName);
  }, [categories, selectedCategoryName]);

  const stateOptions = useMemo(() => {
    return Array.from(
      new Set(venues.map((venue) => venue.state).filter(Boolean))
    );
  }, [venues]);

  const cityOptions = useMemo(() => {
    return Array.from(
      new Set(
        venues
          .filter((venue) => venue.state === selectedState)
          .map((venue) => venue.city)
          .filter(Boolean)
      )
    );
  }, [venues, selectedState]);

  const venueOptions = useMemo(() => {
    return venues
      .filter(
        (venue) => venue.state === selectedState && venue.city === selectedCity
      )
      .map((venue) => venue.name);
  }, [venues, selectedState, selectedCity]);

  const selectedVenue = useMemo(() => {
    return venues.find(
      (venue) =>
        venue.name === selectedVenueName &&
        venue.city === selectedCity &&
        venue.state === selectedState
    );
  }, [venues, selectedVenueName, selectedCity, selectedState]);

  const categoryOptions = useMemo(() => {
    return categories.map((category) => category.name);
  }, [categories]);

  const locationPreview = selectedVenue
    ? `${selectedVenue.name}, ${selectedVenue.city}, ${selectedVenue.state}`
    : "Select venue, city and state";

  const minDateTime = new Date(Date.now() + 60 * 1000)
    .toISOString()
    .slice(0, 16);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleStateSelect = (state) => {
    setSelectedState(state);

    const firstCityForState =
      venues.find((venue) => venue.state === state)?.city || "";

    setSelectedCity(firstCityForState);

    const firstVenueForState =
      venues.find(
        (venue) => venue.state === state && venue.city === firstCityForState
      )?.name || "";

    setSelectedVenueName(firstVenueForState);
  };

  const handleCitySelect = (city) => {
    setSelectedCity(city);

    const firstVenueForCity =
      venues.find(
        (venue) => venue.state === selectedState && venue.city === city
      )?.name || "";

    setSelectedVenueName(firstVenueForCity);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateEventForm(
        form,
        selectedCategory,
        selectedVenue
    );

    if (validationError) {
        setError(validationError);
        setSuccess("");
        return;
    }

    try {
        setSaving(true);
        setError("");
        setSuccess("");

        const location = `${selectedVenue.name}, ${selectedVenue.city}, ${selectedVenue.state}`;

        const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        location,
        startTime: toLocalDateTime(form.startTime),
        endTime: toLocalDateTime(form.endTime),
        maxAttendees: Number(form.maxAttendees),
        venueId: selectedVenue.id,
        categoryId: selectedCategory.id,
        };

        console.log("UPDATE EVENT PAYLOAD:", payload);

        const response = await updateEvent(id, payload);
        const updatedEvent = unwrapData(response);

        setEvent(updatedEvent);
        setSuccess("Event updated successfully.");
    } catch (err) {
        console.error("UPDATE EVENT ERROR:", err?.response?.data || err);

        setError(getApiErrorMessage(err, "Could not update event"));
    } finally {
        setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <LoadingState message="Loading event for editing..." />
      </AppLayout>
    );
  }

  if (error && !event) {
    return (
      <AppLayout>
        <ErrorState title="Could not load event" message={error} />

        <div className="mt-6">
          <Link to="/organizer">
            <Button>Back to Organizer</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Edit Event"
        subtitle="Update event details, category, venue, schedule and capacity."
        action={
          <Link to="/organizer">
            <Button variant="secondary">Back to Dashboard</Button>
          </Link>
        }
      />

      <div className="grid gap-8 xl:grid-cols-[1fr_420px]">
        <section>
          <Card className="p-7">
            <div className="mb-6">
              <h2 className="text-2xl font800 tracking-[-0.03em] text-[#0b1533]">
                Event Information
              </h2>
              <p className="mt-2 text-sm font600 leading-6 text-[#66708a]">
                This form maps to your backend UpdateEventRequest.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <FormInput
                label="Event Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Event name"
                icon={<Ticket size={20} />}
                required
              />

              <div>
                <label className="mb-2 block text-sm font700 text-[#0b1533]">
                  Description <span className="text-red-500">*</span>
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={5}
                  required
                  className="w-full rounded-2xl border border-[#e0e6f0] bg-white px-4 py-3.5 text-sm font600 text-[#0b1533] outline-none transition placeholder:text-[#9aa4b8] focus:border-[#0ea5a4] focus:ring-4 focus:ring-teal-500/10"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <FormInput
                  label="Start Time"
                  name="startTime"
                  type="datetime-local"
                  value={form.startTime}
                  onChange={handleChange}
                  icon={<CalendarDays size={20} />}
                  min={minDateTime}
                  required
                />

                <FormInput
                  label="End Time"
                  name="endTime"
                  type="datetime-local"
                  value={form.endTime}
                  onChange={handleChange}
                  icon={<CalendarDays size={20} />}
                  min={form.startTime || minDateTime}
                  required
                />

                <FormInput
                  label="Max Attendees"
                  name="maxAttendees"
                  type="number"
                  value={form.maxAttendees}
                  onChange={handleChange}
                  icon={<Users size={20} />}
                  required
                />

                <CustomSelect
                  label="Category"
                  value={selectedCategoryName || "Select category"}
                  options={
                    categoryOptions.length ? categoryOptions : ["No categories"]
                  }
                  onChange={setSelectedCategoryName}
                />

                <CustomSelect
                  label="State"
                  value={selectedState || "Select state"}
                  options={stateOptions.length ? stateOptions : ["No states"]}
                  onChange={handleStateSelect}
                />

                <CustomSelect
                  label="City"
                  value={selectedCity || "Select city"}
                  options={cityOptions.length ? cityOptions : ["No cities"]}
                  onChange={handleCitySelect}
                />

                <CustomSelect
                  label="Venue"
                  value={selectedVenueName || "Select venue"}
                  options={venueOptions.length ? venueOptions : ["No venues"]}
                  onChange={setSelectedVenueName}
                />
              </div>

              <div className="rounded-3xl border border-[#e6eaf2] bg-slate-50 p-5">
                <div className="flex gap-4">
                  <MapPin className="text-[#0ea5a4]" />
                  <div>
                    <p className="font800 text-[#0b1533]">Location Preview</p>
                    <p className="mt-1 text-sm font600 text-[#66708a]">
                      {locationPreview}
                    </p>
                  </div>
                </div>
              </div>

              {error ? (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font700 text-red-600">
                  {error}
                </div>
              ) : null}

              {success ? (
                <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font700 text-emerald-600">
                  {success}
                </div>
              ) : null}

              <Button type="submit" disabled={saving}>
                <Save size={18} />
                {saving ? "Saving Changes..." : "Save Changes"}
              </Button>
            </form>
          </Card>
        </section>

        <aside className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font800 text-[#0b1533]">Current Event</h2>

            <div className="mt-6 space-y-4">
              <StatusRow label="Event ID" value={event?.id || "N/A"} done />
              <StatusRow
                label="Category"
                value={selectedCategory?.name || "Not selected"}
                done={Boolean(selectedCategory?.id)}
              />
              <StatusRow
                label="Venue"
                value={selectedVenue?.name || "Not selected"}
                done={Boolean(selectedVenue?.id)}
              />
              <StatusRow
                label="Location"
                value={locationPreview}
                done={Boolean(selectedVenue?.id)}
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={() => navigate(`/events/${event?.id}`)}
              >
                View Event
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate("/organizer")}
              >
                Organizer
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="rounded-3xl bg-gradient-to-br from-teal-50 to-indigo-50 p-6">
              <div className="w-fit rounded-2xl bg-white p-4 text-[#0ea5a4]">
                <FileText size={28} />
              </div>

              <h3 className="mt-5 text-xl font800 text-[#0b1533]">
                Update Note
              </h3>

              <p className="mt-3 text-sm font600 leading-7 text-[#66708a]">
                Location is rebuilt from selected venue, city and state before
                sending the update request to backend.
              </p>
            </div>
          </Card>
        </aside>
      </div>
    </AppLayout>
  );
}

function StatusRow({ label, value, done }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#e6eaf2] bg-white px-4 py-3">
      <span className="text-sm font700 text-[#66708a]">{label}</span>
      <span
        className={`text-right text-sm font800 ${
          done ? "text-[#0ea5a4]" : "text-orange-600"
        }`}
      >
        {value}
      </span>
    </div>
  );
}