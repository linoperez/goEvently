import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import EventsPage from "./pages/EventsPage";
import EventDetailsPage from "./pages/EventDetailsPage";
import CheckoutPage from "./pages/CheckoutPage";
import BookingDetailsPage from "./pages/BookingDetailsPage";
import PaymentPage from "./pages/PaymentPage";
import PaymentResultPage from "./pages/PaymentResultPage";
import MyBookingsPage from "./pages/MyBookingsPage";
import NotificationsPage from "./pages/NotificationsPage";
import OrganizerDashboardPage from "./pages/OrganizerDashboardPage";
import CreateEventPage from "./pages/CreateEventPage";
import NotFoundPage from "./pages/NotFoundPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import BookingViewPage from "./pages/BookingViewPage";
import EditEventPage from "./pages/EditEventPage";
import TicketScanPage from "./pages/TicketScanPage";
import EventTicketTiersPage from "./pages/EventTicketTiersPage";
import VenuesPage from "./pages/VenuesPage";
import EventBookingsPage from "./pages/EventBookingsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:id" element={<EventDetailsPage />} />

        {/* Logged-in user routes */}
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/booking-details"
          element={
            <ProtectedRoute>
              <BookingDetailsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/payment"
          element={
            <ProtectedRoute>
              <PaymentPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/payment-result"
          element={
            <ProtectedRoute>
              <PaymentResultPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <MyBookingsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/bookings/:id"
          element={
            <ProtectedRoute>
              <BookingViewPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />

        {/* Organizer/Admin routes */}
        <Route
          path="/organizer"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "ORGANIZER"]}>
              <OrganizerDashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/organizer/events/create"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "ORGANIZER"]}>
              <CreateEventPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/organizer/events/:id/edit"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "ORGANIZER"]}>
              <EditEventPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/organizer/events/:id/tickets"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "ORGANIZER"]}>
              <EventTicketTiersPage />
            </ProtectedRoute>
          }
        />

        {/* Admin-only routes */}
        <Route
          path="/organizer/events/:id/bookings"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <EventBookingsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/venues"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <VenuesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/ticket/scan"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "ORGANIZER"]}>
              <TicketScanPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}