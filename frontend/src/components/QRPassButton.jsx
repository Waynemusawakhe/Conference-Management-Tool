    import { useEffect, useRef, useState } from "react";
    import { createPortal } from "react-dom";
    import { QRCodeCanvas } from "qrcode.react";
    import { AlertTriangle, Download, Loader2, QrCode, X } from "lucide-react";
    import { registrationsApi } from "../api/registrationsApi";


    const ALLOW_DEMO_PASS = false;

    // Same set the attendee dashboard already treats as "confirmed".
    const PASS_ELIGIBLE_STATUSES = ["confirmed", "registered", "approved"];

    // "The pass endpoint is not there yet" (not "something is wrong with you").
    const PASS_ENDPOINT_MISSING = [404, 405, 501];

    const QR_SIZE = 280;

    function normalizeStatus(value) {
    return String(value ?? "pending").trim().toLowerCase().replace(/[\s-]+/g, "_");
    }

    function conferenceName(conference) {
    return conference?.name ?? conference?.title ?? "Conference";
    }

    function conferenceStart(conference) {
    return conference?.start_date ?? conference?.starts_at ?? conference?.date ?? null;
    }

    function conferenceEnd(conference) {
    return conference?.end_date ?? conference?.ends_at ?? conferenceStart(conference);
    }

    function todayKey() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${now.getFullYear()}-${month}-${day}`;
    }

    function hasEnded(conference) {
    const value = conferenceEnd(conference);
    if (!value) return false;
    const text = String(value);
    if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10) < todayKey();
    const date = new Date(text);
    if (Number.isNaN(date.getTime())) return false;
    return date.getTime() < new Date().setHours(0, 0, 0, 0);
    }

    function dateLabel(value) {
    if (!value) return "Date not set";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
    }

    export function isPassEligible(registration, conference) {
    return (
        Boolean(registration?.id) &&
        PASS_ELIGIBLE_STATUSES.includes(normalizeStatus(registration.status)) &&
        !hasEnded(conference)
    );
    }

    // The response shape of the proposed endpoint is not documented yet.
    // Confirm the real field name with the backend (Registrations: Ntswaki Mokwana)
    // and then keep only that one.
    function extractCredential(response) {
    if (typeof response === "string") return response;
    const body = response?.data?.data ?? response?.data ?? response;
    if (typeof body === "string") return body;
    const value = body?.qr_payload ?? body?.qr_code ?? body?.credential ?? body?.token ?? body?.pass ?? null;
    return typeof value === "string" && value.trim() ? value : null;
    }

    function loadErrorMessage(error) {
    if (error?.status === 401) return "Your session has expired. Please log in again.";
    if (error?.status === 403) return "You don't have access to a pass for this registration.";
    if (error?.status == null) return "Network request failed. Check your connection and try again.";
    return error?.message || "Unable to load your pass. Please try again.";
    }

function PassDialog({ registration, conference, attendeeName, onClose }) {
    const [view, setView] = useState({ phase: "loading", credential: null, message: "" });
    const [attempt, setAttempt] = useState(0);
    const qrWrapRef = useRef(null);

    const registrationId = registration.id;
    const conferenceId = registration.conference_id ?? conference?.id ?? "unknown";
    const title = conferenceName(conference);
    const isDemo = view.phase === "demo";
    const hasQr = view.phase === "ready" || isDemo;

useEffect(() => {
    let cancelled = false;
    setView({ phase: "loading", credential: null, message: "" });

    (async () => {
    try {
        const response = await registrationsApi.getPass(registrationId);
        if (cancelled) return;
        const credential = extractCredential(response);
        if (!credential) {
        setView({
            phase: "error",
            credential: null,
            message: "The pass service returned an unexpected response.",
        });
        return;
        }
        setView({ phase: "ready", credential, message: "" });
    } catch (error) {
        if (cancelled) return;
        if (ALLOW_DEMO_PASS && PASS_ENDPOINT_MISSING.includes(error?.status)) {
        setView({
            phase: "demo",
            credential: `CMT-DEMO-PASS:${registrationId}:${conferenceId}`,
            message: "",
        });
        return;
        }
        setView({ phase: "error", credential: null, message: loadErrorMessage(error) });
    }
    })();

    // The credential only lives in state while the dialog is open.
    return () => {
    cancelled = true;
    };
}, [registrationId, conferenceId, attempt]);

useEffect(() => {
const onKeyDown = (event) => {
    if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
}, [onClose]);

const handleDownload = () => {
    const source = qrWrapRef.current?.querySelector("canvas");
    if (!source) return;

    const pad = 28;
    const captionHeight = 72;
    const out = document.createElement("canvas");
    out.width = source.width + pad * 2;
    out.height = source.height + pad * 2 + captionHeight;

    const ctx = out.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(source, pad, pad);

    ctx.textAlign = "center";
    ctx.fillStyle = "#0d1b3d";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText(title, out.width / 2, source.height + pad + 34, out.width - pad * 2);
    ctx.fillStyle = isDemo ? "#9b7414" : "#66728b";
    ctx.font = "14px sans-serif";
    ctx.fillText(
    isDemo ? "DEMO PASS - not valid for check-in" : `Registration #${registrationId}`,
    out.width / 2,
    source.height + pad + 58,
      out.width - pad * 2,
    );

    const safeId = String(registrationId).replace(/[^\w-]/g, "");
    const link = document.createElement("a");
    link.href = out.toDataURL("image/png");
    link.download = `cmt-${isDemo ? "demo-" : ""}pass-${safeId}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
};

return createPortal(
    <div
    className="fixed inset-0 z-[120] grid place-items-center bg-[#07132f]/60 p-4 backdrop-blur-sm"
    onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
    <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="qr-pass-title"
        className="max-h-[92vh] w-full max-w-[400px] overflow-y-auto rounded-[22px] bg-white shadow-[0_30px_90px_rgba(7,19,47,.3)]"
    >
        <div className="relative bg-[radial-gradient(circle_at_78%_18%,rgba(121,104,255,.22),transparent_25%),linear-gradient(135deg,#07132f_0%,#0a1740_52%,#15165a_100%)] p-5 text-white">
        <button
            type="button"
            onClick={onClose}
            aria-label="Close pass"
            className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
        >
            <X size={16} />
        </button>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[.13em] text-[#b9b3ff]">
            <QrCode size={13} /> Conference pass
        </span>
        <h2 id="qr-pass-title" className="mb-0 mt-2 pr-8 text-[18px] font-extrabold leading-tight tracking-[-.02em]">
            {title}
        </h2>
        <p className="mb-0 mt-1.5 text-[11px] text-white/65">
            {dateLabel(conferenceStart(conference))}
            {conferenceEnd(conference) && conferenceEnd(conference) !== conferenceStart(conference)
            ? ` – ${dateLabel(conferenceEnd(conference))}`
            : ""}
        </p>
        </div>

        <div className="p-5">
        {view.phase === "loading" && (
            <div role="status" className="grid place-items-center gap-3 py-10 text-[12px] font-semibold text-[#7c879a]">
            <Loader2 size={22} className="animate-spin text-[#6655f6]" />
            Loading your pass...
            </div>
        )}

        {view.phase === "error" && (
            <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-[12px] font-semibold text-red-700">
            <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <span className="flex-1">{view.message}</span>
            </div>
            <button
                type="button"
                onClick={() => setAttempt((count) => count + 1)}
                className="mt-3 rounded-lg bg-white px-3 py-1.5 text-[11px] font-extrabold text-red-700 ring-1 ring-red-200 hover:bg-red-100"
            >
                Try again
            </button>
            </div>
        )}

        {isDemo && (
            <div
            role="note"
            className="mb-4 rounded-2xl border border-[#e9d9a7] bg-[#fff9e9] p-3 text-[11px] font-semibold leading-5 text-[#7a5b0f]"
            >
            <strong className="block text-[11px] font-extrabold uppercase tracking-wide">Demo pass</strong>
            This code is for testing the interface only. It is not a real credential and will not check you in.
            A secure pass will appear here once the pass service is available.
            </div>
        )}

        {hasQr && (
            <>
            <div ref={qrWrapRef} className="mx-auto w-full max-w-[280px] rounded-2xl border border-[#e4e8f0] bg-white p-3">
                <QRCodeCanvas
                value={view.credential}
                size={QR_SIZE}
                level="M"
                marginSize={2}
                bgColor="#ffffff"
                fgColor="#000000"
                style={{ width: "100%", height: "auto", display: "block" }}
                />
            </div>

            <div className="mt-4 text-center">
                {attendeeName && <strong className="block text-[13px] text-[#1c2a4a]">{attendeeName}</strong>}
                <span className="text-[10px] text-[#8c96a9]">Registration #{registrationId}</span>
                {!isDemo && (
                <p className="mb-0 mt-2 text-[11px] text-[#66728b]">
                    Show this code at the venue entrance. Turn your screen brightness up for easier scanning.
                </p>
                )}
            </div>

            <button
                type="button"
                onClick={handleDownload}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-4 py-3 text-[12px] font-extrabold text-white shadow-[0_12px_28px_rgba(103,87,245,.28)] transition hover:-translate-y-px"
            >
                <Download size={15} /> Download pass
            </button>
            </>
        )}
        </div>

        <div className="flex justify-end border-t border-[#edf0f5] bg-[#fafbfe] px-5 py-3">
        <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#dfe4ed] bg-white px-4 py-2 text-[11px] font-extrabold text-[#59657d] transition hover:bg-[#f5f6fa]"
        >
            Close
        </button>
        </div>
    </div>
    </div>,
    document.body,
);
}

function PassButton({ registration, conference, attendeeName }) {
const [open, setOpen] = useState(false);

return (
    <>
    <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="inline-flex items-center gap-1.5 rounded-lg bg-[#efedff] px-3 py-1.5 text-[10px] font-bold text-[#5548d7] transition hover:bg-[#e4e1ff]"
    >
        <QrCode size={12} /> QR Pass
    </button>
    {open && (
        <PassDialog
        registration={registration}
        conference={conference}
        attendeeName={attendeeName}
        onClose={() => setOpen(false)}
        />
    )}
    </>
);
}

export default function QrPassButton(props) {
if (!isPassEligible(props.registration, props.conference)) return null;
return <PassButton {...props} />;
}