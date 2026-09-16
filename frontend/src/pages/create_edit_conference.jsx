import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  Edit3,
  ExternalLink,
  Globe2,
  Loader2,
  MapPin,
  Moon,
  Save,
  Sparkles,
  Sun,
  Tag,
  Users,
} from "lucide-react";
import { conferencesApi } from "../api/conferencesApi";
import { useTheme } from "../context/ThemeContext";

const emptyConference = {
  code: "",
  name: "",
  description: "",
  category: "",
  topics: "",
  format: "in_person",
  submission_status: "open",
  start_date: "",
  end_date: "",
  submission_deadline: "",
  venue_name: "",
  city: "",
  country: "South Africa",
  website_link: "",
};

const formatLabels = {
  in_person: "In-person",
  virtual: "Virtual",
  hybrid: "Hybrid",
};

function dateOnly(value) {
  return value ? String(value).split("T")[0] : "";
}

function unwrapConference(response) {
  const payload = response?.data ?? response;
  return payload?.data ?? payload;
}

function FieldError({ name, errors }) {
  const messages = errors[name];
  if (!messages?.length) return null;
  return <p className="mt-1.5 text-[11px] font-semibold text-[#b13a3a]">{messages.join(" ")}</p>;
}

export default function CreateEditConference() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dark, toggleTheme } = useTheme();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(emptyConference);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!isEdit) return;
    conferencesApi
      .getById(id)
      .then((response) => {
        const data = unwrapConference(response);
        setForm({
          ...emptyConference,
          ...data,
          topics: Array.isArray(data.topics) ? data.topics.join(", ") : data.topics || "",
          format: data.format || "in_person",
          submission_status: data.submission_status || data.status || "open",
          start_date: dateOnly(data.start_date || data.date),
          end_date: dateOnly(data.end_date),
          submission_deadline: dateOnly(data.submission_deadline),
        });
      })
      .catch((requestError) => setError(requestError.message || "Unable to load this conference."))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((current) => {
        const next = { ...current };
        delete next[name];
        return next;
      });
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setFieldErrors({});
    const payload = {
      ...form,
      topics: form.topics
        .split(",")
        .map((topic) => topic.trim())
        .filter(Boolean),
    };

    try {
      if (isEdit) await conferencesApi.update(id, payload);
      else await conferencesApi.create(payload);
      navigate("/admin-dashboard");
    } catch (requestError) {
      setError(requestError.status === 422 ? "Please review the highlighted fields." : requestError.message || "Unable to save the conference.");
      setFieldErrors(requestError.errors || {});
    } finally {
      setSaving(false);
    }
  };

  const completion = useMemo(() => {
    const fields = ["code", "name", "category", "start_date", "end_date", "venue_name", "city"];
    return Math.round((fields.filter((field) => form[field]).length / fields.length) * 100);
  }, [form]);

  const inputClass = (name) => `h-12 w-full rounded-xl border bg-[#fafbfe] px-3.5 text-[12px] text-[#0d1b3d] outline-none transition focus:border-[#6757f5] focus:ring-4 focus:ring-[#6757f5]/10 dark:border-white/10 dark:bg-[#101f49] dark:text-white ${fieldErrors[name] ? "border-[#e9aaaa]" : "border-[#e2e6ee]"}`;

  if (loading) {
    return <div className="grid min-h-[60vh] place-items-center text-[12px] text-[#66728b] dark:text-white/60"><Loader2 className="mr-2 animate-spin" size={18} /> Loading conference...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#0d1b3d] dark:bg-[#07132f] dark:text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#07132f]/95 text-white shadow-[0_8px_30px_rgba(7,19,47,.12)] backdrop-blur-xl">
        <div className="mx-auto flex min-h-[76px] w-[min(1400px,calc(100%-32px))] items-center justify-between gap-4">
          <button onClick={() => navigate("/admin-dashboard")} className="inline-flex items-center gap-2 text-[12px] font-bold text-white/75 transition hover:text-white" type="button"><ArrowLeft size={16} /> Admin workspace</button>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/admin-dashboard#conferences-table")} type="button" className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-white/15 px-3 text-[11px] font-bold text-white/80 transition hover:bg-white/10 hover:text-white"><Edit3 size={14} /> <span className="hidden sm:inline">Edit existing conference</span><span className="sm:hidden">Edit</span></button>
            <button onClick={toggleTheme} type="button" aria-label="Toggle theme" className="grid h-9 w-9 place-items-center rounded-lg border border-white/15 text-white/75 transition hover:bg-white/10 hover:text-white">{dark ? <Sun size={16} /> : <Moon size={16} />}</button>
            <span className="hidden text-[11px] font-bold text-white/55 sm:inline">{dark ? "Dark theme" : "Light theme"}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-[min(1180px,calc(100%-32px))] py-9 sm:py-12">
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.14em] text-[#6757f5]"><Sparkles size={14} /> Conference studio</div>
            <h1 className="text-[clamp(30px,4vw,48px)] font-extrabold leading-[1.05] tracking-[-.05em]">{isEdit ? "Refine your conference" : "Create a conference"}</h1>
            <p className="mt-3 max-w-xl text-[13px] leading-6 text-[#66728b] dark:text-white/60">Shape the essential details, dates, and destination for an event your research community will remember.</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-[#e4e8f0] bg-white px-4 py-3 shadow-[0_12px_32px_rgba(15,28,65,.05)] dark:border-white/10 dark:bg-[#0d1c44]">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#efedff] text-[#6757f5] dark:bg-[#6757f5]/20"><Check size={18} /></div>
            <div><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#8993a6]">Profile progress</p><p className="mt-1 text-[18px] font-extrabold">{completion}% complete</p></div>
          </div>
        </div>

        {error && <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#f1c8c8] bg-[#fff2f2] px-4 py-3 text-[12px] text-[#b13a3a] dark:border-[#b13a3a]/40 dark:bg-[#b13a3a]/10"><CircleHelp className="mt-0.5 shrink-0" size={16} /> {error}</div>}

        <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_310px]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-[#e4e8f0] bg-white p-5 shadow-[0_12px_32px_rgba(15,28,65,.045)] sm:p-7 dark:border-white/10 dark:bg-[#0d1c44]">
              <div className="mb-6 flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#efedff] text-[#6757f5] dark:bg-[#6757f5]/20"><Tag size={18} /></div><div><h2 className="text-[16px] font-extrabold">Identity and story</h2><p className="mt-1 text-[11px] text-[#8993a6]">Give your event a clear, memorable presence.</p></div></div>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="sm:col-span-1"><span className="mb-1.5 block text-[11px] font-bold text-[#35415f] dark:text-white/75">Conference code <b className="text-[#6757f5]">*</b></span><input name="code" value={form.code} onChange={updateField} placeholder="CMT2026" required className={inputClass("code")} /><FieldError name="code" errors={fieldErrors} /></label>
                <label><span className="mb-1.5 block text-[11px] font-bold text-[#35415f] dark:text-white/75">Category</span><input name="category" value={form.category} onChange={updateField} placeholder="Technology and research" className={inputClass("category")} /><FieldError name="category" errors={fieldErrors} /></label>
                <label className="sm:col-span-2"><span className="mb-1.5 block text-[11px] font-bold text-[#35415f] dark:text-white/75">Conference name <b className="text-[#6757f5]">*</b></span><input name="name" value={form.name} onChange={updateField} placeholder="International Conference on..." required className={inputClass("name")} /><FieldError name="name" errors={fieldErrors} /></label>
                <label className="sm:col-span-2"><span className="mb-1.5 block text-[11px] font-bold text-[#35415f] dark:text-white/75">Description</span><textarea name="description" value={form.description} onChange={updateField} rows={5} placeholder="What should attendees know about this conference?" className={`${inputClass("description")} h-auto py-3.5`} /><FieldError name="description" errors={fieldErrors} /></label>
                <label className="sm:col-span-2"><span className="mb-1.5 block text-[11px] font-bold text-[#35415f] dark:text-white/75">Topics <span className="font-normal text-[#8993a6]">(separate with commas)</span></span><input name="topics" value={form.topics} onChange={updateField} placeholder="Artificial intelligence, NLP, Responsible AI" className={inputClass("topics")} /><FieldError name="topics" errors={fieldErrors} /></label>
              </div>
            </section>

            <section className="rounded-2xl border border-[#e4e8f0] bg-white p-5 shadow-[0_12px_32px_rgba(15,28,65,.045)] sm:p-7 dark:border-white/10 dark:bg-[#0d1c44]">
              <div className="mb-6 flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eaf9f2] text-[#19a56a]"><CalendarDays size={18} /></div><div><h2 className="text-[16px] font-extrabold">When and how</h2><p className="mt-1 text-[11px] text-[#8993a6]">Set the schedule and submission window.</p></div></div>
              <div className="grid gap-5 sm:grid-cols-2">
                <label><span className="mb-1.5 block text-[11px] font-bold text-[#35415f] dark:text-white/75">Start date <b className="text-[#6757f5]">*</b></span><input type="date" name="start_date" value={form.start_date} onChange={updateField} required className={inputClass("start_date")} /><FieldError name="start_date" errors={fieldErrors} /></label>
                <label><span className="mb-1.5 block text-[11px] font-bold text-[#35415f] dark:text-white/75">End date <b className="text-[#6757f5]">*</b></span><input type="date" name="end_date" value={form.end_date} onChange={updateField} required className={inputClass("end_date")} /><FieldError name="end_date" errors={fieldErrors} /></label>
                <label><span className="mb-1.5 block text-[11px] font-bold text-[#35415f] dark:text-white/75">Submission deadline</span><input type="date" name="submission_deadline" value={form.submission_deadline} onChange={updateField} className={inputClass("submission_deadline")} /><FieldError name="submission_deadline" errors={fieldErrors} /></label>
                <label><span className="mb-1.5 block text-[11px] font-bold text-[#35415f] dark:text-white/75">Format <b className="text-[#6757f5]">*</b></span><span className="relative block"><select name="format" value={form.format} onChange={updateField} className={`${inputClass("format")} appearance-none`}><option value="in_person">In-person</option><option value="virtual">Virtual</option><option value="hybrid">Hybrid</option></select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8993a6]" size={15} /></span><FieldError name="format" errors={fieldErrors} /></label>
                <label><span className="mb-1.5 block text-[11px] font-bold text-[#35415f] dark:text-white/75">Submission status</span><span className="relative block"><select name="submission_status" value={form.submission_status} onChange={updateField} className={`${inputClass("submission_status")} appearance-none`}><option value="open">Open for submissions</option><option value="closed">Closed</option></select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8993a6]" size={15} /></span><FieldError name="submission_status" errors={fieldErrors} /></label>
              </div>
            </section>

            <section className="rounded-2xl border border-[#e4e8f0] bg-white p-5 shadow-[0_12px_32px_rgba(15,28,65,.045)] sm:p-7 dark:border-white/10 dark:bg-[#0d1c44]">
              <div className="mb-6 flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#fff1e4] text-[#e87f19]"><MapPin size={18} /></div><div><h2 className="text-[16px] font-extrabold">Destination</h2><p className="mt-1 text-[11px] text-[#8993a6]">Help attendees find the room, city, and online details.</p></div></div>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="sm:col-span-2"><span className="mb-1.5 block text-[11px] font-bold text-[#35415f] dark:text-white/75">Venue name</span><input name="venue_name" value={form.venue_name} onChange={updateField} placeholder="Convention centre or online venue" className={inputClass("venue_name")} /><FieldError name="venue_name" errors={fieldErrors} /></label>
                <label><span className="mb-1.5 block text-[11px] font-bold text-[#35415f] dark:text-white/75">City</span><input name="city" value={form.city} onChange={updateField} placeholder="Johannesburg" className={inputClass("city")} /><FieldError name="city" errors={fieldErrors} /></label>
                <label><span className="mb-1.5 block text-[11px] font-bold text-[#35415f] dark:text-white/75">Country</span><input name="country" value={form.country} onChange={updateField} placeholder="South Africa" className={inputClass("country")} /><FieldError name="country" errors={fieldErrors} /></label>
                <label className="sm:col-span-2"><span className="mb-1.5 block text-[11px] font-bold text-[#35415f] dark:text-white/75">Website link</span><div className="relative"><Globe2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8993a6]" size={15} /><input type="url" name="website_link" value={form.website_link} onChange={updateField} placeholder="https://conference.example.com" className={`${inputClass("website_link")} pl-10`} /></div><FieldError name="website_link" errors={fieldErrors} /></label>
              </div>
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-[100px] lg:self-start">
            <div className="overflow-hidden rounded-2xl border border-[#e4e8f0] bg-[#07132f] text-white shadow-[0_18px_45px_rgba(7,19,47,.16)]"><div className="p-6"><div className="mb-8 flex items-center justify-between"><span className="rounded-full bg-[#6757f5]/20 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.1em] text-[#b9b3ff]">Live preview</span><Sparkles className="text-[#f59a43]" size={18} /></div><p className="text-[10px] font-extrabold uppercase tracking-[.13em] text-white/45">{form.code || "YOUR CODE"}</p><h2 className="mt-3 min-h-[66px] text-[24px] font-extrabold leading-[1.08] tracking-[-.04em]">{form.name || "Your conference name"}</h2><p className="mt-4 min-h-[40px] text-[11px] leading-5 text-white/55">{form.description || "A clear event story will appear here."}</p></div><div className="grid grid-cols-2 border-t border-white/10"><div className="border-r border-white/10 p-4"><CalendarDays size={15} className="mb-2 text-[#8c72ff]" /><p className="text-[10px] text-white/45">Dates</p><p className="mt-1 text-[11px] font-bold">{form.start_date || "TBD"}</p></div><div className="p-4"><MapPin size={15} className="mb-2 text-[#f59a43]" /><p className="text-[10px] text-white/45">Location</p><p className="mt-1 truncate text-[11px] font-bold">{form.city || "TBD"}</p></div></div></div>
            <div className="rounded-2xl border border-[#e4e8f0] bg-white p-5 dark:border-white/10 dark:bg-[#0d1c44]"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[#eaf9f2] text-[#19a56a]"><Users size={17} /></div><div><p className="text-[11px] font-extrabold">Ready for your community?</p><p className="mt-1 text-[10px] leading-4 text-[#8993a6]">A complete profile helps attendees trust the event.</p></div></div></div>
            <div className="flex flex-col gap-3"><button type="submit" disabled={saving} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-5 text-[12px] font-extrabold text-white shadow-[0_12px_28px_rgba(103,87,245,.28)] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60">{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}{saving ? "Saving..." : isEdit ? "Save changes" : "Create conference"}</button><button type="button" onClick={() => navigate("/admin-dashboard")} className="min-h-11 rounded-xl border border-[#e2e6ee] bg-white text-[12px] font-bold text-[#59657d] transition hover:bg-[#f0f2f6] dark:border-white/10 dark:bg-[#0d1c44] dark:text-white/70 dark:hover:bg-white/10">Cancel</button>{form.website_link && <a href={form.website_link} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 text-[11px] font-bold text-[#6757f5] hover:underline">Preview website <ExternalLink size={13} /></a>}</div>
          </aside>
        </form>
      </main>
    </div>
  );
}


