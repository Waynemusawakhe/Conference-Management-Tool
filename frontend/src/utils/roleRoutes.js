export function normalizeRole(role) {
  return String(role ?? "")
    .trim()
    .toLowerCase();
}

export function getDashboardPath(role) {
  const normalizedRole = normalizeRole(role);

  switch (normalizedRole) {
    case "admin":
      return "/admin-dashboard";

    case "organiser":
      return "/organiser-dashboard";

    case "reviewer":
      return "/reviewer-dashboard";

    case "author":
      return "/author-dashboard";

    case "attendee":
      return "/attendee-dashboard";

    default:
      return "/";
  }
}