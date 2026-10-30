import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  CameraOff,
  CheckCircle2,
  ClipboardList,
  History,
  LoaderCircle,
  QrCode,
  RefreshCw,
  ScanLine,
  ShieldAlert,
  Sparkles,
  UserX,
  XCircle,
  Zap,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import OrganiserLayout from "../components/OrganiserLayout";
import { conferencesApi } from "../api/conferencesApi";
import { checkInsApi } from "../api/checkInsApi";

function unwrapList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
}

function getErrorMessage(error) {
  const first = Object.values(error?.errors || {})[0];
  return Array.isArray(first)
    ? first[0]
    : first || error?.message || "Verification failed.";
}

function extractToken(raw) {
  const text = String(raw || "").trim();
  if (!text) return "";
  try {
    const parsed = JSON.parse(text);
    return (
      parsed.token ||
      parsed.pass_token ||
      parsed.credential ||
      parsed.code ||
      text
    );
  } catch {
    try {
      const url = new URL(text);
      return (
        url.searchParams.get("token") ||
        url.searchParams.get("code") ||
        text
      );
    } catch {
      return text;
    }
  }
}

const RESULT_META = {
  success: {
    icon: CheckCircle2,
    title: "Check-in successful",
    hint: "Attendee may enter.",
    ring: "border-emerald-300/80 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_55%),linear-gradient(180deg,#ecfdf5,#fff)] text-emerald-950 dark:border-emerald-400/30 dark:bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.2),transparent_50%),#0b1f1a] dark:text-emerald-50",
    iconWrap: "bg-emerald-500 text-white shadow-[0_8px_20px_rgba(16,185,129,0.45)]",
    pill: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
    bar: "from-emerald-400 to-teal-400",
  },
  invalid: {
    icon: XCircle,
    title: "Invalid pass",
    hint: "Code is not valid for this event.",
    ring: "border-red-300/80 bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.16),transparent_55%),linear-gradient(180deg,#fef2f2,#fff)] text-red-950 dark:border-red-400/30 dark:bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.18),transparent_50%),#1f0b0b] dark:text-red-50",
    iconWrap: "bg-red-500 text-white shadow-[0_8px_20px_rgba(239,68,68,0.45)]",
    pill: "bg-red-500/15 text-red-800 dark:text-red-200",
    bar: "from-red-400 to-rose-500",
  },
  cancelled: {
    icon: UserX,
    title: "Registration cancelled",
    hint: "Do not admit on this pass.",
    ring: "border-amber-300/80 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.18),transparent_55%),linear-gradient(180deg,#fffbeb,#fff)] text-amber-950 dark:border-amber-400/30 dark:bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.16),transparent_50%),#1f1608] dark:text-amber-50",
    iconWrap: "bg-amber-500 text-white shadow-[0_8px_20px_rgba(245,158,11,0.45)]",
    pill: "bg-amber-500/15 text-amber-900 dark:text-amber-200",
    bar: "from-amber-400 to-orange-400",
  },
  already_checked_in: {
    icon: ShieldAlert,
    title: "Already checked in",
    hint: "This pass was used before.",
    ring: "border-sky-300/80 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_55%),linear-gradient(180deg,#f0f9ff,#fff)] text-sky-950 dark:border-sky-400/30 dark:bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_50%),#0b1722] dark:text-sky-50",
    iconWrap: "bg-sky-500 text-white shadow-[0_8px_20px_rgba(14,165,233,0.45)]",
    pill: "bg-sky-500/15 text-sky-900 dark:text-sky-200",
    bar: "from-sky-400 to-blue-500",
  },
  error: {
    icon: AlertCircle,
    title: "Could not verify",
    hint: "Try again or use manual entry.",
    ring: "border-slate-200 bg-gradient-to-br from-slate-50 to-white text-slate-900 dark:border-white/15 dark:from-white/10 dark:to-transparent dark:text-white",
    iconWrap: "bg-slate-600 text-white",
    pill: "bg-slate-500/15 text-slate-700 dark:text-white/80",
    bar: "from-slate-400 to-slate-500",
  },
  demo: {
    icon: Sparkles,
    title: "Demo check-in",
    hint: "API not live — attendance not recorded.",
    ring: "border-violet-300/80 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.18),transparent_55%),linear-gradient(180deg,#f5f3ff,#fff)] text-violet-950 dark:border-violet-400/30 dark:bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.2),transparent_50%),#140f24] dark:text-violet-50",
    iconWrap: "bg-violet-500 text-white shadow-[0_8px_20px_rgba(139,92,246,0.45)]",
    pill: "bg-violet-500/15 text-violet-900 dark:text-violet-200",
    bar: "from-violet-400 to-fuchsia-400",
  },
};

export default function OrganiserQrScanner() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanningRef = useRef(false);
  const lastScanRef = useRef("");
  const rafRef = useRef(0);
  const verifyingRef = useRef(false);

  const [conferences, setConferences] = useState([]);
  const [conferenceId, setConferenceId] = useState(
    searchParams.get("conferenceId") || ""
  );
  const [loadingConferences, setLoadingConferences] = useState(true);
  const [cameraError, setCameraError] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ success: 0, blocked: 0, demo: 0 });
  const [flash, setFlash] = useState(null);

  const selectedConference = conferences.find(
    (c) => String(c.id) === String(conferenceId)
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoadingConferences(true);
      try {
        const res = await conferencesApi.getAll({ per_page: 100 });
        const list = unwrapList(res);
        if (!alive) return;
        setConferences(list);
        if (!conferenceId && list[0]?.id) {
          setConferenceId(String(list[0].id));
        }
      } catch {
        if (alive) setConferences([]);
      } finally {
        if (alive) setLoadingConferences(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopCamera = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    scanningRef.current = false;
    streamRef.current?.getTracks()?.forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const recordOutcome = (status, message, tokenPreview) => {
    setStats((s) => {
      if (status === "success") return { ...s, success: s.success + 1 };
      if (status === "demo") return { ...s, demo: s.demo + 1 };
      if (
        ["invalid", "cancelled", "already_checked_in", "error"].includes(status)
      ) {
        return { ...s, blocked: s.blocked + 1 };
      }
      return s;
    });
    setHistory((h) =>
      [
        {
          id: `${Date.now()}-${Math.random()}`,
          status,
          message,
          tokenPreview,
          at: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
        },
        ...h,
      ].slice(0, 8)
    );
    setFlash(status);
    window.setTimeout(() => setFlash(null), 700);
  };

  const verifyToken = useCallback(
    async (rawPayload) => {
      const token = extractToken(rawPayload);
      if (!token) {
        const next = {
          status: "invalid",
          message: "Empty or unreadable QR payload.",
        };
        setResult(next);
        recordOutcome("invalid", next.message, "—");
        return;
      }
      if (!conferenceId) {
        setResult({
          status: "error",
          message: "Select a conference before scanning.",
        });
        recordOutcome("error", "No conference selected", token.slice(0, 10));
        return;
      }
      if (verifyingRef.current) return;

      verifyingRef.current = true;
      setVerifying(true);
      setResult(null);

      try {
        const response = await checkInsApi.checkIn(conferenceId, {
          token,
          code: token,
        });
        const data = response?.data ?? response;
        const status = String(data?.status || data?.result || "success")
          .toLowerCase()
          .replace(/\s+/g, "_");

        let next;
        if (["cancelled", "canceled", "registration_cancelled"].includes(status)) {
          next = {
            status: "cancelled",
            message:
              data?.message ||
              "This registration is cancelled and cannot be used.",
            attendee: data?.attendee || data?.user,
          };
        } else if (
          ["already_checked_in", "duplicate", "already_used"].includes(status)
        ) {
          next = {
            status: "already_checked_in",
            message: data?.message || "This attendee is already checked in.",
            attendee: data?.attendee || data?.user,
          };
        } else if (["invalid", "not_found", "failed"].includes(status)) {
          next = {
            status: "invalid",
            message:
              data?.message || "This pass is not valid for this conference.",
          };
        } else {
          lastScanRef.current = token;
          next = {
            status: "success",
            message: data?.message || "Attendee checked in successfully.",
            attendee: data?.attendee || data?.user,
          };
        }
        setResult(next);
        recordOutcome(next.status, next.message, token.slice(0, 12));
      } catch (err) {
        const status = err?.status || err?.response?.status;
        let next;
        if (status === 404 || status === 501 || status === 405) {
          lastScanRef.current = token;
          next = {
            status: "demo",
            message:
              "Check-in API is not available yet. Prototype only — attendance was NOT recorded.",
            attendee: { tokenPreview: `${token.slice(0, 14)}…` },
          };
        } else if (status === 409) {
          next = {
            status: "already_checked_in",
            message: getErrorMessage(err),
          };
        } else if (status === 422 || status === 400) {
          const msg = getErrorMessage(err).toLowerCase();
          next = {
            status: msg.includes("cancel") ? "cancelled" : "invalid",
            message: getErrorMessage(err),
          };
        } else {
          next = { status: "error", message: getErrorMessage(err) };
        }
        setResult(next);
        recordOutcome(next.status, next.message, token.slice(0, 12));
      } finally {
        verifyingRef.current = false;
        setVerifying(false);
      }
    },
    [conferenceId]
  );

  const startCamera = async () => {
    setCameraError("");
    setResult(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Camera not available on this device. Use manual entry.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
      scanningRef.current = true;

      const Detector = window.BarcodeDetector;
      if (typeof Detector === "function") {
        const detector = new Detector({ formats: ["qr_code"] });
        const tick = async () => {
          if (!scanningRef.current || !videoRef.current) return;
          try {
            if (videoRef.current.readyState >= 2 && !verifyingRef.current) {
              const codes = await detector.detect(videoRef.current);
              if (codes?.[0]?.rawValue) {
                scanningRef.current = false;
                await verifyToken(codes[0].rawValue);
                setTimeout(() => {
                  scanningRef.current = true;
                }, 1600);
              }
            }
          } catch {
            /* ignore */
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setCameraError(
          "Live QR decode works best in Chrome/Edge. You can still paste a pass code below."
        );
      }
    } catch (err) {
      setCameraError(
        err?.message ||
          "Could not open the camera. Allow permission or use manual entry."
      );
      stopCamera();
    }
  };

  const onManualSubmit = (e) => {
    e.preventDefault();
    verifyToken(manualCode);
  };

  const meta = result ? RESULT_META[result.status] || RESULT_META.error : null;
  const ResultIcon = meta?.icon || AlertCircle;
  const totalScans = stats.success + stats.blocked + stats.demo;

  return (
    <OrganiserLayout>
      <style>{`
        @keyframes cmt-scan-line {
          0% { top: 12%; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: 82%; opacity: 0; }
        }
        @keyframes cmt-pulse-ring {
          0% { transform: scale(0.92); opacity: 0.7; }
          70% { transform: scale(1.08); opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes cmt-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .cmt-scan-line { animation: cmt-scan-line 2.2s ease-in-out infinite; }
        .cmt-pulse-ring { animation: cmt-pulse-ring 1.8s ease-out infinite; }
        .cmt-float { animation: cmt-float 5s ease-in-out infinite; }
      `}</style>

      <div className="mx-auto w-[min(1040px,100%)] pb-10 text-[#0d1b3d] dark:text-white">
        {/* Hero */}
        <div className="relative mb-6 overflow-hidden rounded-[28px] border border-[#e4e8f0] bg-[#07132f] p-5 text-white shadow-[0_24px_60px_rgba(15,23,42,0.22)] sm:p-8 dark:border-white/10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(124,108,255,0.45),transparent_40%),radial-gradient(circle_at_85%_15%,rgba(56,189,248,0.28),transparent_35%),radial-gradient(circle_at_70%_90%,rgba(244,63,94,0.18),transparent_40%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:28px_28px]" />

          <button
            type="button"
            onClick={() => navigate("/organiser-dashboard")}
            className="relative mb-5 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 backdrop-blur hover:bg-white/15 hover:text-white"
          >
            <ArrowLeft size={14} /> Overview
          </button>

          <div className="relative flex flex-wrap items-end justify-between gap-5">
            <div className="max-w-xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#ddd6fe]">
                <span className="relative flex h-2 w-2">
                  <span className="cmt-pulse-ring absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Door mode · organiser
              </div>
              <h1 className="mb-2 text-[clamp(1.7rem,4.5vw,2.2rem)] font-bold tracking-tight">
                Scan. Verify.{" "}
                <span className="bg-gradient-to-r from-[#c4b5fd] via-[#a5b4fc] to-[#7dd3fc] bg-clip-text text-transparent">
                  Admit.
                </span>
              </h1>
              <p className="m-0 text-sm leading-relaxed text-white/65">
                Fast QR check-in with clear success and block states. Use the
                camera on mobile or paste a pass code for testing.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                {
                  label: "Admitted",
                  value: stats.success,
                  icon: CheckCircle2,
                  tone: "from-emerald-400/20 to-emerald-500/5 text-emerald-200",
                },
                {
                  label: "Blocked",
                  value: stats.blocked,
                  icon: ShieldAlert,
                  tone: "from-amber-400/20 to-amber-500/5 text-amber-200",
                },
                {
                  label: "Session",
                  value: totalScans,
                  icon: Zap,
                  tone: "from-violet-400/20 to-violet-500/5 text-white",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`min-w-[84px] rounded-2xl border border-white/10 bg-gradient-to-b ${item.tone} px-3 py-3 text-center backdrop-blur`}
                >
                  <item.icon size={14} className="mx-auto mb-1 opacity-80" />
                  <div className="text-xl font-bold tabular-nums tracking-tight">
                    {item.value}
                  </div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-white/50">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Conference selector */}
        <div className="mb-4 rounded-3xl border border-[#e4e8f0] bg-white/90 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur dark:border-white/10 dark:bg-[#121a33]/90 dark:shadow-none">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6655f6] to-[#8b7cff] text-white shadow-[0_10px_24px_rgba(102,85,246,0.35)]">
              <ClipboardList size={16} />
            </span>
            <div>
              <p className="m-0 text-sm font-bold">Active conference</p>
              <p className="m-0 text-xs text-[#66728b] dark:text-white/50">
                Every scan is checked against this event
              </p>
            </div>
          </div>
          <select
            className="h-12 w-full rounded-2xl border border-[#dfe4ed] bg-[#f7f9fc] px-3 text-sm font-medium outline-none focus:border-[#7568f7] dark:border-white/10 dark:bg-[#0b1220]"
            value={conferenceId}
            disabled={loadingConferences || verifying}
            onChange={(e) => {
              setConferenceId(e.target.value);
              setResult(null);
              lastScanRef.current = "";
            }}
          >
            <option value="">Select conference</option>
            {conferences.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name || c.code || `Conference #${c.id}`}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          {/* Camera */}
          <section className="overflow-hidden rounded-[28px] border border-[#e4e8f0] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#121a33] dark:shadow-none">
            <div className="flex items-center justify-between gap-2 border-b border-[#e4e8f0] px-4 py-3.5 dark:border-white/10">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#efedff] text-[#5c50ec] dark:bg-[#6655f6]/20 dark:text-[#c4b5fd]">
                  <Camera size={17} />
                </span>
                <div>
                  <h2 className="m-0 text-sm font-bold">Camera scanner</h2>
                  <p className="m-0 text-[11px] text-[#66728b] dark:text-white/45">
                    {cameraOn ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Live scanning
                      </span>
                    ) : (
                      "Camera is off"
                    )}
                  </p>
                </div>
              </div>
              {!cameraOn ? (
                <button
                  type="button"
                  disabled={!conferenceId || verifying}
                  onClick={startCamera}
                  className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-[#6655f6] to-[#8b7cff] px-4 text-xs font-extrabold text-white shadow-[0_12px_28px_rgba(102,85,246,0.4)] transition hover:brightness-110 disabled:opacity-45"
                >
                  <ScanLine size={14} /> Start camera
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#dfe4ed] bg-[#f7f9fc] px-4 text-xs font-bold text-[#43506a] dark:border-white/15 dark:bg-white/5 dark:text-white"
                >
                  <CameraOff size={14} /> Stop
                </button>
              )}
            </div>

            <div
              className={`relative aspect-[3/4] bg-[#050814] transition sm:aspect-[16/11] ${
                flash === "success"
                  ? "ring-4 ring-inset ring-emerald-400/70"
                  : flash === "invalid" || flash === "cancelled"
                    ? "ring-4 ring-inset ring-red-400/70"
                    : ""
              }`}
            >
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                playsInline
                muted
                autoPlay
              />

              {cameraOn && (
                <>
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.45)_100%)]" />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="relative h-[48%] w-[64%] max-w-[280px]">
                      <div className="absolute inset-0 rounded-3xl border border-white/25" />
                      <span className="absolute left-0 top-0 h-7 w-7 rounded-tl-3xl border-l-[3px] border-t-[3px] border-[#a5b4fc]" />
                      <span className="absolute right-0 top-0 h-7 w-7 rounded-tr-3xl border-r-[3px] border-t-[3px] border-[#a5b4fc]" />
                      <span className="absolute bottom-0 left-0 h-7 w-7 rounded-bl-3xl border-b-[3px] border-l-[3px] border-[#a5b4fc]" />
                      <span className="absolute bottom-0 right-0 h-7 w-7 rounded-br-3xl border-b-[3px] border-r-[3px] border-[#a5b4fc]" />
                      <span className="cmt-scan-line absolute left-[8%] right-[8%] h-0.5 rounded-full bg-gradient-to-r from-transparent via-[#c4b5fd] to-transparent shadow-[0_0_12px_#a5b4fc]" />
                    </div>
                  </div>
                </>
              )}

              {!cameraOn && (
                <div className="absolute inset-0 grid place-items-center px-6 text-center">
                  <div className="cmt-float">
                    <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 text-white/80 shadow-[0_0_40px_rgba(165,180,252,0.25)]">
                      <QrCode size={30} />
                    </div>
                    <p className="m-0 text-base font-semibold text-white">
                      Ready for the next attendee
                    </p>
                    <p className="mx-auto mt-1.5 mb-0 max-w-[260px] text-xs leading-relaxed text-white/50">
                      Start the camera and place the QR inside the glowing frame.
                    </p>
                  </div>
                </div>
              )}

              {verifying && (
                <div className="absolute inset-0 grid place-items-center bg-black/55 backdrop-blur-[2px]">
                  <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/65 px-5 py-2.5 text-sm font-semibold text-white">
                    <LoaderCircle className="animate-spin" size={18} />
                    Verifying pass…
                  </div>
                </div>
              )}
            </div>

            {cameraError && (
              <p className="m-0 border-t border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-950 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100">
                {cameraError}
              </p>
            )}
          </section>

          {/* Side column */}
          <section className="flex flex-col gap-4">
            <form
              onSubmit={onManualSubmit}
              className="rounded-[28px] border border-[#e4e8f0] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#121a33] dark:shadow-none"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f3f0ff] text-[#6d5dfc] dark:bg-violet-500/15 dark:text-violet-300">
                  <Sparkles size={15} />
                </span>
                <div>
                  <h2 className="m-0 text-sm font-bold">Manual pass code</h2>
                  <p className="m-0 text-[11px] text-[#66728b] dark:text-white/45">
                    Paste when the camera can’t read
                  </p>
                </div>
              </div>
              <input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Token or QR payload"
                disabled={verifying || !conferenceId}
                className="mb-3 h-12 w-full rounded-2xl border border-[#dfe4ed] bg-[#f7f9fc] px-3 text-sm outline-none placeholder:text-[#98a2b3] focus:border-[#7568f7] dark:border-white/10 dark:bg-[#0b1220] dark:placeholder:text-white/30"
              />
              <button
                type="submit"
                disabled={verifying || !conferenceId || !manualCode.trim()}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#6655f6] to-[#8b7cff] text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(102,85,246,0.35)] disabled:opacity-45"
              >
                {verifying ? (
                  <>
                    <LoaderCircle size={16} className="animate-spin" />
                    Verifying…
                  </>
                ) : (
                  "Verify code"
                )}
              </button>
            </form>

            {result && meta && (
              <div
                className={`relative overflow-hidden rounded-[28px] border p-5 ${meta.ring}`}
                role="status"
              >
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${meta.bar}`} />
                <div className="flex items-start gap-3">
                  <span
                    className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${meta.iconWrap}`}
                  >
                    <ResultIcon size={22} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h3 className="m-0 text-[15px] font-extrabold">{meta.title}</h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${meta.pill}`}
                      >
                        {result.status.replaceAll("_", " ")}
                      </span>
                    </div>
                    <p className="mb-0 text-xs font-semibold opacity-80">{meta.hint}</p>
                    <p className="mb-0 mt-2 text-xs leading-relaxed opacity-90">
                      {result.message}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-2xl border border-black/10 bg-white/80 px-3.5 text-xs font-bold dark:border-white/15 dark:bg-white/10"
                  onClick={() => {
                    setResult(null);
                    setManualCode("");
                  }}
                >
                  <RefreshCw size={12} /> Scan next attendee
                </button>
              </div>
            )}

            {/* Recent history */}
            <div className="rounded-[28px] border border-[#e4e8f0] bg-white p-5 dark:border-white/10 dark:bg-[#121a33]">
              <div className="mb-3 flex items-center gap-2">
                <History size={15} className="text-[#6655f6]" />
                <h2 className="m-0 text-sm font-bold">Recent scans</h2>
              </div>
              {history.length === 0 ? (
                <p className="m-0 rounded-2xl border border-dashed border-[#d0d5e0] bg-[#fafbfe] px-3 py-4 text-center text-xs text-[#66728b] dark:border-white/15 dark:bg-white/[0.03] dark:text-white/50">
                  Your last scans will show up here during this session.
                </p>
              ) : (
                <ul className="m-0 space-y-2 p-0">
                  {history.map((item) => {
                    const itemMeta = RESULT_META[item.status] || RESULT_META.error;
                    const Icon = itemMeta.icon;
                    return (
                      <li
                        key={item.id}
                        className="flex items-center gap-3 rounded-2xl border border-[#edf0f5] bg-[#fafbfe] px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.03]"
                      >
                        <span
                          className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${itemMeta.iconWrap}`}
                        >
                          <Icon size={14} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="m-0 truncate text-xs font-bold">
                            {itemMeta.title}
                          </p>
                          <p className="m-0 truncate text-[10px] text-[#66728b] dark:text-white/45">
                            {item.tokenPreview}… · {item.at}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
    </OrganiserLayout>
  );
}