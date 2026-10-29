import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  LogIn,
  RefreshCw,
  SearchX,
  ServerCrash,
  ShieldAlert,
  WifiOff,
} from "lucide-react";

/*
 * Reusable error states for any API-driven screen.
 *
 *   const { data, loading, error, reload } = useApiResource(() => api.getAll(), []);
 *   if (error) return <ApiErrorState error={error} onRetry={reload} />;
 *
 * Shows the right screen from error.kind (set by src/api/client.js):
 *   network / timeout  -> Network Error   (Retry)
 *   unauthorized       -> Session Expired (Log in again)
 *   forbidden          -> Access Denied   (Go back)
 *   server             -> Server error    (Retry)
 *   not_found          -> Not found
 * Retry only appears when error.retryable is true (reads only, never a POST).
 */

const VIEWS = {
  network: {
    Icon: WifiOff,
    title: "Can't reach the server",
    text: "Check your internet connection and that the CMT server is running, then try again.",
  },
  timeout: {
    Icon: WifiOff,
    title: "The server is taking too long",
    text: "The request timed out. This is usually temporary. Please try again.",
  },
  unauthorized: {
    Icon: LogIn,
    title: "Your session has expired",
    text: "For your security you were signed out. Log in again to continue where you left off.",
  },
  forbidden: {
    Icon: ShieldAlert,
    title: "Access denied",
    text: "Your account doesn't have permission to view this. If you think that's a mistake, contact an administrator.",
  },
  server: {
    Icon: ServerCrash,
    title: "Something went wrong on our side",
    text: "The server hit a problem. Please try again in a moment.",
  },
  not_found: {
    Icon: SearchX,
    title: "We couldn't find that",
    text: "It may have been removed, or the link may be wrong.",
  },
  rate_limited: {
    Icon: AlertTriangle,
    title: "Too many requests",
    text: "Please wait a moment before trying again.",
  },
  default: {
    Icon: AlertTriangle,
    title: "Something went wrong",
    text: "The request could not be completed.",
  },
};

const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-5 py-3 text-xs font-extrabold text-white shadow-[0_10px_26px_rgba(103,87,245,.26)] transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60";

const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-[#dfe4ed] bg-white px-5 py-3 text-xs font-bold text-[#0d1b3d] transition hover:-translate-y-px";

export default function ApiErrorState({
  error,
  kind: forcedKind,
  onRetry,
  onLogin,
  onBack,
  compact = false,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [retrying, setRetrying] = useState(false);

  const kind = forcedKind || error?.kind || "default";
  const view = VIEWS[kind] || VIEWS.default;
  const { Icon } = view;

  // Show the server's own message only for kinds where it adds information.
  const detail =
    error?.message && (kind === "forbidden" || kind === "server" || kind === "default")
      ? error.message
      : null;

  const canRetry =
    typeof onRetry === "function" &&
    kind !== "unauthorized" &&
    kind !== "forbidden" &&
    kind !== "not_found" &&
    (forcedKind ? true : error?.retryable === true);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await onRetry();
    } catch {
      // The caller's hook stores the error; nothing to do here.
    } finally {
      setRetrying(false);
    }
  };

  const handleLogin = () => {
    if (onLogin) return onLogin();
    navigate("/login", { replace: true, state: { from: location.pathname } });
  };

  const handleBack = () => {
    if (onBack) return onBack();
    navigate(-1);
  };

  return (
    <div
      role="alert"
      className={`mx-auto w-full max-w-md rounded-2xl border border-[#dfe4ed] bg-white text-center text-[#0d1b3d] shadow-xl ${
        compact ? "p-5" : "p-8"
      }`}
    >
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#efedff] text-[#5b4fe3]">
        <Icon size={22} aria-hidden="true" />
      </span>

      <h2 className="mt-4 text-lg font-bold">{view.title}</h2>
      <p className="mt-2 text-xs leading-6 text-[#7b869b]">{view.text}</p>

      {detail && (
        <p className="mt-3 rounded-lg bg-[#f4f6fb] px-3 py-2 text-[11px] text-[#4a5670]">
          {detail}
        </p>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {canRetry && (
          <button type="button" className={primaryButton} onClick={handleRetry} disabled={retrying}>
            <RefreshCw size={14} className={retrying ? "animate-spin" : ""} aria-hidden="true" />
            {retrying ? "Retrying..." : "Retry"}
          </button>
        )}

        {kind === "unauthorized" && (
          <button type="button" className={primaryButton} onClick={handleLogin}>
            <LogIn size={14} aria-hidden="true" />
            Log in again
          </button>
        )}

        {(kind === "forbidden" || kind === "not_found") && (
          <button type="button" className={secondaryButton} onClick={handleBack}>
            Go back
          </button>
        )}
      </div>
    </div>
  );
}

/* Named shortcuts for when you already know which state you want. */
export const NetworkError = (props) => <ApiErrorState kind="network" {...props} />;
export const AccessDenied = (props) => <ApiErrorState kind="forbidden" {...props} />;
export const SessionExpired = (props) => <ApiErrorState kind="unauthorized" {...props} />;