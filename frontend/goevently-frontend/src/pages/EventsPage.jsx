import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import PageHeader from "../components/PageHeader";
import EventCard from "../components/EventCard";
import LoadingState from "../components/ui/LoadingState";
import ErrorState from "../components/ui/ErrorState";
import EmptyState from "../components/ui/EmptyState";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import CustomSelect from "../components/ui/CustomSelect";
import { getCategories, getEvents } from "../api/eventsApi";

function unwrapEventPage(response) {
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

  if (Array.isArray(data?.content)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return {
      content: data.data,
      totalElements: data.data.length,
      totalPages: 1,
      number: 0,
      size: data.data.length,
    };
  }

  if (Array.isArray(data?.data?.content)) {
    return data.data;
  }

  return {
    content: [],
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size: 12,
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

function getMonthDateRange(monthValue) {
  if (!monthValue) {
    return {
      startDate: "",
      endDate: "",
    };
  }

  const [year, month] = monthValue.split("-").map(Number);

  if (!year || !month) {
    return {
      startDate: "",
      endDate: "",
    };
  }

  const startDate = `${monthValue}-01T00:00:00`;

  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${monthValue}-${String(lastDay).padStart(2, "0")}T23:59:59`;

  return {
    startDate,
    endDate,
  };
}

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);

  const [keyword, setKeyword] = useState("");
  const [city, setCity] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [month, setMonth] = useState("");
  const [sort, setSort] = useState("startTime,asc");

  const [page, setPage] = useState(0);
  const [size] = useState(12);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const categoryOptions = useMemo(() => {
    return [
      { label: "All Categories", value: "" },
      ...categories.map((category) => ({
        label: category.name,
        value: String(category.id),
      })),
    ];
  }, [categories]);

  const sortOptions = [
    { label: "Soonest First", value: "startTime,asc" },
    { label: "Latest First", value: "startTime,desc" },
    { label: "Name A-Z", value: "name,asc" },
    { label: "Name Z-A", value: "name,desc" },
  ];

  const hasFilters = Boolean(
    keyword.trim() || city.trim() || categoryId || month || sort !== "startTime,asc"
  );

  async function loadFilterData() {
    try {
      setFilterLoading(true);

      const categoryResponse = await getCategories();
      setCategories(unwrapList(categoryResponse));
    } catch (err) {
      console.warn("Could not load categories:", err);
      setCategories([]);
    } finally {
      setFilterLoading(false);
    }
  }

  async function loadEvents({ silent = false } = {}) {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const { startDate, endDate } = getMonthDateRange(month);

      const response = await getEvents({
        keyword: keyword.trim(),
        city: city.trim(),
        categoryId,
        startDate,
        endDate,
        page,
        size,
        sort,
      });

      const eventPage = unwrapEventPage(response);

      setEvents(eventPage.content || []);
      setTotalPages(eventPage.totalPages || 0);
      setTotalElements(eventPage.totalElements || 0);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load events"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadFilterData();
  }, []);

  useEffect(() => {
    loadEvents();
  }, [keyword, city, categoryId, month, page, size, sort]);

  useEffect(() => {
    setPage(0);
  }, [keyword, city, categoryId, month, sort]);

  const handleClearFilters = () => {
    setKeyword("");
    setCity("");
    setCategoryId("");
    setMonth("");
    setSort("startTime,asc");
    setPage(0);
  };

  if (loading) {
    return (
      <AppLayout>
        <LoadingState message="Loading events from backend..." />
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <PageHeader
          title="Explore Events"
          subtitle="Browse events from your backend and start the booking flow with live ticket availability."
        />

        <ErrorState title="Could not load events" message={error} />

        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => loadEvents()}>Retry</Button>

          {hasFilters ? (
            <Button variant="secondary" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          ) : null}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Explore Events"
        subtitle="Browse events from your backend and start the booking flow with live ticket availability."
        action={
          <Button
            variant="secondary"
            onClick={() => loadEvents({ silent: true })}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        }
      />

      <Card className="mb-8 p-5">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-[#0ea5a4]">
              <SlidersHorizontal size={20} />
            </div>

            <div>
              <h2 className="text-lg font800 text-[#0b1533]">Find Events</h2>
              <p className="text-sm font600 text-[#66708a]">
                Search and filter using backend-powered event APIs.
              </p>
            </div>
          </div>

          {hasFilters ? (
            <Button variant="secondary" onClick={handleClearFilters}>
              <X size={17} />
              Clear
            </Button>
          ) : null}
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr_240px_220px_220px]">
          <div className="relative">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#66708a]"
            />

            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Search events..."
              className="w-full rounded-2xl border border-[#e6eaf2] bg-white py-3.5 pl-12 pr-4 text-sm font700 text-[#0b1533] outline-none transition placeholder:text-[#9aa4b8] focus:border-[#0ea5a4] focus:ring-4 focus:ring-teal-500/10"
            />
          </div>

          <input
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="City"
            className="w-full rounded-2xl border border-[#e6eaf2] bg-white px-4 py-3.5 text-sm font700 text-[#0b1533] outline-none transition placeholder:text-[#9aa4b8] focus:border-[#0ea5a4] focus:ring-4 focus:ring-teal-500/10"
          />

          <CustomSelect
            value={categoryId}
            options={categoryOptions}
            onChange={setCategoryId}
            className="w-full"
            disabled={filterLoading}
          />

          <input
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="w-full rounded-2xl border border-[#e6eaf2] bg-white px-4 py-3.5 text-sm font700 text-[#0b1533] outline-none transition focus:border-[#0ea5a4] focus:ring-4 focus:ring-teal-500/10"
          />

          <CustomSelect
            value={sort}
            options={sortOptions}
            onChange={setSort}
            className="w-full"
          />
        </div>
      </Card>

      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-sm font700 text-[#66708a]">
          Showing{" "}
          <span className="font800 text-[#0b1533]">{events.length}</span> of{" "}
          <span className="font800 text-[#0b1533]">{totalElements}</span>{" "}
          events
        </p>
      </div>

      {events.length === 0 ? (
        <EmptyState
          title="No events found"
          message={
            hasFilters
              ? "Try changing your search, city, category, or month filter."
              : "No events are available yet."
          }
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {events.map((event, index) => (
            <EventCard key={event.id || index} event={event} index={index} />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="mt-10 flex items-center justify-center gap-3">
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