import apiClient from "./client";

// export async function getUserNotifications(userId, page = 0, size = 50) {
//   const response = await apiClient.get(`/api/notifications/user/${userId}`, {
//     params: {
//       page,
//       size,
//       sortBy: "createdAt",
//       direction: "DESC",
//     },
//   });

//   return response.data;
// }

export async function getUserNotifications(userId, page = 0, size = 50) {
  const url = `/api/notifications/user/${userId}`;

  console.log("NOTIFICATION REQUEST:", {
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
    url,
    userId,
  });

  const response = await apiClient.get(url, {
    params: {
      page,
      size,
      sortBy: "createdAt",
      direction: "DESC",
    },
  });

  console.log("NOTIFICATION RESPONSE:", response.data);

  return response.data;
}



export async function getUnreadNotifications(userId, page = 0, size = 50) {
  const response = await apiClient.get(
    `/api/notifications/user/${userId}/unread`,
    {
      params: {
        page,
        size,
      },
    }
  );

  return response.data;
}

export async function getNotificationById(notificationId) {
  const response = await apiClient.get(`/api/notifications/${notificationId}`);
  return response.data;
}

export async function markNotificationAsSent(notificationId) {
  const response = await apiClient.put(
    `/api/notifications/${notificationId}/mark-sent`
  );

  return response.data;
}

export async function markNotificationAsFailed(notificationId, errorMessage) {
  const response = await apiClient.put(
    `/api/notifications/${notificationId}/mark-failed`,
    null,
    {
      params: {
        errorMessage,
      },
    }
  );

  return response.data;
}

export async function retryFailedNotifications() {
  const response = await apiClient.post("/api/notifications/retry-failed");
  return response.data;
}
