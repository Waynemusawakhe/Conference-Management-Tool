import { http } from "./client";

// [API-AUDIT]
// 1. downloadFile goes through the shared client (token, timeout, 401/403
//    handling, same error shape) instead of its own fetch().
// 2. create() now always sends multipart/form-data, as the Swagger contract
//    requires (conference_id, title, track, abstract, file). Pages may keep
//    passing a plain object (conferenceId or conference_id both work); a
//    `file` is attached properly and `status` is not sent because it is not
//    part of the contract (the backend decides the initial status).

function toSubmissionFormData(body) {
  if (typeof FormData !== "undefined" && body instanceof FormData) {
    return body;
  }

  const data = new FormData();
  const conferenceId = body?.conference_id ?? body?.conferenceId;

  if (conferenceId !== undefined && conferenceId !== null && conferenceId !== "") {
    data.append("conference_id", String(conferenceId));
  }

  ["title", "track", "abstract"].forEach((field) => {
    const value = body?.[field];
    if (value !== undefined && value !== null && value !== "") {
      data.append(field, String(value));
    }
  });

  const file = body?.file;
  if (file && typeof Blob !== "undefined" && file instanceof Blob) {
    data.append("file", file);
  }

  return data;
}

export const submissionsApi = {
  getAll: (params = {}) => http.get("/submissions", { params }),

  getById: (id) => http.get(`/submissions/${encodeURIComponent(id)}`),

  create: (body) => http.post("/submissions", toSubmissionFormData(body)),

  update: (id, body) => {
    if (typeof FormData !== "undefined" && body instanceof FormData) {
      body.append("_method", "PUT");

      return http.post(`/submissions/${encodeURIComponent(id)}`, body);
    }

    return http.put(`/submissions/${encodeURIComponent(id)}`, body);
  },

  remove: (id) => http.delete(`/submissions/${encodeURIComponent(id)}`),

  withdraw: (id) =>
    http.post(`/submissions/${encodeURIComponent(id)}/withdraw`, {}),

  updateStatus: (id, status) =>
    http.patch(`/submissions/${encodeURIComponent(id)}/status`, { status }),

  // [API-AUDIT] Returns { blob, fileName } for previews (for example an iframe
  // or object URL) without forcing a download.
  getFileBlob: (id) =>
    http.get(`/submissions/${encodeURIComponent(id)}/file`, {
      responseType: "blob",
    }),

  downloadFile: async (id) => {
    const { blob, fileName } = await submissionsApi.getFileBlob(id);

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = fileName || `submission-${id}`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  },
};