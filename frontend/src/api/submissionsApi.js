import {
  API_BASE_URL,
  http,
  tokenStore,
} from "./client";

export const submissionsApi = {
  getAll: (params = {}) =>
    http.get("/submissions", {
      params,
    }),

  getById: (id) =>
    http.get(
      `/submissions/${encodeURIComponent(id)}`
    ),

  create: (body) =>
    http.post(
      "/submissions",
      body
    ),

  update: (id, body) => {
    if (
      typeof FormData !== "undefined" &&
      body instanceof FormData
    ) {
      body.append(
        "_method",
        "PUT"
      );

      return http.post(
        `/submissions/${encodeURIComponent(id)}`,
        body
      );
    }

    return http.put(
      `/submissions/${encodeURIComponent(id)}`,
      body
    );
  },

  remove: (id) =>
    http.delete(
      `/submissions/${encodeURIComponent(id)}`
    ),

  withdraw: (id) =>
    http.post(
      `/submissions/${encodeURIComponent(id)}/withdraw`,
      {}
    ),

  updateStatus: (
    id,
    status
  ) =>
    http.patch(
      `/submissions/${encodeURIComponent(id)}/status`,
      {
        status,
      }
    ),

  downloadFile: async (id) => {
    const token =
      tokenStore.get();

    const response =
      await fetch(
        `${API_BASE_URL}/submissions/${encodeURIComponent(id)}/file`,
        {
          headers: {
            Accept:
              "application/octet-stream",

            ...(token
              ? {
                  Authorization:
                    `Bearer ${token}`,
                }
              : {}),
          },
        }
      );

    if (!response.ok) {
      let message =
        "Unable to download submission file.";

      try {
        const data =
          await response.json();

        if (data?.message) {
          message =
            data.message;
        }
      } catch {
        // Keep generic message.
      }

      const error =
        new Error(message);

      error.status =
        response.status;

      throw error;
    }

    const blob =
      await response.blob();

    const disposition =
      response.headers.get(
        "Content-Disposition"
      );

    let fileName =
      `submission-${id}`;

    const utf8Match =
      disposition?.match(
        /filename\*=UTF-8''([^;]+)/i
      );

    const normalMatch =
      disposition?.match(
        /filename="?([^";]+)"?/i
      );

    if (utf8Match?.[1]) {
      fileName =
        decodeURIComponent(
          utf8Match[1]
        );
    } else if (
      normalMatch?.[1]
    ) {
      fileName =
        normalMatch[1];
    }

    const url =
      URL.createObjectURL(
        blob
      );

    const anchor =
      document.createElement(
        "a"
      );

    anchor.href = url;
    anchor.download =
      fileName;

    document.body.appendChild(
      anchor
    );

    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(
      url
    );
  },
};