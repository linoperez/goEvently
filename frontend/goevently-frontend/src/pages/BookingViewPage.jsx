import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import QRCodePackage from "react-qr-code";
import { toPng } from "html-to-image";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileText,
  Hash,
  IndianRupee,
  Lock,
  MapPin,
  Share2,
  Copy,
  Check,
  Ticket,
  XCircle,
} from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import PageHeader from "../components/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import LoadingState from "../components/ui/LoadingState";
import ErrorState from "../components/ui/ErrorState";
import { getBookingById } from "../api/bookingApi";
import { getEventById, getTicketTiersByEvent } from "../api/eventsApi";

const QRCode = QRCodePackage?.default || QRCodePackage;

function unwrapData(response) {
  return response?.data ?? response;
}

function normalizeStatus(status) {
  return String(status || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

function getStatusColor(status) {
  const normalized = normalizeStatus(status);

  if (normalized === "CONFIRMED") return "green";
  if (normalized === "PENDING_PAYMENT") return "orange";
  if (normalized === "PENDING") return "orange";
  if (normalized === "FAILED") return "red";
  if (normalized === "EXPIRED") return "gray";
  if (normalized === "CANCELLED") return "red";

  return "gray";
}

function getStatusIcon(status) {
  const normalized = normalizeStatus(status);

  if (normalized === "CONFIRMED") return <CheckCircle2 size={28} />;
  if (normalized === "FAILED" || normalized === "CANCELLED") {
    return <XCircle size={28} />;
  }
  if (normalized === "EXPIRED") return <Clock size={28} />;

  return <Clock size={28} />;
}

function getStatusTone(status) {
  const normalized = normalizeStatus(status);

  if (normalized === "CONFIRMED") return "bg-emerald-50 text-emerald-600";
  if (normalized === "FAILED" || normalized === "CANCELLED") {
    return "bg-red-50 text-red-600";
  }
  if (normalized === "EXPIRED") return "bg-slate-100 text-slate-600";

  return "bg-orange-50 text-orange-600";
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

function formatEventDate(value) {
  if (!value) return "Date TBA";

  try {
    const date = new Date(value);

    const datePart = date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const dayPart = date.toLocaleDateString("en-IN", {
      weekday: "short",
    });

    return `${datePart}, ${dayPart}`;
  } catch {
    return String(value);
  }
}

function formatEventTime(value) {
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

function getAmount(booking) {
  return (
    booking?.totalAmount ||
    booking?.amount ||
    booking?.price ||
    booking?.bookingAmount ||
    0
  );
}

function getBookingEventId(booking) {
  return (
    booking?.eventId ||
    booking?.eventID ||
    booking?.event_id ||
    booking?.event?.id ||
    booking?.event?.eventId ||
    booking?.eventResponse?.id ||
    booking?.eventResponse?.eventId ||
    null
  );
}

function getBookingTicketTierId(booking) {
  return (
    booking?.ticketTierId ||
    booking?.tierId ||
    booking?.ticket_tier_id ||
    booking?.ticketTier?.id ||
    booking?.ticketTier?.ticketTierId ||
    booking?.ticketTierResponse?.id ||
    booking?.ticketTierResponse?.ticketTierId ||
    null
  );
}

function getBookingEventName(booking) {
  return (
    booking?.eventName ||
    booking?.event?.name ||
    booking?.event?.title ||
    booking?.resolvedEventName ||
    `Event #${getBookingEventId(booking) || "N/A"}`
  );
}

function getBookingTierName(booking) {
  return (
    booking?.ticketTierName ||
    booking?.tierName ||
    booking?.ticketTier?.name ||
    booking?.resolvedTicketTierName ||
    `Tier #${getBookingTicketTierId(booking) || "N/A"}`
  );
}

function getTicketCode(booking) {
  const eventId = getBookingEventId(booking);
  return `GEV-${booking?.id || "000"}-${eventId || "EVT"}`;
}

function buildTicketQrValue(booking) {
  const eventId = getBookingEventId(booking);
  const ticketTierId = getBookingTicketTierId(booking);

  const params = new URLSearchParams({
    bookingId: String(booking?.id || ""),
    eventId: String(eventId || ""),
    ticketTierId: String(ticketTierId || ""),
    quantity: String(booking?.quantity || booking?.seats || 1),
    status: String(booking?.status || ""),
    paymentId: String(booking?.paymentId || ""),
    ticketCode: getTicketCode(booking),
    eventName: getBookingEventName(booking),
    ticketTierName: getBookingTierName(booking),
    location: booking?.resolvedEventLocation || "",
    eventDate: booking?.resolvedEventStartTime || "",
  });

  const frontendBaseUrl =
    import.meta.env.VITE_FRONTEND_PUBLIC_URL || window.location.origin;

  return `${frontendBaseUrl}/ticket/scan?${params.toString()}`;
}

function sanitizeFileName(value) {
  return String(value || "ticket")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();
}

async function enrichBookingWithEventDetails(booking) {
  const eventId = getBookingEventId(booking);
  const ticketTierId = getBookingTicketTierId(booking);

  if (!eventId) {
    return {
      ...booking,
      resolvedEventName: booking?.eventName || "Event unavailable",
      resolvedTicketTierName:
        booking?.ticketTierName || booking?.tierName || "Ticket unavailable",
    };
  }

  let resolvedEventName = "";
  let resolvedEventLocation = "";
  let resolvedEventStartTime = "";
  let resolvedEventEndTime = "";
  let resolvedCategoryName = "";
  let resolvedVenueName = "";
  let resolvedOrganizerUsername = "";
  let resolvedTicketTierName = "";

  try {
    const eventResponse = await getEventById(eventId);
    const eventData = unwrapData(eventResponse);

    resolvedEventName =
      eventData?.name || eventData?.title || `Event #${eventId}`;

    resolvedEventLocation = eventData?.location || eventData?.venueName || "";
    resolvedEventStartTime = eventData?.startTime || "";
    resolvedEventEndTime = eventData?.endTime || "";
    resolvedCategoryName = eventData?.categoryName || "";
    resolvedVenueName = eventData?.venueName || "";
    resolvedOrganizerUsername = eventData?.organizerUsername || "";

    const tierResponse = await getTicketTiersByEvent(eventId);
    const tierData = unwrapData(tierResponse);
    const tiers = Array.isArray(tierData) ? tierData : [];

    const matchedTier = tiers.find(
      (tier) => Number(tier.id) === Number(ticketTierId)
    );

    resolvedTicketTierName =
      matchedTier?.name || `Tier #${ticketTierId || "N/A"}`;
  } catch (err) {
    console.warn("Could not enrich booking details:", booking?.id, err);

    resolvedEventName = `Event #${eventId || "N/A"}`;
    resolvedTicketTierName = `Tier #${ticketTierId || "N/A"}`;
  }

  return {
    ...booking,
    eventId,
    ticketTierId,
    resolvedEventName,
    resolvedEventLocation,
    resolvedEventStartTime,
    resolvedEventEndTime,
    resolvedCategoryName,
    resolvedVenueName,
    resolvedOrganizerUsername,
    resolvedTicketTierName,
  };
}

// function unwrapData(response) {
//   return response?.data ?? response;
// }


export default function BookingViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingTicket, setDownloadingTicket] = useState(false);
  const [copiedTicketLink, setCopiedTicketLink] = useState(false);

  const ticketCardRef = useRef(null);

  useEffect(() => {
    async function loadBooking() {
      try {
        setLoading(true);
        setError("");

        const response = await getBookingById(id);
        const bookingData = unwrapData(response);

        const enrichedBooking = await enrichBookingWithEventDetails(bookingData);

        setBooking(enrichedBooking);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err.message ||
            "Could not load booking details"
        );
      } finally {
        setLoading(false);
      }
    }

    loadBooking();
  }, [id]);

  if (loading) {
    return (
      <AppLayout>
        <LoadingState message="Loading booking details..." />
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <ErrorState title="Could not load booking" message={error} />

        <div className="mt-6">
          <Link to="/bookings">
            <Button>Back to My Bookings</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  if (!booking) {
    return (
      <AppLayout>
        <ErrorState
          title="Booking not found"
          message="The booking you are looking for does not exist."
        />

        <div className="mt-6">
          <Link to="/bookings">
            <Button>Back to My Bookings</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const status = normalizeStatus(booking.status);
  const amount = getAmount(booking);
  const quantity = booking.quantity || booking.seats || 1;
  const createdAt = booking.createdAt || booking.bookingTime;

  const eventId = getBookingEventId(booking);
  const ticketTierId = getBookingTicketTierId(booking);

  const eventName = getBookingEventName(booking);
  const ticketTierName = getBookingTierName(booking);
  const qrValue = buildTicketQrValue(booking);
  const ticketShareLink = qrValue;

  const isPendingPayment = ["PENDING_PAYMENT", "PENDING"].includes(status);
  const isConfirmed = status === "CONFIRMED";

  const handlePayNow = () => {
  navigate("/payment", {
    state: {
      booking,
      event: {
        id: eventId,
        name: eventName,
        location: booking.resolvedEventLocation,
        startTime: booking.resolvedEventStartTime,
      },
      ticketTier: {
        id: ticketTierId,
        name: ticketTierName,
        price: amount,
      },
      quantity,
      totalAmount: amount,
    },
  });
};

  const handleDownloadTicket = async () => {
    if (!ticketCardRef.current) return;

    try {
      setDownloadingTicket(true);

      const dataUrl = await toPng(ticketCardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        filter: (node) => {
          // Avoid capturing browser-only hidden helper elements if any exist later
          return !node.classList?.contains("no-ticket-download");
        },
      });

      const link = document.createElement("a");

      link.href = dataUrl;
      link.download = `goevently-${sanitizeFileName(
        eventName
      )}-${sanitizeFileName(getTicketCode(booking))}.png`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (downloadError) {
      console.error("Failed to download ticket:", downloadError);
      alert("Could not download ticket. Please check console for details.");
    } finally {
      setDownloadingTicket(false);
    }
  };

  const handleShareTicket = async () => {
    try {
      const shareData = {
        title: `${eventName} Ticket`,
        text: `Here is my goEvently ticket for ${eventName}.`,
        url: ticketShareLink,
      };

      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(ticketShareLink);
      setCopiedTicketLink(true);

      setTimeout(() => {
        setCopiedTicketLink(false);
      }, 1800);
    } catch (shareError) {
      if (shareError?.name === "AbortError") {
        return;
      }

      try {
        await navigator.clipboard.writeText(ticketShareLink);
        setCopiedTicketLink(true);

        setTimeout(() => {
          setCopiedTicketLink(false);
        }, 1800);
      } catch (copyError) {
        console.error("Failed to share/copy ticket link:", copyError);
        alert("Could not copy ticket link. Please try again.");
      }
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title={`Booking GEV-${booking.id}`}
        subtitle="Detailed view of your booking, payment reference, event information, ticket tier and current status."
        action={
          <Link to="/bookings">
            <Button variant="secondary">Back to Bookings</Button>
          </Link>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <section className="space-y-8">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-[#061024] via-[#111a3d] to-[#0ea5a4] p-8 text-white">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div>
                  <Badge color={getStatusColor(status)}>{status}</Badge>

                  <h1 className="mt-5 text-4xl font800 tracking-[-0.04em]">
                    {eventName}
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm font600 leading-7 text-white/75">
                    Booking #{booking.id} for {ticketTierName}. This booking was
                    created through the lock-based ticket reservation flow.
                  </p>

                  {booking.resolvedEventLocation ? (
                    <div className="mt-5 flex items-center gap-3 text-sm font700 text-white/85">
                      <MapPin size={19} />
                      <span>{booking.resolvedEventLocation}</span>
                    </div>
                  ) : null}
                </div>

                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-white/15 text-white backdrop-blur">
                  {getStatusIcon(status)}
                </div>
              </div>
            </div>

            <div className="grid gap-0 md:grid-cols-3">
              <SummaryMetric
                icon={<Ticket size={22} />}
                label="Ticket Tier"
                value={ticketTierName}
              />

              <SummaryMetric
                icon={<IndianRupee size={22} />}
                label="Amount"
                value={formatCurrency(amount)}
              />

              <SummaryMetric
                icon={<CalendarDays size={22} />}
                label="Created"
                value={formatDateTime(createdAt)}
              />
            </div>
          </Card>

          <Card className="p-7">
            <h2 className="text-2xl font800 tracking-[-0.03em] text-[#0b1533]">
              Event Information
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <DetailItem
                icon={<Ticket size={20} />}
                label="Event Name"
                value={eventName}
              />

              <DetailItem
                icon={<Hash size={20} />}
                label="Event ID"
                value={eventId || "N/A"}
              />

              <DetailItem
                icon={<Ticket size={20} />}
                label="Ticket Tier"
                value={ticketTierName}
              />

              <DetailItem
                icon={<Hash size={20} />}
                label="Ticket Tier ID"
                value={ticketTierId || "N/A"}
              />

              <DetailItem
                icon={<MapPin size={20} />}
                label="Location"
                value={booking.resolvedEventLocation || "N/A"}
              />

              <DetailItem
                icon={<CalendarDays size={20} />}
                label="Event Date"
                value={formatEventDate(booking.resolvedEventStartTime)}
              />

              <DetailItem
                icon={<Clock size={20} />}
                label="Event Time"
                value={formatEventTime(booking.resolvedEventStartTime)}
              />

              <DetailItem
                icon={<FileText size={20} />}
                label="Category"
                value={booking.resolvedCategoryName || "N/A"}
              />
            </div>
          </Card>

          <Card className="p-7">
            <h2 className="text-2xl font800 tracking-[-0.03em] text-[#0b1533]">
              Booking Information
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <DetailItem
                icon={<Hash size={20} />}
                label="Booking ID"
                value={booking.id}
              />

              <DetailItem
                icon={<Ticket size={20} />}
                label="Quantity"
                value={quantity}
              />

              <DetailItem
                icon={<IndianRupee size={20} />}
                label="Total Amount"
                value={formatCurrency(amount)}
              />

              <DetailItem
                icon={<CalendarDays size={20} />}
                label="Created At"
                value={formatDateTime(createdAt)}
              />

              <DetailItem
                icon={<FileText size={20} />}
                label="Organizer"
                value={booking.resolvedOrganizerUsername || "N/A"}
              />

              <DetailItem
                icon={<FileText size={20} />}
                label="Venue"
                value={booking.resolvedVenueName || "N/A"}
              />
            </div>
          </Card>

          <Card className="p-7">
            <h2 className="text-2xl font800 tracking-[-0.03em] text-[#0b1533]">
              Payment & Lock References
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <DetailItem
                icon={<CreditCard size={20} />}
                label="Payment ID"
                value={booking.paymentId || "Not available"}
              />

              <DetailItem
                icon={<Lock size={20} />}
                label="Lock ID"
                value={booking.lockId || "Not available"}
                mono
              />

              <DetailItem
                icon={<FileText size={20} />}
                label="Currency"
                value={booking.currency || "INR"}
              />

              <DetailItem
                icon={<Clock size={20} />}
                label="Updated At"
                value={formatDateTime(booking.updatedAt)}
              />
            </div>
          </Card>

          {isConfirmed ? (
            <div ref={ticketCardRef}>
              <Card className="overflow-hidden bg-white">
                <div className="grid lg:grid-cols-[1fr_260px]">
                  <div className="relative overflow-hidden bg-gradient-to-br from-[#061024] via-[#111a3d] to-[#0ea5a4] p-8 text-white">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.18),transparent_26%),radial-gradient(circle_at_20%_80%,rgba(79,70,229,0.28),transparent_30%)]" />

                    <div className="relative z-10">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font800 uppercase tracking-[0.22em] text-white/60">
                            goEvently Ticket
                          </p>

                          <h2 className="mt-3 text-3xl font800 tracking-[-0.04em]">
                            {eventName}
                          </h2>
                        </div>

                        <Badge color="green">CONFIRMED</Badge>
                      </div>

                      <div className="mt-8 grid gap-5 sm:grid-cols-2">
                        <TicketInfo
                          label="Ticket Type"
                          value={ticketTierName}
                          dark
                        />
                        <TicketInfo label="Quantity" value={quantity} dark />
                        <TicketInfo
                          label="Event Date"
                          value={formatEventDate(booking.resolvedEventStartTime)}
                          dark
                        />
                        <TicketInfo
                          label="Event Time"
                          value={formatEventTime(booking.resolvedEventStartTime)}
                          dark
                        />
                      </div>

                      <div className="mt-8 flex items-start gap-3 rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur">
                        <MapPin
                          size={21}
                          className="mt-0.5 shrink-0 text-white/80"
                        />
                        <div>
                          <p className="text-xs font800 uppercase tracking-wide text-white/55">
                            Venue
                          </p>
                          <p className="mt-1 text-sm font700 leading-6 text-white/90">
                            {booking.resolvedEventLocation ||
                              "Venue details unavailable"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative flex flex-col items-center justify-between border-t border-dashed border-[#cfd7e6] bg-white p-7 lg:border-l lg:border-t-0">
                    <div className="absolute -left-4 top-1/2 hidden h-8 w-8 -translate-y-1/2 rounded-full bg-[#f8fafc] lg:block" />
                    <div className="absolute -right-4 top-1/2 hidden h-8 w-8 -translate-y-1/2 rounded-full bg-[#f8fafc] lg:block" />

                    <div className="text-center">
                      <p className="text-xs font800 uppercase tracking-[0.18em] text-[#66708a]">
                        Booking Pass
                      </p>

                      <div className="mx-auto mt-5 rounded-3xl border border-[#e6eaf2] bg-white p-4 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
                        <QRCode
                          value={qrValue}
                          size={144}
                          bgColor="#FFFFFF"
                          fgColor="#0b1533"
                          level="M"
                        />
                      </div>

                      <p className="mt-5 font-mono text-sm font800 text-[#0b1533]">
                        {getTicketCode(booking)}
                      </p>

                      <p className="mt-2 text-xs font600 leading-5 text-[#66708a]">
                        Scan this QR to view booking, event and ticket details.
                      </p>
                    </div>

                    <div className="mt-6 w-full space-y-3">
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs font700 text-[#66708a]">
                          Amount Paid
                        </p>
                        <p className="mt-1 text-lg font800 text-[#0ea5a4]">
                          {formatCurrency(amount)}
                        </p>
                      </div>

                      {String(booking?.status || "").toUpperCase() === "CONFIRMED" ? (
                        <div className="no-ticket-download space-y-3">
                          <button
                            type="button"
                            onClick={handleDownloadTicket}
                            disabled={downloadingTicket}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0ea5a4] to-[#4f46e5] px-5 py-3 text-sm font700 text-white shadow-lg shadow-cyan-500/20 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Download size={16} />
                            {downloadingTicket ? "Downloading..." : "Download Ticket"}
                          </button>

                          <button
                            type="button"
                            onClick={handleShareTicket}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#dbe3f0] bg-white px-5 py-3 text-sm font800 text-[#0b1533] transition hover:border-[#0ea5a4] hover:text-[#0ea5a4]"
                          >
                            {copiedTicketLink ? (
                              <>
                                <Check size={16} />
                                Link Copied
                              </>
                            ) : navigator.share ? (
                              <>
                                <Share2 size={16} />
                                Share Ticket
                              </>
                            ) : (
                              <>
                                <Copy size={16} />
                                Copy Ticket Link
                              </>
                            )}
                          </button>
                        </div>
                      ) : null}
                      
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ) : null}
        </section>

        <aside className="space-y-6">
          <Card className="p-6">
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-3xl ${getStatusTone(
                status
              )}`}
            >
              {getStatusIcon(status)}
            </div>

            <h2 className="mt-5 text-2xl font800 tracking-[-0.03em] text-[#0b1533]">
              {status}
            </h2>

            <p className="mt-3 text-sm font600 leading-7 text-[#66708a]">
              {isConfirmed
                ? "This booking is confirmed after successful payment."
                : isPendingPayment
                ? "This booking is waiting for payment completion."
                : status === "FAILED"
                ? "This booking failed because payment was not successful."
                : status === "EXPIRED"
                ? "This booking expired because payment was not completed in time."
                : "Current booking status from backend."}
            </p>

            <div className="mt-6 flex flex-col gap-3">
              {isPendingPayment ? (
                <Button className="w-full" onClick={handlePayNow}>
                  Pay Now
                </Button>
              ) : null}

              {eventId ? (
                <Link to={`/events/${eventId}`}>
                  <Button variant="secondary" className="w-full">
                    View Event
                  </Button>
                </Link>
              ) : (
                <Button variant="secondary" className="w-full" disabled>
                  Event Unavailable
                </Button>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font800 text-[#0b1533]">Order Summary</h3>

            <div className="mt-6 space-y-4">
              <InfoRow label="Booking" value={`GEV-${booking.id}`} />
              <InfoRow label="Event" value={eventName} />
              <InfoRow label="Ticket" value={ticketTierName} />
              <InfoRow label="Status" value={status} />
              <InfoRow label="Quantity" value={quantity} />

              <div className="border-t border-[#e6eaf2] pt-4">
                <InfoRow label="Total" value={formatCurrency(amount)} strong />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="rounded-3xl bg-gradient-to-br from-teal-50 to-indigo-50 p-6">
              <div className="w-fit rounded-2xl bg-white p-4 text-[#0ea5a4]">
                <Lock size={26} />
              </div>

              <h3 className="mt-5 text-xl font800 text-[#0b1533]">
                Backend Flow
              </h3>

              <p className="mt-3 text-sm font600 leading-7 text-[#66708a]">
                Booking status is updated by payment events and Kafka consumers,
                while locks protect temporary ticket inventory.
              </p>
            </div>
          </Card>
        </aside>
      </div>
    </AppLayout>
  );
}

function SummaryMetric({ icon, label, value }) {
  return (
    <div className="border-b border-[#e6eaf2] bg-white p-6 md:border-b-0 md:border-r last:md:border-r-0">
      <div className="flex items-center gap-3 text-[#0ea5a4]">
        {icon}
        <p className="text-xs font800 uppercase tracking-wide text-[#66708a]">
          {label}
        </p>
      </div>

      <p className="mt-3 break-words text-lg font800 text-[#0b1533]">
        {value}
      </p>
    </div>
  );
}

function DetailItem({ icon, label, value, mono = false }) {
  return (
    <div className="rounded-3xl border border-[#e6eaf2] bg-white p-5">
      <div className="flex items-center gap-3 text-[#0ea5a4]">
        {icon}
        <p className="text-xs font800 uppercase tracking-wide text-[#66708a]">
          {label}
        </p>
      </div>

      <p
        className={`mt-3 break-words text-sm font800 text-[#0b1533] ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function InfoRow({ label, value, strong = false }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font600 text-[#66708a]">{label}</span>
      <span
        className={
          strong
            ? "text-2xl font800 text-[#0ea5a4]"
            : "max-w-44 break-words text-right text-sm font800 text-[#0b1533]"
        }
      >
        {value}
      </span>
    </div>
  );
}

function TicketInfo({ label, value, dark = false }) {
  return (
    <div
      className={
        dark
          ? "rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur"
          : "rounded-3xl border border-[#e6eaf2] bg-white p-5"
      }
    >
      <p
        className={
          dark
            ? "text-xs font800 uppercase tracking-wide text-white/55"
            : "text-xs font800 uppercase tracking-wide text-[#66708a]"
        }
      >
        {label}
      </p>

      <p
        className={
          dark
            ? "mt-2 break-words text-sm font800 text-white"
            : "mt-2 break-words text-sm font800 text-[#0b1533]"
        }
      >
        {value || "N/A"}
      </p>
    </div>
  );
}