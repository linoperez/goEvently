import apiClient from "./client";

export async function getEvents(params = {}) {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      return value !== undefined && value !== null && value !== "";
    })
  );

  const response = await apiClient.get("/api/events", {
    params: cleanParams,
  });

  return response.data;
}

export async function getEventById(eventId) {
  const response = await apiClient.get(`/api/events/${eventId}`);
  return response.data;
}

export async function getTicketTiersByEvent(eventId) {
  const response = await apiClient.get(`/api/ticket-tiers/event/${eventId}`);
  return response.data;
}

export async function getTicketTiersForEvents(events = []) {
  const results = await Promise.allSettled(
    events.map((event) => getTicketTiersByEvent(event.id))
  );

  return results.map((result, index) => {
    if (result.status !== "fulfilled") {
      return {
        eventId: events[index].id,
        tiers: [],
      };
    }

    const response = result.value;
    const tiers = response?.data ?? response;

    return {
      eventId: events[index].id,
      tiers: Array.isArray(tiers) ? tiers : [],
    };
  });
}

export async function createEvent(payload) {
  const response = await apiClient.post("/api/events", payload);
  return response.data;
}

export async function createTicketTier(payload) {
  const response = await apiClient.post("/api/ticket-tiers", payload);
  return response.data;
}

export async function updateTicketTier(tierId, payload) {
  const response = await apiClient.put(`/api/ticket-tiers/${tierId}`, payload);
  return response.data;
}

export async function deleteTicketTier(tierId) {
  const response = await apiClient.delete(`/api/ticket-tiers/${tierId}`);
  return response.data;
}

export async function getCategories() {
  const response = await apiClient.get("/api/categories");
  return response.data;
}

export async function createCategory(payload) {
  const response = await apiClient.post("/api/categories", payload);
  return response.data;
}

export async function getVenues() {
  const response = await apiClient.get("/api/venues");
  return response.data;
}



export async function createVenue(payload) {
  const response = await apiClient.post("/api/venues", payload);
  return response.data;
}

export async function updateEvent(eventId, payload) {
  const response = await apiClient.put(`/api/events/${eventId}`, payload);
  return response.data;
}

export async function searchEvents(keyword) {
  const response = await apiClient.get("/api/events/search", {
    params: {
      keyword,
    },
  });

  return response.data;
}

export async function filterEvents(params = {}) {
  const cleanedParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      return value !== "" && value !== null && value !== undefined;
    })
  );

  const response = await apiClient.get("/api/events/filter", {
    params: cleanedParams,
  });

  return response.data;
}

export async function updateVenue(venueId, payload) {
  const response = await apiClient.put(`/api/venues/${venueId}`, payload);
  return response.data;
}

export async function deleteVenue(venueId) {
  const response = await apiClient.delete(`/api/venues/${venueId}`);
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



