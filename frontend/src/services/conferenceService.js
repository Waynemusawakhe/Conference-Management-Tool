import { mockConferences } from "../data/mockConferences";

// Keep the UI independent from the data source.
// Later this function can call the backend API instead.
export async function getFeaturedConferences() {
  return mockConferences;
}

export async function searchConferences(query = "", filters = {}) {
  const data = await getFeaturedConferences();
  const q = query.trim().toLowerCase();
  const category = (filters.category || "").toLowerCase();
  const country = (filters.country || "").toLowerCase();

  return data.filter((conference) => {
    const matchesQuery =
      !q ||
      [
        conference.title,
        conference.category,
        conference.location,
        conference.city,
        conference.country,
      ].some((value) => value.toLowerCase().includes(q));

    const matchesCategory =
      !category || conference.category.toLowerCase() === category;

    const matchesCountry =
      !country || conference.country.toLowerCase() === country;

    return matchesQuery && matchesCategory && matchesCountry;
  });
}