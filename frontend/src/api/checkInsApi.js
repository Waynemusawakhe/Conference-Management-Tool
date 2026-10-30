import { http } from "./client";

/**
 * Proposed: POST /api/v1/conferences/{id}/check-ins
 * Until backend ships this, the scanner treats 404/501 as demo mode.
 */
export const checkInsApi = {
  checkIn: (conferenceId, body) =>
    http.post(
      `/conferences/${encodeURIComponent(conferenceId)}/check-ins`,
      body
    ),
};