import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Save, ArrowLeft, Loader2 } from "lucide-react";
import { conferencesApi } from "../api/conferencesApi";

export default function ConferenceFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    format: "in-person",
    start_date: "",
    end_date: "",
    description: "",
  });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      conferencesApi.getById(id)
        .then((res) => {
          const data = res.data || res;
          const startDate = data.start_date || data.date || "";
          setFormData({
            code: data.code || "",
            name: data.name || "",
            format: data.format || "in-person",
            start_date: startDate ? startDate.split("T")[0] : "",
            end_date: data.end_date ? data.end_date.split("T")[0] : "",
            description: data.description || "",
          });
        })
        .catch((err) => setError(err.message || "Failed to load conference"))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      if (isEdit) {
        await conferencesApi.update(id, formData);
      } else {
        await conferencesApi.create(formData);
      }
      navigate("/AdminDashboard");
    } catch (err) {
      if (err.status === 422 && err.errors) {
        setFieldErrors(err.errors);
        setError("Please fix the errors below and try again.");
      } else {
        setError(err.message || "Failed to save conference");
      }
    } finally {
      setSaving(false);
    }
  };

  const FieldError = ({ name }) => {
    const messages = fieldErrors[name];
    if (!messages?.length) return null;
    return (
      <p className="mt-1 text-[10px] font-semibold text-[#b13a3a]">{messages.join(" ")}</p>
    );
  };

  const inputClass = (name) =>
    `h-11 w-full rounded-[10px] border bg-[#fafbfe] px-3 text-[12px] outline-none focus:ring-2 focus:ring-[#8175ef]/10 ${
      fieldErrors[name] ? "border-[#f1c8c8]" : "border-[#e2e6ee] focus:border-[#8175ef]"
    }`;

  if (loading)
    return <div className="p-10 text-center text-[11px] text-[#8993a6]">Loading conference…</div>;

  return (
    <div className="rounded-[20px] border border-[#e4e8f0] bg-white p-6 shadow-[0_10px_30px_rgba(15,28,65,.035)]">
      <button
        onClick={() => navigate("/AdminDashboard")}
        className="mb-6 flex items-center gap-2 text-[11px] font-bold text-[#6655f6] hover:underline"
      >
        <ArrowLeft size={14} /> Back to Dashboard
      </button>

      <div className="mb-6">
        <h1 className="text-[24px] font-bold tracking-[-.03em]">
          {isEdit ? "Edit Conference" : "Create New Conference"}
        </h1>
        <p className="mt-1 text-[11px] text-[#8993a6]">
          Fill in the details below to {isEdit ? "update" : "create"} the conference.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-[#f1c8c8] bg-[#fff2f2] p-3 text-[11px] text-[#b13a3a]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
        {/* Code */}
        <div>
          <label className="mb-1.5 block text-[11px] font-bold text-[#35415f]">
            Conference Code *
          </label>
          <input
            name="code"
            value={formData.code}
            onChange={handleChange}
            required
            className={inputClass("code")}
            placeholder="e.g. AISUMMIT2026"
          />
          <FieldError name="code" />
        </div>

        {/* Name */}
        <div>
          <label className="mb-1.5 block text-[11px] font-bold text-[#35415f]">
            Conference Name *
          </label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className={inputClass("name")}
            placeholder="e.g. AI & Machine Learning Summit"
          />
          <FieldError name="name" />
        </div>

        {/* Format */}
        <div>
          <label className="mb-1.5 block text-[11px] font-bold text-[#35415f]">Format *</label>
          <select
            name="format"
            value={formData.format}
            onChange={handleChange}
            required
            className={inputClass("format")}
          >
            <option value="in-person">In-person</option>
            <option value="virtual">Virtual</option>
            <option value="hybrid">Hybrid</option>
          </select>
          <FieldError name="format" />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold text-[#35415f]">
              Start Date *
            </label>
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              required
              className={inputClass("start_date")}
            />
            <FieldError name="start_date" />
            <FieldError name="date" />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold text-[#35415f]">End Date *</label>
            <input
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              required
              className={inputClass("end_date")}
            />
            <FieldError name="end_date" />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="mb-1.5 block text-[11px] font-bold text-[#35415f]">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className={`w-full rounded-[10px] border bg-[#fafbfe] px-3 py-3 text-[12px] outline-none focus:ring-2 focus:ring-[#8175ef]/10 ${
              fieldErrors.description
                ? "border-[#f1c8c8]"
                : "border-[#e2e6ee] focus:border-[#8175ef]"
            }`}
            placeholder="Brief description of the conference..."
          />
          <FieldError name="description" />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-5 py-3 text-[12px] font-extrabold text-white shadow-[0_12px_28px_rgba(103,87,245,.28)] disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? "Saving…" : "Save Conference"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/AdminDashboard")}
            className="rounded-xl border border-[#e2e6ee] bg-white px-5 py-3 text-[12px] font-bold text-[#59657d] hover:bg-[#f0f2f6]"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

