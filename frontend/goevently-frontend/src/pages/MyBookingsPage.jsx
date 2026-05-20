import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock,
  Mail,
  RefreshCw,
  RotateCcw,
  Send,
  TriangleAlert,
  UserRound,
  XCircle,
} from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import PageHeader from "../components/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import StatCard from "../components/ui/StatCard";
import CustomSelect from "../components/ui/CustomSelect";
import LoadingState from "../components/ui/LoadingState";
import ErrorState from "../components/ui/ErrorState";
import EmptyState from "../components/ui/EmptyState";
import { useAuth } from "../context/AuthContext";
import {
  getUserNotifications,
  markNotificationAsSent,
  retryFailedNotifications,
} from "../api/notificationApi";

function unwrapPage(response) {
  const data = response?.data ?? response;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data?.content)) return data.data.content;
  if (Array.isArray(data?.data)) return data.data;

  return [];
}

function normalizeStatus(status) {
  return String(status || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
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
  const normalized = normalizeStatus(status);

  if (normalized === "FAILED") return "red";
  if (normalized === "PENDING") return "orange";
  if (normalized === "SUCCESS" || normalized === "SENT") return "green";

  return "gray";
}

function getStatusIcon(status) {
  const normalized = normalizeStatus(status);

  if (normalized === "FAILED") return <XCircle size={22} />;
  if (normalized === "PENDING") return <Clock size={22} />;
  if (normalized === "SUCCESS" || normalized === "SENT") {
    return <CheckCircle2 size={22} />;
  }

  return <Clock size={22} />;
}

function getStatusTone(status) {
  const normalized = normalizeStatus(status);

  if (normalized === "FAILED") return "bg-red-50 text-red-600";
  if (normalized === "PENDING") return "bg-orange-50 text-orange-600";
  if (normalized === "SUCCESS" || normalized === "SENT") {
    return "bg-emerald-50 text-emerald-600";
  }

  return "bg-orange-50 text-orange-600";
}

function getNotificationTitle(notification) {
  return notification.title || "goEvently Notification";
}

function getNotificationMessage(notification) {
  return notification.message || "You have a new notification from goEvently.";
}

function getNotificationMeaning(notification) {
  const title = String(notification?.title || "").toLowerCase();
  const message = String(notification?.message || "").toLowerCase();
  const combined = `${title} ${message}`;

  if (
    combined.includes("failed") ||
    combined.includes("failure") ||
    combined.includes("cancelled") ||
    combined.includes("canceled")
  ) {
    return "FAILED";
  }

  if (
    combined.includes("pending") ||
    combined.includes("waiting") ||
    combined.includes("initiated") ||
    combined.includes("processing")
  ) {
    return "PENDING";
  }

  if (
    combined.includes("successful") ||
    combined.includes("success") ||
    combined.includes("confirmed") ||
    combined.includes("completed")
  ) {
    return "SUCCESS";
  }

  return normalizeStatus(notification?.status);
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

function extractBookingIdFromNotification(notification) {
  const title = String(notification?.title || "");
  const message = String(notification?.message || "");
  const combined = `${title} ${message}`;

  const patterns = [
    /booking\s*id\s*[:#-]?\s*(\d+)/i,
    /booking\s*#\s*(\d+)/i,
    /booking\s+(\d+)/i,
    /gev[-\s]?(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = combined.match(pattern);

    if (match?.[1]) return match[1];
  }

  return null;
}

function isPaymentNotification(notification) {
  const title = String(notification?.title || "").toLowerCase();
  const message = String(notification?.message || "").toLowerCase();
  const combined = `${title} ${message}`;

  return (
    combined.includes("payment") ||
    combined.includes("paid") ||
    combined.includes("transaction") ||
    combined.includes("booking")
  );
}

function getNotificationTime(notification) {
  return (
    notification.createdAt ||
    notification.sentAt ||
    notification.updatedAt ||
    notification.createdDate
  );
}

export default function NotificationsPage() {
  const { user, isAuthenticated } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [retryingFailed, setRetryingFailed] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const userId = user?.userId || user?.id;

  async function loadNotifications({ silent = false } = {}) {
    if (!userId) {
      setLoading(false);
      setError("User ID not found. Please login again.");
      return;
    }

    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await getUserNotifications(userId, 0, 100);
      const notificationList = unwrapPage(response);

      const sortedNotifications = [...notificationList].sort((a, b) => {
        const dateA = new Date(getNotificationTime(a) || 0).getTime();
        const dateB = new Date(getNotificationTime(b) || 0).getTime();

        if (dateB !== dateA) return dateB - dateA;

        return Number(b.id || 0) - Number(a.id || 0);
      });

      setNotifications(sortedNotifications);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load notifications"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, [userId]);

  const stats = useMemo(() => {
    const total = notifications.length;

    const sent = notifications.filter(
      (notification) => normalizeStatus(notification.status) === "SENT"
    ).length;

    const pending = notifications.filter(
      (notification) => normalizeStatus(notification.status) === "PENDING"
    ).length;

    const failed = notifications.filter(
      (notification) => normalizeStatus(notification.status) === "FAILED"
    ).length;

    return {
      total,
      sent,
      pending,
      failed,
    };
  }, [notifications]);

  const statusOptions = [
    { label: "All", value: "All" },
    { label: "Successful", value: "SUCCESS" },
    { label: "Failed", value: "FAILED" },
    { label: "Pending", value: "PENDING" },
    { label: "Delivery Sent", value: "DELIVERY_SENT" },
    { label: "Delivery Failed", value: "DELIVERY_FAILED" },
  ];

  const filteredNotifications = useMemo(() => {
    if (statusFilter === "All") return notifications;

    return notifications.filter((notification) => {
      const deliveryStatus = normalizeStatus(notification.status);
      const meaningStatus = getNotificationMeaning(notification);

      if (statusFilter === "DELIVERY_SENT") {
        return deliveryStatus === "SENT";
      }

      if (statusFilter === "DELIVERY_FAILED") {
        return deliveryStatus === "FAILED";
      }

      return meaningStatus === statusFilter;
    });
  }, [notifications, statusFilter]);

  const handleMarkAsSent = async (notificationId) => {
    if (actionLoadingId || retryingFailed) return;

    try {
      setActionLoadingId(notificationId);
      setSuccess("");
      setError("");

      await markNotificationAsSent(notificationId);

      setSuccess("Notification marked as sent.");
      await loadNotifications({ silent: true });
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not mark notification as sent"));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRetryFailed = async () => {
    if (retryingFailed || actionLoadingId) return;

    try {
      setRetryingFailed(true);
      setSuccess("");
      setError("");

      await retryFailedNotifications();

      setSuccess("Retry process started for failed notifications.");
      await loadNotifications({ silent: true });
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not retry failed notifications"));
    } finally {
      setRetryingFailed(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <AppLayout>
        <ErrorState
          title="Login required"
          message="Please login to view your notifications."
        />

        <div className="mt-6">
          <Link to="/login">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  if (loading) {
    return (
      <AppLayout>
        <LoadingState message="Loading notifications..." />
      </AppLayout>
    );
  }

  if (error && notifications.length === 0) {
    return (
      <AppLayout>
        <PageHeader
          title="Notifications"
          subtitle="Track booking updates, payment alerts and backend notification delivery status."
        />

        <ErrorState title="Could not load notifications" message={error} />

        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => loadNotifications()}>Retry</Button>

          <Link to="/events">
            <Button variant="secondary">Explore Events</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Notifications"
        subtitle="Track booking updates, payment alerts and backend notification delivery status."
        action={
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={() => loadNotifications({ silent: true })}
              disabled={refreshing || retryingFailed || Boolean(actionLoadingId)}
            >
              <RefreshCw size={18} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>

            <Button
              variant="secondary"
              onClick={handleRetryFailed}
              disabled={
                retryingFailed ||
                stats.failed === 0 ||
                refreshing ||
                Boolean(actionLoadingId)
              }
            >
              <RotateCcw size={18} />
              {retryingFailed ? "Retrying..." : "Retry Failed"}
            </Button>
          </div>
        }
      />

      <div className="mb-8 grid gap-6 md:grid-cols-4">
        <StatCard
          icon={<Bell size={26} />}
          label="Total"
          value={stats.total}
          helper="All notifications"
          tone="indigo"
        />

        <StatCard
          icon={<Clock size={26} />}
          label="Pending"
          value={stats.pending}
          helper="Waiting delivery"
          tone="orange"
        />

        <StatCard
          icon={<CheckCircle2 size={26} />}
          label="Sent"
          value={stats.sent}
          helper="Delivered"
          tone="green"
        />

        <StatCard
          icon={<TriangleAlert size={26} />}
          label="Failed"
          value={stats.failed}
          helper="Needs retry"
          tone="orange"
        />
      </div>

      <Card className="mb-8 p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font800 text-[#0b1533]">
              Notification Center
            </h2>
            <p className="mt-1 text-sm font600 text-[#66708a]">
              Filter notifications by payment meaning or delivery status.
            </p>
          </div>

          <CustomSelect
            value={statusFilter}
            options={statusOptions}
            onChange={setStatusFilter}
            className="w-full md:w-64"
          />
        </div>
      </Card>

      {success ? (
        <div className="mb-6 rounded-2xl bg-emerald-50 px-5 py-4 text-sm font700 text-emerald-600">
          {success}
        </div>
      ) : null}

      {error ? (
        <div className="mb-6 rounded-2xl bg-red-50 px-5 py-4 text-sm font700 text-red-600">
          {error}
        </div>
      ) : null}

      {filteredNotifications.length === 0 ? (
        <EmptyState
          title="No notifications found"
          message={
            statusFilter === "All"
              ? "You do not have any notifications yet."
              : "There are no notifications matching this filter yet."
          }
        />
      ) : (
        <div className="space-y-5">
          {filteredNotifications.map((notification) => {
            const status = normalizeStatus(notification.status);
            const meaningStatus = getNotificationMeaning(notification);

            const isPending = status === "PENDING";
            const isFailed = status === "FAILED";

            const bookingId = extractBookingIdFromNotification(notification);
            const showBookingAction =
              isPaymentNotification(notification) && bookingId;

            return (
              <Card key={notification.id} className="overflow-hidden">
                <div className="grid gap-0 lg:grid-cols-[1fr_280px]">
                  <div className="p-6">
                    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                      <div className="flex gap-4">
                        <div
                          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${getStatusTone(
                            meaningStatus
                          )}`}
                        >
                          {getStatusIcon(meaningStatus)}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-xl font800 tracking-[-0.03em] text-[#0b1533]">
                              {getNotificationTitle(notification)}
                            </h3>

                            <Badge color={getStatusColor(meaningStatus)}>
                              {meaningStatus === "SUCCESS"
                                ? "SUCCESS"
                                : meaningStatus || "UNKNOWN"}
                            </Badge>

                            {meaningStatus !== status ? (
                              <Badge color={getStatusColor(status)}>
                                DELIVERY: {status}
                              </Badge>
                            ) : null}
                          </div>

                          <p className="mt-3 text-sm font600 leading-7 text-[#66708a]">
                            {getNotificationMessage(notification)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                      <NotificationMeta
                        icon={<CalendarDays size={18} />}
                        label="Created"
                        value={formatDateTime(notification.createdAt)}
                      />

                      <NotificationMeta
                        icon={<Send size={18} />}
                        label="Sent At"
                        value={formatDateTime(notification.sentAt)}
                      />

                      <NotificationMeta
                        icon={<UserRound size={18} />}
                        label="Recipient"
                        value={notification.recipient || "N/A"}
                      />
                    </div>

                    {notification.errorMessage ? (
                      <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3">
                        <p className="text-xs font800 uppercase tracking-wide text-red-500">
                          Error
                        </p>
                        <p className="mt-1 text-sm font700 leading-6 text-red-600">
                          {notification.errorMessage}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  <div className="border-t border-[#e6eaf2] bg-slate-50 p-6 lg:border-l lg:border-t-0">
                    <div className="space-y-4">
                      <MiniInfo
                        label="Notification ID"
                        value={notification.id}
                      />

                      <MiniInfo
                        label="Type"
                        value={notification.notificationType || "IN_APP"}
                      />

                      <MiniInfo
                        label="Event ID"
                        value={notification.eventId || "N/A"}
                      />

                      <MiniInfo
                        label="Retry Count"
                        value={notification.retryCount ?? 0}
                      />
                    </div>

                    <div className="mt-6 flex flex-col gap-3">
                      {showBookingAction ? (
                        <Link to={`/bookings/${bookingId}`}>
                          <Button className="w-full">View Booking</Button>
                        </Link>
                      ) : null}

                      {notification.eventId ? (
                        <Link to={`/events/${notification.eventId}`}>
                          <Button variant="secondary" className="w-full">
                            View Event
                          </Button>
                        </Link>
                      ) : null}

                      {isPending ? (
                        <Button
                          className="w-full"
                          onClick={() => handleMarkAsSent(notification.id)}
                          disabled={
                            actionLoadingId === notification.id ||
                            retryingFailed ||
                            refreshing
                          }
                        >
                          <Mail size={17} />
                          {actionLoadingId === notification.id
                            ? "Marking..."
                            : "Mark as Sent"}
                        </Button>
                      ) : null}

                      {isFailed ? (
                        <Button
                          variant="secondary"
                          className="w-full"
                          onClick={handleRetryFailed}
                          disabled={
                            retryingFailed ||
                            refreshing ||
                            Boolean(actionLoadingId)
                          }
                        >
                          <RotateCcw size={17} />
                          {retryingFailed ? "Retrying..." : "Retry Failed"}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}

function NotificationMeta({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-[#e6eaf2] bg-white p-4">
      <div className="flex items-center gap-2 text-[#0ea5a4]">
        {icon}
        <p className="text-xs font800 uppercase tracking-wide text-[#66708a]">
          {label}
        </p>
      </div>

      <p className="mt-2 break-words text-sm font800 text-[#0b1533]">
        {value}
      </p>
    </div>
  );
}

function MiniInfo({ label, value }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3">
      <p className="text-xs font800 uppercase tracking-wide text-[#66708a]">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font800 text-[#0b1533]">
        {value}
      </p>
    </div>
  );
}