import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  CreditCard,
  IndianRupee,
  Landmark,
  MapPin,
  ShieldCheck,
  Smartphone,
  Wallet,
} from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import ErrorState from "../components/ui/ErrorState";
import { failPayment, initiatePayment, verifyPayment } from "../api/paymentApi";

function unwrapData(response) {
  return response?.data ?? response;
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
  if (!value) return "Date TBA";

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

const paymentMethods = [
  {
    value: "UPI",
    label: "UPI",
    icon: <Smartphone size={20} />,
  },
  {
    value: "CARD",
    label: "Card",
    icon: <CreditCard size={20} />,
  },
  {
    value: "NETBANKING",
    label: "Netbanking",
    icon: <Landmark size={20} />,
  },
  {
    value: "WALLET",
    label: "Wallet",
    icon: <Wallet size={20} />,
  },
];

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state || {};
  const event = state.event;
  const ticketTier = state.ticketTier;
  const booking = state.booking;
  const quantity = state.quantity || 1;
  const totalAmount =
    state.totalAmount || Number(ticketTier?.price || 0) * quantity;

  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successLoading, setSuccessLoading] = useState(false);
  const [failLoading, setFailLoading] = useState(false);
  const [error, setError] = useState("");
  const [finalStatus, setFinalStatus] = useState("");

  if (!event || !ticketTier || !booking?.id) {
    return (
      <AppLayout>
        <ErrorState
          title="Payment data missing"
          message="Please create a booking before initiating payment."
        />

        <div className="mt-6">
          <Link to="/events">
            <Button>Back to Events</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const eventTitle = event.name || event.title || "Untitled Event";
  const locationText = event.location || event.venueName || "Venue details";
  const startTime = formatDateTime(event.startTime);
  const actionInProgress = loading || successLoading || failLoading;
  const paymentFinalized = Boolean(finalStatus);

  const getOrderId = () => {
    return (
      payment?.gatewayTxnId ||
      payment?.gatewayOrderId ||
      payment?.orderId ||
      payment?.razorpayOrderId
    );
  };

  const handleInitiatePayment = async () => {
    if (loading || payment || paymentFinalized) return;

    try {
      setLoading(true);
      setError("");
      setFinalStatus("");

      const response = await initiatePayment({
        bookingId: booking.id,
        paymentMethod,
      });

      const paymentData = unwrapData(response);

      if (!paymentData?.id) {
        throw new Error("Payment ID not found in response");
      }

      setPayment(paymentData);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Could not initiate payment"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateSuccess = async () => {
    if (successLoading || failLoading || paymentFinalized) return;

    const orderId = getOrderId();

    if (!orderId) {
      setError("Order ID not found in payment response");
      return;
    }

    try {
      setSuccessLoading(true);
      setError("");

      const response = await verifyPayment({
        orderId,
        paymentId: `pay_test_${Date.now()}`,
        signature: "test_signature",
      });

      const updatedPayment = unwrapData(response);
      setPayment(updatedPayment);
      setFinalStatus("SUCCESS");

      setTimeout(() => {
        navigate("/payment-result", {
          state: {
            event,
            ticketTier,
            quantity,
            totalAmount,
            booking,
            payment: updatedPayment,
            status: "SUCCESS",
          },
        });
      }, 700);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Could not verify payment"
      );
    } finally {
      setSuccessLoading(false);
    }
  };

  const handleSimulateFailure = async () => {
    if (successLoading || failLoading || paymentFinalized) return;

    const orderId = getOrderId();

    if (!orderId) {
      setError("Order ID not found in payment response");
      return;
    }

    try {
      setFailLoading(true);
      setError("");

      const response = await failPayment(
        orderId,
        "Payment failed from frontend demo"
      );

      const updatedPayment = unwrapData(response);
      setPayment(updatedPayment);
      setFinalStatus("FAILED");

      setTimeout(() => {
        navigate("/payment-result", {
          state: {
            event,
            ticketTier,
            quantity,
            totalAmount,
            booking,
            payment: updatedPayment,
            status: "FAILED",
          },
        });
      }, 700);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Could not fail payment"
      );
    } finally {
      setFailLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex items-center justify-center gap-4">
          <Step done label="Tickets" number="1" />
          <div className="h-px w-28 bg-[#0ea5a4]" />
          <Step done label="Reserve Lock" number="2" />
          <div className="h-px w-28 bg-[#0ea5a4]" />
          <Step done label="Booking Details" number="3" />
          <div className="h-px w-28 bg-[#0ea5a4]" />
          <Step active label="Payment" number="4" />
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <section className="space-y-6">
            <Card className="p-7">
              <Badge color="teal">PAYMENT</Badge>
              <h1 className="mt-4 text-4xl font800 tracking-[-0.04em] text-[#0b1533]">
                Complete your payment
              </h1>
              <p className="mt-3 max-w-2xl text-base font500 leading-8 text-[#66708a]">
                Initiate payment for your booking, then simulate success or
                failure to trigger your Kafka-driven booking status updates.
              </p>
            </Card>

            <Card className="p-7">
              <h2 className="text-2xl font800 tracking-[-0.03em] text-[#0b1533]">
                Payment Method
              </h2>

              <div className="mt-6 grid overflow-hidden rounded-3xl border border-[#e6eaf2] md:grid-cols-4">
                {paymentMethods.map((method) => {
                  const active = method.value === paymentMethod;

                  return (
                    <button
                      key={method.value}
                      type="button"
                      disabled={Boolean(payment) || actionInProgress}
                      onClick={() => setPaymentMethod(method.value)}
                      className={`flex items-center justify-center gap-2 border-b border-[#e6eaf2] px-5 py-4 text-sm font800 transition md:border-b-0 md:border-r last:md:border-r-0 ${
                        active
                          ? "bg-teal-50 text-[#0ea5a4]"
                          : "bg-white text-[#4b587c] hover:bg-slate-50"
                      } disabled:cursor-not-allowed disabled:opacity-70`}
                    >
                      {method.icon}
                      {method.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 rounded-3xl border border-[#e6eaf2] bg-white p-6">
                {!payment ? (
                  <div className="space-y-5">
                    <div className="rounded-3xl bg-slate-50 p-5">
                      <div className="flex gap-4">
                        <ShieldCheck className="text-[#0ea5a4]" />
                        <div>
                          <p className="font800 text-[#0b1533]">
                            Demo payment gateway
                          </p>
                          <p className="mt-1 text-sm font600 leading-6 text-[#66708a]">
                            This calls your payment-service initiate endpoint.
                            After that, use success/failure buttons to simulate
                            payment callback.
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button
                      type="button"
                      onClick={handleInitiatePayment}
                      disabled={loading || Boolean(payment) || paymentFinalized}
                      className="w-full"
                    >
                      {loading
                        ? "Initiating Payment..."
                        : `Initiate Payment ${formatCurrency(totalAmount)}`}
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div className="rounded-3xl border border-teal-100 bg-teal-50 p-5">
                      <div className="flex gap-4">
                        <CheckCircle2 className="text-[#0ea5a4]" />
                        <div>
                          <p className="font800 text-[#0b1533]">
                            Payment initiated successfully
                          </p>
                          <p className="mt-1 text-sm font600 text-[#66708a]">
                            Payment ID:{" "}
                            <span className="font800 text-[#0b1533]">
                              {payment.id}
                            </span>
                          </p>
                          <p className="mt-1 text-sm font600 text-[#66708a]">
                            Order ID:{" "}
                            <span className="font800 text-[#0b1533]">
                              {getOrderId() || "N/A"}
                            </span>
                          </p>
                          <p className="mt-1 text-sm font600 text-[#66708a]">
                            Status:{" "}
                            <span className="font800 text-[#0ea5a4]">
                              {payment.status}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {finalStatus ? (
                      <div
                        className={`mt-5 rounded-2xl px-4 py-3 text-sm font800 ${
                          finalStatus === "SUCCESS"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        Payment marked as {finalStatus}. Redirecting...
                      </div>
                    ) : null}

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      <Button
                        type="button"
                        onClick={handleSimulateSuccess}
                        disabled={successLoading || failLoading || paymentFinalized}
                      >
                        {successLoading ? "Processing..." : "Simulate Success"}
                      </Button>

                      <Button
                        type="button"
                        variant="danger"
                        onClick={handleSimulateFailure}
                        disabled={successLoading || failLoading || paymentFinalized}
                      >
                        {failLoading ? "Processing..." : "Simulate Failure"}
                      </Button>
                    </div>
                  </div>
                )}

                {error ? (
                  <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font700 text-red-600">
                    {error}
                  </div>
                ) : null}
              </div>
            </Card>
          </section>

          <aside className="space-y-6">
            <Card className="overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-purple-700 via-fuchsia-500 to-cyan-400" />

              <div className="p-6">
                <Badge color="indigo">
                  {String(event.categoryName || "EVENT").toUpperCase()}
                </Badge>

                <h2 className="mt-4 text-2xl font800 leading-8 tracking-[-0.03em] text-[#0b1533]">
                  {eventTitle}
                </h2>

                <div className="mt-5 space-y-3 text-sm font600 text-[#66708a]">
                  <div className="flex gap-3">
                    <CalendarDays size={18} />
                    <span>{startTime}</span>
                  </div>

                  <div className="flex gap-3">
                    <MapPin size={18} />
                    <span>{locationText}</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font800 text-[#0b1533]">Order Summary</h3>

              <div className="mt-6 space-y-4">
                <SummaryRow label="Booking ID" value={booking.id} />
                <SummaryRow label="Ticket Tier" value={ticketTier.name} />
                <SummaryRow label="Quantity" value={quantity} />
                <SummaryRow
                  label="Price"
                  value={formatCurrency(ticketTier.price)}
                />
                <div className="border-t border-[#e6eaf2] pt-4">
                  <SummaryRow
                    label="Total Amount"
                    value={formatCurrency(totalAmount)}
                    strong
                  />
                </div>
              </div>

              <div className="mt-6 rounded-3xl bg-teal-50 p-4">
                <div className="flex gap-3">
                  <IndianRupee className="text-[#0ea5a4]" />
                  <p className="text-sm font700 leading-6 text-[#0b1533]">
                    Payment success should publish Kafka event and confirm the
                    booking automatically.
                  </p>
                </div>
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}

function Step({ label, number, active = false, done = false }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font800 ${
          done
            ? "bg-[#0ea5a4] text-white"
            : active
            ? "bg-[#0ea5a4] text-white"
            : "border border-[#cfd7e6] bg-white text-[#66708a]"
        }`}
      >
        {done ? <CheckCircle2 size={20} /> : number}
      </div>
      <span
        className={`hidden text-sm font800 md:inline ${
          active ? "text-[#0b1533]" : "text-[#66708a]"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function SummaryRow({ label, value, strong = false }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font600 text-[#66708a]">{label}</span>
      <span
        className={
          strong
            ? "text-2xl font800 text-[#0ea5a4]"
            : "text-right text-sm font800 text-[#0b1533]"
        }
      >
        {value}
      </span>
    </div>
  );
}