import { Link, useLocation } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return "₹0";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export default function PaymentResultPage() {
  const { state } = useLocation();

  const status = state?.status || "UNKNOWN";
  const success = status === "SUCCESS";

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl">
        <Card className="p-10 text-center">
          <div
            className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
              success ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
            }`}
          >
            {success ? <CheckCircle2 size={42} /> : <XCircle size={42} />}
          </div>

          <h1 className="mt-6 text-4xl font800 tracking-[-0.04em] text-[#0b1533]">
            {success ? "Payment Successful" : "Payment Failed"}
          </h1>

          <p className="mt-3 text-base font600 leading-7 text-[#66708a]">
            {success
              ? "Your payment was processed. Booking confirmation should be handled by the backend Kafka flow."
              : "Your payment was failed. Inventory should be restored by the backend failure flow."}
          </p>

          <div className="mt-8 rounded-3xl bg-slate-50 p-6 text-left">
            <InfoRow label="Booking ID" value={state?.booking?.id || "N/A"} />
            <InfoRow label="Payment ID" value={state?.payment?.id || "N/A"} />
            <InfoRow label="Amount" value={formatCurrency(state?.totalAmount)} />
            <InfoRow label="Status" value={status} />
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/bookings">
              <Button>View My Bookings</Button>
            </Link>

            <Link to="/events">
              <Button variant="secondary">Explore Events</Button>
            </Link>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-[#e6eaf2] py-3 last:border-b-0">
      <span className="text-sm font700 text-[#66708a]">{label}</span>
      <span className="text-right text-sm font800 text-[#0b1533]">{value}</span>
    </div>
  );
}