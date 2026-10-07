import { conferencesApi } from "../api/conferencesApi";
import { listItems } from "../utils/pagination";

export async function getFeaturedConferences(limit = 3) {
  return listItems(
    await conferencesApi.getAll({ per_page: limit, sort: "date" }),
  );
}

export async function searchConferences(query = "", filters = {}) {
  return listItems(
    await conferencesApi.getAll({
      search: query.trim(),
      category: filters.category,
      country: filters.country,
      submission_status: filters.status,
      format: filters.format,
      per_page: 12,
    }),
  );
}
