import { mockConferences } from "../data/mockConferences";

export async function getFeaturedConferences(limit = 3) {
  return mockConferences.slice(0, limit);
}

export async function getAllConferences() {
  return mockConferences;
}

export async function searchConferences(query = "", filters = {}) {
  const data = await getAllConferences();
  const q = query.trim().toLowerCase();
  const category = (filters.category || "").toLowerCase();
  const country = (filters.country || "").toLowerCase();
  const status = (filters.status || "").toLowerCase();
  const format = (filters.format || "").toLowerCase();

  return data.filter((c) => {
    const haystack = [
      c.title,
      c.shortTitle,
      c.acronym,
      c.category,
      c.location,
      c.city,
      c.country,
      c.description,
      c.status,
      ...(c.topics || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesQuery = !q || haystack.includes(q);
    const matchesCategory = !category || c.category.toLowerCase() === category;
    const matchesCountry = !country || c.country.toLowerCase() === country;
    const matchesStatus = !status || (c.status || "").toLowerCase() === status;
    const matchesFormat = !format || (c.format || "").toLowerCase() === format;

    return (
      matchesQuery &&
      matchesCategory &&
      matchesCountry &&
      matchesStatus &&
      matchesFormat
    );
  });
}

export function sortConferences(list, sortBy = "deadline") {
  const copy = [...list];
  if (sortBy === "deadline") {
    return copy.sort((a, b) =>
      (a.submissionDeadline || "").localeCompare(b.submissionDeadline || "")
    );
  }
  if (sortBy === "date") {
    return copy.sort((a, b) =>
      (a.startDate || "").localeCompare(b.startDate || "")
    );
  }
  return copy.sort((a, b) =>
    (a.shortTitle || a.title).localeCompare(b.shortTitle || b.title)
  );
}