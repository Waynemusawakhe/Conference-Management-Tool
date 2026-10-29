import { useState } from "react";
import ApiErrorState from "../components/ApiErrorState";

/*
 * Demo page for showing the reusable error states to the team.
 * Add a TEMPORARY route in App.jsx while demonstrating, and remove it before merging:
 *   <Route path="/dev/error-states" element={<ApiErrorDemo />} />
 */
const samples = {
  "Network error": { status: null, kind: "network", message: "Network request failed.", retryable: true },
  "Timeout": { status: null, kind: "timeout", message: "The server took too long to respond.", retryable: true },
  "Session expired (401)": { status: 401, kind: "unauthorized", message: "Unauthenticated.", retryable: false },
  "Access denied (403)": { status: 403, kind: "forbidden", message: "This action is unauthorized.", retryable: false },
  "Server error (500)": { status: 500, kind: "server", message: "Server Error", retryable: true },
  "Not found (404)": { status: 404, kind: "not_found", message: "Not found.", retryable: false },
};

export default function ApiErrorDemo() {
  const [active, setActive] = useState("Network error");
  const [retries, setRetries] = useState(0);

  const onRetry = () =>
    new Promise((resolve) =>
      setTimeout(() => {
        setRetries((n) => n + 1);
        resolve();
      }, 800)
    );

  return (
    <main className="min-h-screen bg-[#07132f] p-6 text-white">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold">Shared API error states</h1>
        <p className="mt-1 text-xs text-white/60">Retry presses: {retries}</p>

        <div className="my-5 flex flex-wrap gap-2">
          {Object.keys(samples).map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setActive(name)}
              className={`rounded-lg border px-3 py-2 text-xs font-bold ${
                active === name ? "border-[#7869ff] bg-[#7869ff]/30" : "border-white/20"
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        <ApiErrorState error={samples[active]} onRetry={onRetry} />
      </div>
    </main>
  );
}