import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  FileText,
  MapPin,
  Plus,
  Tag,
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
import {
  createCategory,
  createEvent,
  createTicketTier,
  createVenue,
  getCategories,
  getEvents,
  getVenues,
} from "../api/eventsApi";

function toLocalDateTime(value) {
  if (!value) return "";
  return value.length === 16 ? `${value}:00` : value;
}

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

export default function CreateEventPage() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [venues, setVenues] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedTierEventName, setSelectedTierEventName] = useState("");

  const [selectedCategoryName, setSelectedCategoryName] = useState("");

  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedVenueName, setSelectedVenueName] = useState("");

  const [loadingMeta, setLoadingMeta] = useState(true);

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
  });

  const [venueForm, setVenueForm] = useState({
    name: "",
    address: "",
    city: "",
    country: "India",
    state: "",
    capacity: "",
  });

  const [eventForm, setEventForm] = useState({
    name: "",
    description: "",
    startTime: "",
    endTime: "",
    maxAttendees: "",
  });

  const [tierForm, setTierForm] = useState({
    name: "General",
    price: "",
    totalQuantity: "",
    description: "",
  });

  const [createdEvent, setCreatedEvent] = useState(null);
  const [createdTier, setCreatedTier] = useState(null);

  const [creatingCategory, setCreatingCategory] = useState(false);
  const [creatingVenue, setCreatingVenue] = useState(false);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [creatingTier, setCreatingTier] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadMeta() {
    try {
      setLoadingMeta(true);

      const [categoryResponse, venueResponse, eventsResponse] = await Promise.all([
        getCategories(),
        getVenues(),
        getEvents(),
      ]);

      const categoryList = unwrapList(categoryResponse);
      const venueList = unwrapList(venueResponse);
      const eventList = unwrapList(eventsResponse);

      setCategories(categoryList);
      setVenues(venueList);

      const sortedEvents = [...eventList].sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
      setEvents(sortedEvents);

      if (!selectedTierEventName && sortedEvents.length > 0) {
      setSelectedTierEventName(sortedEvents[0].name || sortedEvents[0].title);
      }

      if (!selectedCategoryName && categoryList.length > 0) {
        setSelectedCategoryName(categoryList[0].name);
      }

      if (venueList.length > 0) {
        const firstVenue = venueList[0];

        if (!selectedState && firstVenue.state) {
            setSelectedState(firstVenue.state);
        }

        if (!selectedCity && firstVenue.city) {
            setSelectedCity(firstVenue.city);
        }

        if (!selectedVenueName && firstVenue.name) {
            setSelectedVenueName(firstVenue.name);
        }
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Could not load categories or venues"
      );
    } finally {
      setLoadingMeta(false);
    }
  }

  useEffect(() => {
    loadMeta();
  }, []);

  const selectedCategory = useMemo(() => {
    return categories.find((category) => category.name === selectedCategoryName);
  }, [categories, selectedCategoryName]);

  const stateOptions = useMemo(() => {
    return Array.from(
      new Set(
        venues
          .map((venue) => venue.state)
          .filter(Boolean)
      )
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

  const filteredVenueOptions = useMemo(() => {
    return venues
      .filter(
      (venue) =>
          venue.state === selectedState &&
          venue.city === selectedCity
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

  const eventOptions = useMemo(() => {
    return events.map((event) => event.name || event.title || `Event #${event.id}`);
  }, [events]);

  const selectedTierEvent = useMemo(() => {
    return events.find(
      (event) =>
      (event.name || event.title || `Event #${event.id}`) === selectedTierEventName
    );
  }, [events, selectedTierEventName]);


  const handleCategoryChange = (e) => {
    setCategoryForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleVenueChange = (e) => {
    setVenueForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleEventChange = (e) => {
    setEventForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleTierChange = (e) => {
    setTierForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleStateSelect = (state) => {
    setSelectedState(state);

    const firstCityForState = venues.find((venue) => venue.state === state)?.city || "";
    setSelectedCity(firstCityForState);

    const firstVenueForState = venues.find(
      (venue) => venue.state === state && venue.city === firstCityForState
    )?.name || "";

    setSelectedVenueName(firstVenueForState);
  };

  const handleCitySelect = (city) => {
   setSelectedCity(city);

    const firstVenueForCity = venues.find(
        (venue) => venue.state === selectedState && venue.city === city
    )?.name || "";

    setSelectedVenueName(firstVenueForCity);
  };

  const handleVenueSelect = (venueName) => {
    setSelectedVenueName(venueName);
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();

    try {
      setCreatingCategory(true);
      setError("");
      setSuccess("");

      const payload = {
        name: categoryForm.name,
        description: categoryForm.description,
      };

      const response = await createCategory(payload);
      const categoryData = unwrapData(response);

      setSuccess("Category created successfully.");
      setCategoryForm({ name: "", description: "" });

      await loadMeta();

      if (categoryData?.name) {
        setSelectedCategoryName(categoryData.name);
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Could not create category"
      );
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleCreateVenue = async (e) => {
    e.preventDefault();

    try {
      setCreatingVenue(true);
      setError("");
      setSuccess("");

      const payload = {
        name: venueForm.name,
        address: venueForm.address,
        city: venueForm.city,
        country: venueForm.country,
        state: venueForm.state,
        capacity: Number(venueForm.capacity),
      };

      const response = await createVenue(payload);
      const venueData = unwrapData(response);

      setSuccess("Venue created successfully.");
      setVenueForm({
        name: "",
        address: "",
        city: "",
        country: "India",
        state: "",
        capacity: "",
      });

      await loadMeta();

      if (venueData?.name) {
        setSelectedVenueName(venueData.name);
      }
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || "Could not create venue"
      );
    } finally {
      setCreatingVenue(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedCategory?.id) {
      setError("Please select or create a category first.");
      return;
    }

    if (!selectedVenue?.id) {
      setError("Please select or create a venue first.");
      return;
    }

    try {
      setCreatingEvent(true);

      const location = `${selectedVenue.name}, ${selectedVenue.city}, ${selectedVenue.state}`;

      const payload = {
        name: eventForm.name,
        description: eventForm.description,
        location,
        startTime: toLocalDateTime(eventForm.startTime),
        endTime: toLocalDateTime(eventForm.endTime),
        maxAttendees: Number(eventForm.maxAttendees),
        venueId: selectedVenue.id,
        categoryId: selectedCategory.id,
      };

      const response = await createEvent(payload);
      const eventData = unwrapData(response);

      setCreatedEvent(eventData);
      setSuccess("Event created successfully. Now create a ticket tier.");
      await loadMeta();

      if (eventData?.name || eventData?.title) {
        setSelectedTierEventName(eventData.name || eventData.title);
      }
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || "Could not create event"
      );
    } finally {
      setCreatingEvent(false);
    }
  };

  const handleCreateTicketTier = async (e) => {
    e.preventDefault();

    if (!selectedTierEvent?.id) {
      setError("Please select an event before creating a ticket tier.");
      return;
    }

    try {
      setCreatingTier(true);
      setError("");
      setSuccess("");

      const payload = {
        eventId: selectedTierEvent.id,
        name: tierForm.name,
        price: Number(tierForm.price),
        totalQuantity: Number(tierForm.totalQuantity),
        description: tierForm.description,
      };

      const response = await createTicketTier(payload);
      const tierData = unwrapData(response);

      setCreatedTier(tierData);
      setSuccess("Ticket tier created successfully.");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Could not create ticket tier"
      );
    } finally {
      setCreatingTier(false);
    }
  };

//   const handleStateSelect = (state) => {
//     setSelectedState(state);

//     const firstCityForState = venues.find((venue) => venue.state === state)?.city || "";
//     setSelectedCity(firstCityForState);

//     const firstVenueForState = venues.find(
//       (venue) => venue.state === state && venue.city === firstCityForState
//     )?.name || "";

//     setSelectedVenueName(firstVenueForState);
//   };

//   const handleCitySelect = (city) => {
//    setSelectedCity(city);

//     const firstVenueForCity = venues.find(
//         (venue) => venue.state === selectedState && venue.city === city
//     )?.name || "";

//     setSelectedVenueName(firstVenueForCity);
//   };

//   const handleVenueSelect = (venueName) => {
//     setSelectedVenueName(venueName);
//   };

  if (loadingMeta) {
    return (
      <AppLayout>
        <LoadingState message="Loading categories and venues..." />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Create Event"
        subtitle="Create category, venue, event, and ticket tier from one organizer workflow."
      />

      <div className="grid gap-8 xl:grid-cols-[1fr_420px]">
        <section className="space-y-8">
          <Card className="p-7">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-teal-50 p-3 text-[#0ea5a4]">
                <Tag size={22} />
              </div>
              <div>
                <h2 className="text-2xl font800 tracking-[-0.03em] text-[#0b1533]">
                  Create Category
                </h2>
                <p className="mt-1 text-sm font600 text-[#66708a]">
                  Example: Music, Tech, Comedy, Workshop.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateCategory} className="grid gap-5 md:grid-cols-[1fr_1fr_auto]">
              <FormInput
                label="Category Name"
                name="name"
                value={categoryForm.name}
                onChange={handleCategoryChange}
                placeholder="Music"
                required
              />

              <FormInput
                label="Description"
                name="description"
                value={categoryForm.description}
                onChange={handleCategoryChange}
                placeholder="Music events"
                required
              />

              <div className="flex items-end">
                <Button type="submit" disabled={creatingCategory}>
                  <Plus size={18} />
                  {creatingCategory ? "Creating..." : "Create"}
                </Button>
              </div>
            </form>
          </Card>

          <Card className="p-7">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
                <MapPin size={22} />
              </div>
              <div>
                <h2 className="text-2xl font800 tracking-[-0.03em] text-[#0b1533]">
                  Create Venue
                </h2>
                <p className="mt-1 text-sm font600 text-[#66708a]">
                  Add a venue, then select it while creating event.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateVenue} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <FormInput
                  label="Venue Name"
                  name="name"
                  value={venueForm.name}
                  onChange={handleVenueChange}
                  placeholder="Pune Indoor Arena"
                  required
                />

                <FormInput
                  label="Address"
                  name="address"
                  value={venueForm.address}
                  onChange={handleVenueChange}
                  placeholder="Baner, Pune"
                  required
                />

                <FormInput
                  label="City"
                  name="city"
                  value={venueForm.city}
                  onChange={handleVenueChange}
                  placeholder="Pune"
                  required
                />

                <FormInput
                  label="State"
                  name="state"
                  value={venueForm.state}
                  onChange={handleVenueChange}
                  placeholder="Maharashtra"
                  required
                />

                <FormInput
                  label="Country"
                  name="country"
                  value={venueForm.country}
                  onChange={handleVenueChange}
                  placeholder="India"
                  required
                />

                <FormInput
                  label="Capacity"
                  name="capacity"
                  type="number"
                  value={venueForm.capacity}
                  onChange={handleVenueChange}
                  placeholder="500"
                  required
                />
              </div>

              <Button type="submit" disabled={creatingVenue}>
                <Plus size={18} />
                {creatingVenue ? "Creating Venue..." : "Create Venue"}
              </Button>
            </form>
          </Card>

          <Card className="p-7">
            <div className="mb-6">
              <h2 className="text-2xl font800 tracking-[-0.03em] text-[#0b1533]">
                Event Details
              </h2>
              <p className="mt-2 text-sm font600 leading-6 text-[#66708a]">
                Select category and venue from real backend data.
              </p>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-6">
              <FormInput
                label="Event Name"
                name="name"
                value={eventForm.name}
                onChange={handleEventChange}
                placeholder="Armaan Malik Live Concert"
                icon={<Ticket size={20} />}
                required
              />

              <div>
                <label className="mb-2 block text-sm font700 text-[#0b1533]">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={eventForm.description}
                  onChange={handleEventChange}
                  placeholder="Enter event description"
                  required
                  rows={5}
                  className="w-full rounded-2xl border border-[#e0e6f0] bg-white px-4 py-3.5 text-sm font600 text-[#0b1533] outline-none transition placeholder:text-[#9aa4b8] focus:border-[#0ea5a4] focus:ring-4 focus:ring-teal-500/10"
                />
              </div>


              <div className="grid gap-5 md:grid-cols-2">
                <FormInput
                  label="Start Time"
                  name="startTime"
                  type="datetime-local"
                  value={eventForm.startTime}
                  onChange={handleEventChange}
                  icon={<CalendarDays size={20} />}
                  required
                />

                <FormInput
                  label="End Time"
                  name="endTime"
                  type="datetime-local"
                  value={eventForm.endTime}
                  onChange={handleEventChange}
                  icon={<CalendarDays size={20} />}
                  required
                />

                <FormInput
                  label="Max Attendees"
                  name="maxAttendees"
                  type="number"
                  value={eventForm.maxAttendees}
                  onChange={handleEventChange}
                  placeholder="500"
                  icon={<Users size={20} />}
                  required
                />

                <CustomSelect
                  label="Category"
                  value={selectedCategoryName || "Create category first"}
                  options={categoryOptions.length ? categoryOptions : ["Create category first"]}
                  onChange={setSelectedCategoryName}
                />

                <CustomSelect
                  label="State"
                  value={selectedState || "Create venue first"}
                  options={stateOptions.length ? stateOptions : ["Create venue first"]}
                  onChange={handleStateSelect}
                />

                <CustomSelect
                  label="City"
                  value={selectedCity || "Select state first"}
                  options={cityOptions.length ? cityOptions : ["Select state first"]}
                  onChange={handleCitySelect}
                />

                <CustomSelect
                  label="Venue"
                  value={selectedVenueName || "Select city first"}
                  options={filteredVenueOptions.length ? filteredVenueOptions : ["Select city first"]}
                  onChange={handleVenueSelect}
                />
              </div>

              <Button type="submit" disabled={creatingEvent}>
                {creatingEvent ? "Creating Event..." : "Create Event"}
              </Button>
            </form>
          </Card>

          <Card className="p-7">
            <div className="mb-6">
              <h2 className="text-2xl font800 tracking-[-0.03em] text-[#0b1533]">
                Ticket Tier
              </h2>
              <p className="mt-2 text-sm font600 leading-6 text-[#66708a]">
                Create an initial ticket tier after event creation.
              </p>
            </div>

            <form onSubmit={handleCreateTicketTier} className="space-y-6">
              <CustomSelect
                label="Event"
                value={selectedTierEventName || "Create or select event first"}
                options={eventOptions.length ? eventOptions : ["Create event first"]}
                onChange={setSelectedTierEventName}
              />
              <div className="grid gap-5 md:grid-cols-2">
                <FormInput
                  label="Tier Name"
                  name="name"
                  value={tierForm.name}
                  onChange={handleTierChange}
                  placeholder="General"
                  icon={<Tag size={20} />}
                  required
                />

                <FormInput
                  label="Price"
                  name="price"
                  type="number"
                  value={tierForm.price}
                  onChange={handleTierChange}
                  placeholder="499"
                  required
                />

                <FormInput
                  label="Total Quantity"
                  name="totalQuantity"
                  type="number"
                  value={tierForm.totalQuantity}
                  onChange={handleTierChange}
                  placeholder="100"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font700 text-[#0b1533]">
                  Tier Description
                </label>
                <textarea
                  name="description"
                  value={tierForm.description}
                  onChange={handleTierChange}
                  placeholder="Standard access to the event"
                  rows={4}
                  className="w-full rounded-2xl border border-[#e0e6f0] bg-white px-4 py-3.5 text-sm font600 text-[#0b1533] outline-none transition placeholder:text-[#9aa4b8] focus:border-[#0ea5a4] focus:ring-4 focus:ring-teal-500/10"
                />
              </div>

              <Button
                type="submit"
                disabled={!selectedTierEvent?.id || creatingTier}
              >
                {creatingTier ? "Creating Tier..." : "Create Ticket Tier"}
              </Button>
            </form>
          </Card>
        </section>

        <aside className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font800 text-[#0b1533]">Creation Status</h2>

            {error ? (
              <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font700 text-red-600">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font700 text-emerald-600">
                {success}
              </div>
            ) : null}

            <div className="mt-6 space-y-4">
              <StatusRow
                label="Categories"
                value={`${categories.length} available`}
                done={categories.length > 0}
              />

              <StatusRow
                label="Venues"
                value={`${venues.length} available`}
                done={venues.length > 0}
              />

              <StatusRow
                label="Selected Category"
                value={selectedCategory?.name || "Not selected"}
                done={Boolean(selectedCategory?.id)}
              />

              <StatusRow
                label="Selected Location"
                value={
                  selectedVenue
                    ? `${selectedVenue.name}, ${selectedVenue.city}, ${selectedVenue.state}`
                    : "Not selected"
                }
                done={Boolean(selectedVenue?.id)}
              />

              <StatusRow
                label="Event"
                value={createdEvent?.id ? `Created #${createdEvent.id}` : "Not created"}
                done={Boolean(createdEvent?.id)}
              />

              <StatusRow
                label="Tier Event"
                value={
                  selectedTierEvent
                    ? `${selectedTierEvent.name || selectedTierEvent.title} (#${selectedTierEvent.id})`
                    : "Not selected"
                }
                done={Boolean(selectedTierEvent?.id)}
              />

              <StatusRow
                label="Ticket Tier"
                value={createdTier?.id ? `Created #${createdTier.id}` : "Not created"}
                done={Boolean(createdTier?.id)}
              />
            </div>

            {createdEvent?.id ? (
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={() => navigate(`/events/${createdEvent.id}`)}
                >
                  View Event
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate("/organizer")}
                >
                  Back to Dashboard
                </Button>
              </div>
            ) : null}
          </Card>

          <Card className="p-6">
            <div className="rounded-3xl bg-gradient-to-br from-teal-50 to-indigo-50 p-6">
              <div className="w-fit rounded-2xl bg-white p-4 text-[#0ea5a4]">
                <FileText size={28} />
              </div>

              <h3 className="mt-5 text-xl font800 text-[#0b1533]">
                Flow
              </h3>
              <p className="mt-3 text-sm font600 leading-7 text-[#66708a]">
                First create or select category and venue. Then create event.
                After event creation, create a ticket tier so the event can be
                booked.
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
    <div className="flex items-center justify-between rounded-2xl border border-[#e6eaf2] bg-white px-4 py-3">
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