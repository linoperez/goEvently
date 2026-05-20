import apiClient from "./client";

export async function createLock(payload) {
  const response = await apiClient.post("/api/locks", payload);
  return response.data;
}

export async function getLock(lockId) {
  const response = await apiClient.get(`/api/locks/${lockId}`);
  return response.data;
}

export async function releaseLock(lockId) {
  const response = await apiClient.delete(`/api/locks/${lockId}`);
  return response.data;
}

export async function createBooking(payload) {
  const response = await apiClient.post("/api/bookings", payload);
  return response.data;
}

export async function getBookingById(bookingId) {
  const response = await apiClient.get(`/api/bookings/${bookingId}`);
  return response.data;
}

export async function getUserBookings(userId, page = 0, size = 20) {
  const response = await apiClient.get(`/api/bookings/user/${userId}`, {
    params: { page, size },
  });

  return response.data;
}

export async function getLockById(lockId) {
  const response = await apiClient.get(`/api/locks/${lockId}`);
  return response.data;
}

export async function getEventBookings(eventId, params = {}) {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      return value !== undefined && value !== null && value !== "";
    })
  );

  const response = await apiClient.get(`/api/bookings/event/${eventId}`, {
    params: cleanParams,
  });

  return response.data;
}