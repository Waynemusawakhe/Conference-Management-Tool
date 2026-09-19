import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Info,
  MapPin,
  Save,
  Trash2,
  Type,
} from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import { Card, CardHeader, StateBlock, formatDate } from "../components/AdminUI";
import { useApiResource } from "../hooks/useApiResource";
import { conferencesApi } from "../api/conferencesApi";

const DESCRIPTION_MAX = 2000;


function Field({ icon, label, error, hint, children }) {
  return (
    <div className="grid gap-2">
      <label className="grid gap-2">
        <span className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#3b4761]">
            <span className="text-[#7a6ef0]">{icon}</span>
            {label}
          </span>
          {hint}
        </span>
        {children}
      </label>
      {error && (
        <span
          role="alert"
          className="flex items-center gap-1 text-[11px] font-semibold text-red-600"
        >
          <AlertCircle size={12} /> {error}
        </span>
      )}
    </div>
  );
}

function inputClass(error, extra = "") {
  const base =
    "min-h-11 w-full rounded-xl border bg-white px-3.5 text-[13px] text-[#1c2a4a] outline-none transition placeholder:text-[#aab3c4] focus:ring-4";
  const tone = error
    ? "border-[#e8b4b4] bg-[#fffafa] focus:border-[#d98080] focus:ring-[#d98080]/10"
    : "border-[#e4e8f0] hover:border-[#d6dbe8] focus:border-[#8878f8] focus:ring-[#8878f8]/10";
  return `${base} ${tone} ${extra}`;
}

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */
export default function EditConferencePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const confRes = useApiResource(() => conferencesApi.getById(id), [id]);
  const conference = confRes.data?.data ?? confRes.data ?? null;

  const [form, setForm] = useState({
    name: "",
    description: "",
    date: "",
    location: "",
    external_website: "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [banner, setBanner] = useState(null);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    if (!conference) return;
    setForm({
      name: conference.name ?? conference.title ?? "",
      description: conference.description ?? "",
      date: (conference.date ?? conference.start_date ?? "").slice?.(0, 10) ?? "",
      location:
        conference.location ?? conference.venue ?? conference.venue_name ?? "",
      external_website:
        conference.external_website ?? conference.website ?? conference.url ?? "",
    });
  }, [conference]);

  const update = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const descriptionCount = form.description.length;

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Name is required.";
    if (!form.description.trim()) next.description = "Description is required.";
    else if (form.description.length > DESCRIPTION_MAX)
      next.description = `Description must be ${DESCRIPTION_MAX} characters or fewer.`;
    if (!form.date) next.date = "Date is required.";
    else if (form.date < today) next.date = "Date must be today or in the future.";
    if (!form.location.trim()) next.location = "Location is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBanner(null);
    if (!validate()) return;

    setSaving(true);
    try {
      await conferencesApi.update(id, {
        name: form.name.trim(),
        description: form.description.trim(),
        date: form.date,
        location: form.location.trim(),
        ...(form.external_website.trim()
          ? { external_website: form.external_website.trim() }
          : {}),
      });
      navigate("/admin/conferences");
    } catch (err) {
      if (err?.status === 422 && err.errors) setErrors(err.errors);
      setBanner({
        type: "error",
        text: err?.message ?? "Unable to update conference.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        `Delete "${conference?.name ?? "this conference"}"? This also affects its submissions. This cannot be undone.`
      )
    )
      return;

    setDeleting(true);
    setBanner(null);
    try {
      await conferencesApi.remove(id);
      navigate("/admin/conferences");
    } catch (err) {
      setBanner({
        type: "error",
        text: err?.message ?? "Failed to delete conference.",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout
      subtitle="Conference"
      title={
        conference
          ? conference.name ?? conference.title ?? `Conference #${id}`
          : "Edit Conference"
      }
      action={
        <button
          onClick={() => navigate("/admin/conferences")}
          className="inline-flex items-center gap-2 rounded-xl bg-[#07132f] px-4 py-2.5 text-[11px] font-extrabold text-white shadow-[0_10px_26px_rgba(7,19,47,.28)] transition hover:-translate-y-px hover:bg-[#0a1740] focus:outline-none focus:ring-4 focus:ring-[#07132f]/20"
        >
          <ArrowLeft size={14} /> Back
        </button>
      }
    >
      {confRes.loading && (
        <Card>
          <StateBlock kind="loading" message="Loading conference…" />
        </Card>
      )}

      {!confRes.loading && confRes.error && (
        <Card>
          <StateBlock
            kind="error"
            message={confRes.error.message}
            onRetry={confRes.reload}
          />
        </Card>
      )}

      {!confRes.loading && !confRes.error && conference && (
        <>
          {banner && (
            <div
              role="alert"
              className={`mb-4 flex items-start justify-between gap-4 rounded-xl border px-4 py-3 text-[11px] font-semibold ${
                banner.type === "success"
                  ? "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]"
                  : "border-[#f1c8c8] bg-[#fff2f2] text-[#b13a3a]"
              }`}
            >
              <span>{banner.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* ---------- Form ---------- */}
            <Card className="overflow-hidden lg:col-span-2">
              <CardHeader
                eyebrow="Details"
                title="Conference information"
              />

              <form onSubmit={handleSubmit} className="grid gap-6 p-6 sm:p-7">
                <Field
                  icon={<Type size={13} />}
                  label="Conference name"
                  error={errors.name}
                >
                  <input
                    value={form.name}
                    onChange={update("name")}
                    placeholder="e.g. International Conference on AI 2026"
                    aria-invalid={Boolean(errors.name)}
                    className={inputClass(errors.name)}
                  />
                </Field>

                <Field
                  icon={<Info size={13} />}
                  label="Description"
                  error={errors.description}
                  hint={
                    <span
                      className={`text-[10px] font-semibold tabular-nums ${
                        descriptionCount > DESCRIPTION_MAX
                          ? "text-red-600"
                          : descriptionCount > DESCRIPTION_MAX * 0.9
                          ? "text-amber-600"
                          : "text-[#aab3c4]"
                      }`}
                    >
                      {descriptionCount} / {DESCRIPTION_MAX}
                    </span>
                  }
                >
                  <textarea
                    value={form.description}
                    onChange={update("description")}
                    rows={5}
                    placeholder="What is this conference about?"
                    aria-invalid={Boolean(errors.description)}
                    className={inputClass(
                      errors.description,
                      "resize-y py-3 leading-6"
                    )}
                  />
                </Field>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field
                    icon={<CalendarDays size={13} />}
                    label="Date"
                    error={errors.date}
                  >
                    <input
                      type="date"
                      min={today}
                      value={form.date}
                      onChange={update("date")}
                      aria-invalid={Boolean(errors.date)}
                      className={inputClass(errors.date)}
                    />
                  </Field>

                  <Field
                    icon={<MapPin size={13} />}
                    label="Location"
                    error={errors.location}
                  >
                    <input
                      value={form.location}
                      onChange={update("location")}
                      placeholder="City, country or venue"
                      aria-invalid={Boolean(errors.location)}
                      className={inputClass(errors.location)}
                    />
                  </Field>
                </div>

                <Field
                  icon={<Info size={13} />}
                  label="External website (optional)"
                >
                  <input
                    value={form.external_website}
                    onChange={update("external_website")}
                    className={inputClass(false)}
                  />
                </Field>

                <div className="flex flex-col-reverse justify-end gap-2.5 border-t border-[#eef1f7] pt-6 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => navigate("/admin/conferences")}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#e4e8f0] bg-white px-5 text-[11px] font-bold text-[#5c6880] transition hover:-translate-y-px hover:border-[#d6dbe8] hover:bg-[#fafbff]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-6 text-[11px] font-extrabold text-white shadow-[0_12px_28px_rgba(103,87,245,.28)] transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    <Save size={14} /> {saving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </form>
            </Card>

            {/* ---------- Sidebar ---------- */}
            <aside className="space-y-6">
              {/* Record info */}
              <Card className="overflow-hidden">
                <CardHeader eyebrow="Metadata" title="Record info" />
                <dl className="divide-y divide-[#f2f4f9] px-6">
                  <MetaRow label="Reference" value={`#${conference.id}`} />
                  <MetaRow
                    label="Created"
                    value={formatDate(
                      conference.created_at ?? conference.createdAt
                    )}
                  />
                  <MetaRow
                    label="Last updated"
                    value={formatDate(
                      conference.updated_at ?? conference.updatedAt
                    )}
                  />
                  {conference.submissions_count != null && (
                    <MetaRow
                      label="Submissions"
                      value={conference.submissions_count}
                    />
                  )}
                </dl>
              </Card>

              {/* Danger zone */}
              <div className="overflow-hidden rounded-[20px] border border-[#f0d4d4] bg-gradient-to-b from-[#fffafa] to-[#fff5f5] p-6">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-red-100 text-red-600">
                    <Trash2 size={13} />
                  </span>
                  <strong className="text-[10px] font-extrabold uppercase tracking-[.12em] text-[#b13a3a]">
                    Danger zone
                  </strong>
                </div>
                <p className="mt-3 text-[11px] leading-5 text-[#9a6470]">
                  Deleting a conference also removes its submissions. This
                  cannot be undone.
                </p>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#f0c8c8] bg-white px-4 py-2.5 text-[11px] font-extrabold text-red-600 transition hover:border-[#e8a8a8] hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 size={13} />
                  {deleting ? "Deleting…" : "Delete conference"}
                </button>
              </div>
            </aside>
          </div>
        </>
      )}
    </AdminLayout>
  );
}

/* ------------------------------------------------------------------ *
 * MetaRow
 * ------------------------------------------------------------------ */
function MetaRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3.5">
      <dt className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#9ba4b5]">
        {label}
      </dt>
      <dd className="m-0 text-right text-[12px] font-semibold text-[#1c2a4a]">
        {value ?? "—"}
      </dd>
    </div>
  );
}