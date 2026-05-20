import apiClient from "./client";

export async function initiatePayment(payload) {
  const response = await apiClient.post("/api/payments", payload);
  return response.data;
}

export async function verifyPayment(payload) {
  const response = await apiClient.post("/api/payments/verify", payload);
  return response.data;
}

export async function failPayment(orderId, reason = "Payment failed from frontend demo") {
  const response = await apiClient.post(
    `/api/payments/${orderId}/failed`,
    null,
    {
      params: { reason },
    }
  );

  return response.data;
}

export async function getPaymentByBookingId(bookingId) {
  const response = await apiClient.get(`/api/payments/booking/${bookingId}`);
  return response.data;
}