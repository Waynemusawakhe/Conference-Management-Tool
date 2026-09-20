import {
  Navigate,
  useLocation,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import {
  getDashboardPath,
  normalizeRole,
} from "../utils/roleRoutes";

export default function ProtectedRoute({
  children,
  roles,
}) {
  const {
    status,
    role,
  } = useAuth();

  const location = useLocation();

  if (status === "initializing") {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f7f9fc] px-5 text-[#66728b]">
        <div className="rounded-2xl border border-[#e4e8f0] bg-white px-6 py-5 text-sm font-semibold shadow-sm">
          Loading your workspace...
        </div>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  const normalizedRole = normalizeRole(role);

  const allowedRoles =
    roles?.map((item) => normalizeRole(item)) ?? [];

  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(normalizedRole)
  ) {
    return (
      <Navigate
        to={getDashboardPath(normalizedRole)}
        replace
      />
    );
  }

  return children;
}