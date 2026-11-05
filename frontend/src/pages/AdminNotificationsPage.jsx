import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CheckCircle2,
  FileText,
  History,
  Mail,
  Monitor,
  Pencil,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import { adminNotificationsApi } from "../api/adminNotificationsApi";
import { usersApi } from "../api/usersApi";

const roles = [
  { value: "admin", label: "Administrators" },
  { value: "organiser", label: "Organisers" },
  { value: "reviewer", label: "Reviewers" },
  { value: "author", label: "Authors" },
  { value: "attendee", label: "Attendees" },
];

const emptyTemplate = {
  name: "",
  title: "",
  message: "",
  action_url: "",
  default_channels: ["database"],
};

const emptyCampaign = {
  template_id: "",
  title: "",
  message: "",
  action_url: "",
  target_type: "all",
  target_user_id: "",
  target_role: "attendee",
  channels: ["database"],
};

function asCollection(result) {
  const first = result?.data ?? result;

  if (Array.isArray(first)) return first;
  if (Array.isArray(first?.data)) return first.data;
  if (Array.isArray(first?.data?.data)) return first.data.data;

  return [];
}

function prettifyRole(role) {
  return String(role || "user")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString();
}

export default function AdminNotificationsPage() {
  const [tab, setTab] = useState("compose");
  const [users, setUsers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [history, setHistory] = useState([]);
  const [campaign, setCampaign] = useState(emptyCampaign);
  const [templateForm, setTemplateForm] = useState(emptyTemplate);
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedTemplate = useMemo(
    () =>
      templates.find(
        (template) => String(template.id) === String(campaign.template_id)
      ) || null,
    [campaign.template_id, templates]
  );

  const recipientDescription = useMemo(() => {
    if (campaign.target_type === "all") {
      return `All ${users.length} registered users`;
    }

    if (campaign.target_type === "role") {
      const role = roles.find((item) => item.value === campaign.target_role);

      return role?.label || "Selected role";
    }

    const user = users.find(
      (item) => String(item.id) === String(campaign.target_user_id)
    );

    return user ? `${user.name} (${user.email})` : "Choose a user";
  }, [campaign.target_role, campaign.target_type, campaign.target_user_id, users]);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [usersResult, templatesResult, historyResult] = await Promise.all([
        usersApi.getAll({ per_page: 100 }),
        adminNotificationsApi.listTemplates(),
        adminNotificationsApi.listHistory(),
      ]);

      setUsers(asCollection(usersResult));
      setTemplates(asCollection(templatesResult));
      setHistory(asCollection(historyResult));
    } catch (requestError) {
      console.error("Unable to load admin notifications:", requestError);
      setError(
        requestError.message ||
          "Could not load notification data. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateCampaign = (field, value) => {
    setCampaign((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateTemplate = (field, value) => {
    setTemplateForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const toggleCampaignChannel = (channel) => {
    setCampaign((current) => {
      const exists = current.channels.includes(channel);
      const channels = exists
        ? current.channels.filter((item) => item !== channel)
        : [...current.channels, channel];

      return {
        ...current,
        channels: channels.length ? channels : ["database"],
      };
    });
  };

  const toggleTemplateChannel = (channel) => {
    setTemplateForm((current) => {
      const exists = current.default_channels.includes(channel);
      const channels = exists
        ? current.default_channels.filter((item) => item !== channel)
        : [...current.default_channels, channel];

      return {
        ...current,
        default_channels: channels.length ? channels : ["database"],
      };
    });
  };

  const applyTemplate = (templateId) => {
    const template = templates.find(
      (item) => String(item.id) === String(templateId)
    );

    updateCampaign("template_id", templateId);

    if (!template) return;

    setCampaign((current) => ({
      ...current,
      template_id: template.id,
      title: template.title || "",
      message: template.message || "",
      action_url: template.action_url || "",
      channels: template.default_channels?.length
        ? template.default_channels
        : ["database"],
    }));
  };

  const sendNotification = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!campaign.title.trim() || !campaign.message.trim()) {
      setError("A notification title and message are required.");
      return;
    }

    if (
      campaign.target_type === "user" &&
      !campaign.target_user_id
    ) {
      setError("Choose the user who should receive this notification.");
      return;
    }

    setSending(true);

    try {
      const payload = {
        template_id: campaign.template_id || null,
        title: campaign.title.trim(),
        message: campaign.message.trim(),
        action_url: campaign.action_url.trim() || null,
        target_type: campaign.target_type,
        target_user_id:
          campaign.target_type === "user"
            ? Number(campaign.target_user_id)
            : null,
        target_role:
          campaign.target_type === "role"
            ? campaign.target_role
            : null,
        channels: campaign.channels,
      };

      const result = await adminNotificationsApi.send(payload);
      const created = result?.data ?? result;

      setHistory((current) => [
        created?.data ?? created,
        ...current,
      ]);

      setMessage("Notification sent successfully.");
      setCampaign(emptyCampaign);
      setTab("history");
    } catch (requestError) {
      console.error("Unable to send notification:", requestError);
      setError(
        requestError.message ||
          "Could not send the notification. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  const saveTemplate = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (
      !templateForm.name.trim() ||
      !templateForm.title.trim() ||
      !templateForm.message.trim()
    ) {
      setError("Template name, title and message are required.");
      return;
    }

    setSavingTemplate(true);

    try {
      const payload = {
        name: templateForm.name.trim(),
        title: templateForm.title.trim(),
        message: templateForm.message.trim(),
        action_url: templateForm.action_url.trim() || null,
        default_channels: templateForm.default_channels,
      };

      const result = editingTemplateId
        ? await adminNotificationsApi.updateTemplate(
            editingTemplateId,
            payload
          )
        : await adminNotificationsApi.createTemplate(payload);

      const saved = result?.data ?? result;
      const savedTemplate = saved?.data ?? saved;

      setTemplates((current) => {
        const withoutSaved = current.filter(
          (item) => item.id !== savedTemplate.id
        );

        return [savedTemplate, ...withoutSaved];
      });

      setTemplateForm(emptyTemplate);
      setEditingTemplateId(null);
      setMessage(
        editingTemplateId
          ? "Notification template updated."
          : "Notification template created."
      );
    } catch (requestError) {
      console.error("Unable to save template:", requestError);
      setError(
        requestError.message ||
          "Could not save the template. Please try again."
      );
    } finally {
      setSavingTemplate(false);
    }
  };

  const editTemplate = (template) => {
    setEditingTemplateId(template.id);
    setTemplateForm({
      name: template.name || "",
      title: template.title || "",
      message: template.message || "",
      action_url: template.action_url || "",
      default_channels: template.default_channels?.length
        ? template.default_channels
        : ["database"],
    });
    setTab("templates");
    setMessage("");
    setError("");
  };

  const deleteTemplate = async (template) => {
    const confirmed = window.confirm(
      `Delete the "${template.name}" notification template?`
    );

    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      await adminNotificationsApi.deleteTemplate(template.id);

      setTemplates((current) =>
        current.filter((item) => item.id !== template.id)
      );

      if (String(campaign.template_id) === String(template.id)) {
        updateCampaign("template_id", "");
      }

      setMessage("Notification template deleted.");
    } catch (requestError) {
      console.error("Unable to delete template:", requestError);
      setError(
        requestError.message ||
          "Could not delete the template. Please try again."
      );
    }
  };

  return (
    <AdminLayout
      title="Notifications"
      subtitle="Platform communication"
      action={
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-[#dfe4ef] bg-white px-4 py-2.5 text-sm font-bold text-[#273454] shadow-sm transition hover:bg-[#f7f8fc] disabled:opacity-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      }
    >
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#07132f] via-[#162661] to-[#4a3ba5] p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10">
              <Bell size={24} />
            </span>

            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.14em] text-[#bdb8ff]">
                Communication centre
              </p>
              <h2 className="mt-1 text-2xl font-bold">
                Reach the right CMT users.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">
                Send a direct notification, role-based update or platform-wide
                announcement through the in-app notification centre, email, or both.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3">
              <strong className="block text-xl">{users.length}</strong>
              <span className="text-xs text-white/65">Users available</span>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3">
              <strong className="block text-xl">{templates.length}</strong>
              <span className="text-xs text-white/65">Saved templates</span>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 flex flex-wrap gap-2 border-b border-[#e4e8f0] pb-4">
        {[
          { id: "compose", label: "Compose", icon: Send },
          { id: "templates", label: "Templates", icon: FileText },
          { id: "history", label: "Send history", icon: History },
        ].map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                active
                  ? "bg-[#6655f6] text-white shadow-[0_8px_18px_rgba(102,85,246,.25)]"
                  : "bg-white text-[#64718a] hover:bg-[#f2f0ff] hover:text-[#5649dc]"
              }`}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </div>

      {message && (
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 size={18} />
          {message}
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-6 rounded-2xl border border-[#e4e8f0] bg-white p-12 text-center text-sm text-[#78849a]">
          Loading notification tools...
        </div>
      ) : null}

      {!loading && tab === "compose" && (
        <form
          onSubmit={sendNotification}
          className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]"
        >
          <section className="rounded-2xl border border-[#e4e8f0] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-[#18233f]">Compose notification</h3>
                <p className="mt-1 text-sm text-[#78849a]">
                  Use a saved template or write a new announcement.
                </p>
              </div>

              <select
                value={campaign.template_id}
                onChange={(event) => applyTemplate(event.target.value)}
                className="rounded-lg border border-[#dfe4ef] bg-white px-3 py-2 text-sm text-[#273454] outline-none focus:border-[#6655f6]"
              >
                <option value="">Start from scratch</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedTemplate && (
              <p className="mt-4 rounded-lg bg-[#f1efff] px-3 py-2 text-xs font-semibold text-[#5649dc]">
                Using template: {selectedTemplate.name}
              </p>
            )}

            <label className="mt-5 block text-xs font-extrabold uppercase tracking-[.08em] text-[#64718a]">
              Notification title
              <input
                value={campaign.title}
                onChange={(event) => updateCampaign("title", event.target.value)}
                maxLength={180}
                placeholder="Important CMT update"
                className="mt-2 w-full rounded-xl border border-[#dfe4ef] px-4 py-3 text-sm font-medium text-[#18233f] outline-none transition focus:border-[#6655f6] focus:ring-2 focus:ring-[#6655f6]/15"
              />
            </label>

            <label className="mt-5 block text-xs font-extrabold uppercase tracking-[.08em] text-[#64718a]">
              Message
              <textarea
                value={campaign.message}
                onChange={(event) =>
                  updateCampaign("message", event.target.value)
                }
                maxLength={5000}
                rows={8}
                placeholder="Write a clear and helpful announcement..."
                className="mt-2 w-full resize-y rounded-xl border border-[#dfe4ef] px-4 py-3 text-sm leading-6 text-[#18233f] outline-none transition focus:border-[#6655f6] focus:ring-2 focus:ring-[#6655f6]/15"
              />
            </label>

            <label className="mt-5 block text-xs font-extrabold uppercase tracking-[.08em] text-[#64718a]">
              Action link <span className="normal-case text-[#a0a8b8]">(optional)</span>
              <input
                value={campaign.action_url}
                onChange={(event) =>
                  updateCampaign("action_url", event.target.value)
                }
                maxLength={2048}
                placeholder="/conferences or https://..."
                className="mt-2 w-full rounded-xl border border-[#dfe4ef] px-4 py-3 text-sm text-[#18233f] outline-none transition focus:border-[#6655f6] focus:ring-2 focus:ring-[#6655f6]/15"
              />
            </label>
          </section>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-[#e4e8f0] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <Users size={17} className="text-[#6655f6]" />
                <h3 className="font-bold text-[#18233f]">Recipients</h3>
              </div>

              <div className="mt-4 space-y-2">
                {[
                  { value: "all", label: "All users" },
                  { value: "role", label: "By role" },
                  { value: "user", label: "Specific user" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm font-semibold transition ${
                      campaign.target_type === option.value
                        ? "border-[#b9b3ff] bg-[#f2f0ff] text-[#5649dc]"
                        : "border-[#e4e8f0] text-[#64718a] hover:bg-[#f8f9fc]"
                    }`}
                  >
                    <input
                      type="radio"
                      value={option.value}
                      checked={campaign.target_type === option.value}
                      onChange={(event) =>
                        updateCampaign("target_type", event.target.value)
                      }
                      className="accent-[#6655f6]"
                    />
                    {option.label}
                  </label>
                ))}
              </div>

              {campaign.target_type === "role" && (
                <select
                  value={campaign.target_role}
                  onChange={(event) =>
                    updateCampaign("target_role", event.target.value)
                  }
                  className="mt-4 w-full rounded-xl border border-[#dfe4ef] bg-white px-3 py-3 text-sm text-[#273454] outline-none focus:border-[#6655f6]"
                >
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              )}

              {campaign.target_type === "user" && (
                <select
                  value={campaign.target_user_id}
                  onChange={(event) =>
                    updateCampaign("target_user_id", event.target.value)
                  }
                  className="mt-4 w-full rounded-xl border border-[#dfe4ef] bg-white px-3 py-3 text-sm text-[#273454] outline-none focus:border-[#6655f6]"
                >
                  <option value="">Choose a user</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} — {user.email}
                    </option>
                  ))}
                </select>
              )}

              <p className="mt-4 rounded-lg bg-[#f8f9fc] px-3 py-2 text-xs leading-5 text-[#78849a]">
                <strong className="text-[#273454]">Audience:</strong>{" "}
                {recipientDescription}
              </p>
            </section>

            <section className="rounded-2xl border border-[#e4e8f0] bg-white p-5 shadow-sm">
              <h3 className="font-bold text-[#18233f]">Delivery channels</h3>

              <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-[#e4e8f0] p-3">
                <input
                  type="checkbox"
                  checked={campaign.channels.includes("database")}
                  onChange={() => toggleCampaignChannel("database")}
                  className="accent-[#6655f6]"
                />
                <Monitor size={16} className="text-[#6655f6]" />
                <span className="text-sm font-semibold text-[#273454]">
                  In-app notification
                </span>
              </label>

              <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-xl border border-[#e4e8f0] p-3">
                <input
                  type="checkbox"
                  checked={campaign.channels.includes("mail")}
                  onChange={() => toggleCampaignChannel("mail")}
                  className="accent-[#6655f6]"
                />
                <Mail size={16} className="text-[#6655f6]" />
                <span className="text-sm font-semibold text-[#273454]">
                  Send email
                </span>
              </label>
            </section>

            <button
              type="submit"
              disabled={sending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-4 py-3.5 text-sm font-extrabold text-white shadow-[0_12px_25px_rgba(102,85,246,.3)] transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send size={17} />
              {sending ? "Sending..." : "Send notification"}
            </button>
          </aside>
        </form>
      )}

      {!loading && tab === "templates" && (
        <div className="mt-6 grid gap-6 xl:grid-cols-[410px_minmax(0,1fr)]">
          <form
            onSubmit={saveTemplate}
            className="rounded-2xl border border-[#e4e8f0] bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-[#18233f]">
                  {editingTemplateId ? "Edit template" : "Create template"}
                </h3>
                <p className="mt-1 text-sm text-[#78849a]">
                  Reuse common announcements safely.
                </p>
              </div>

              {editingTemplateId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingTemplateId(null);
                    setTemplateForm(emptyTemplate);
                  }}
                  className="text-xs font-bold text-[#6655f6] hover:underline"
                >
                  Cancel
                </button>
              )}
            </div>

            <label className="mt-5 block text-xs font-extrabold uppercase tracking-[.08em] text-[#64718a]">
              Template name
              <input
                value={templateForm.name}
                onChange={(event) => updateTemplate("name", event.target.value)}
                placeholder="Conference deadline reminder"
                className="mt-2 w-full rounded-xl border border-[#dfe4ef] px-3 py-2.5 text-sm outline-none focus:border-[#6655f6]"
              />
            </label>

            <label className="mt-4 block text-xs font-extrabold uppercase tracking-[.08em] text-[#64718a]">
              Title
              <input
                value={templateForm.title}
                onChange={(event) => updateTemplate("title", event.target.value)}
                placeholder="Submission deadline reminder"
                className="mt-2 w-full rounded-xl border border-[#dfe4ef] px-3 py-2.5 text-sm outline-none focus:border-[#6655f6]"
              />
            </label>

            <label className="mt-4 block text-xs font-extrabold uppercase tracking-[.08em] text-[#64718a]">
              Message
              <textarea
                value={templateForm.message}
                onChange={(event) =>
                  updateTemplate("message", event.target.value)
                }
                rows={6}
                placeholder="Your message..."
                className="mt-2 w-full rounded-xl border border-[#dfe4ef] px-3 py-2.5 text-sm outline-none focus:border-[#6655f6]"
              />
            </label>

            <label className="mt-4 block text-xs font-extrabold uppercase tracking-[.08em] text-[#64718a]">
              Default action link
              <input
                value={templateForm.action_url}
                onChange={(event) =>
                  updateTemplate("action_url", event.target.value)
                }
                placeholder="/conferences"
                className="mt-2 w-full rounded-xl border border-[#dfe4ef] px-3 py-2.5 text-sm outline-none focus:border-[#6655f6]"
              />
            </label>

            <div className="mt-4 flex gap-4 text-sm text-[#273454]">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={templateForm.default_channels.includes("database")}
                  onChange={() => toggleTemplateChannel("database")}
                  className="accent-[#6655f6]"
                />
                In-app
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={templateForm.default_channels.includes("mail")}
                  onChange={() => toggleTemplateChannel("mail")}
                  className="accent-[#6655f6]"
                />
                Email
              </label>
            </div>

            <button
              type="submit"
              disabled={savingTemplate}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#342b87] px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              <Plus size={16} />
              {savingTemplate
                ? "Saving..."
                : editingTemplateId
                  ? "Update template"
                  : "Save template"}
            </button>
          </form>

          <section className="rounded-2xl border border-[#e4e8f0] bg-white shadow-sm">
            <div className="border-b border-[#edf0f5] px-5 py-4">
              <h3 className="font-bold text-[#18233f]">Saved templates</h3>
              <p className="mt-1 text-sm text-[#78849a]">
                Select a template from Compose to use it in an announcement.
              </p>
            </div>

            {templates.length === 0 ? (
              <p className="p-10 text-center text-sm text-[#78849a]">
                No templates created yet.
              </p>
            ) : (
              <div className="divide-y divide-[#edf0f5]">
                {templates.map((template) => (
                  <article key={template.id} className="p-5">
                    <div className="flex flex-wrap justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-[#18233f]">
                          {template.name}
                        </h4>
                        <p className="mt-1 text-sm font-semibold text-[#5649dc]">
                          {template.title}
                        </p>
                        <p className="mt-2 max-w-2xl whitespace-pre-wrap text-sm leading-6 text-[#78849a]">
                          {template.message}
                        </p>
                      </div>

                      <div className="flex h-fit gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            applyTemplate(template.id);
                            setTab("compose");
                          }}
                          className="rounded-lg bg-[#f1efff] px-3 py-2 text-xs font-bold text-[#5649dc]"
                        >
                          Use
                        </button>
                        <button
                          type="button"
                          onClick={() => editTemplate(template)}
                          className="rounded-lg border border-[#dfe4ef] p-2 text-[#64718a] hover:bg-[#f8f9fc]"
                          aria-label={`Edit ${template.name}`}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTemplate(template)}
                          className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50"
                          aria-label={`Delete ${template.name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {!loading && tab === "history" && (
        <section className="mt-6 overflow-hidden rounded-2xl border border-[#e4e8f0] bg-white shadow-sm">
          <div className="border-b border-[#edf0f5] px-5 py-4">
            <h3 className="font-bold text-[#18233f]">Notification send history</h3>
            <p className="mt-1 text-sm text-[#78849a]">
              Every platform announcement sent by an administrator is recorded here.
            </p>
          </div>

          {history.length === 0 ? (
            <div className="p-12 text-center">
              <History size={30} className="mx-auto text-[#a0a8b8]" />
              <p className="mt-3 text-sm text-[#78849a]">
                No announcements have been sent yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#edf0f5]">
              {history.map((campaignItem) => (
                <article
                  key={campaignItem.id}
                  className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-[#18233f]">
                        {campaignItem.title}
                      </h4>
                      <span className="rounded-full bg-[#f1efff] px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#5649dc]">
                        {campaignItem.target_type === "all"
                          ? "All users"
                          : campaignItem.target_type === "role"
                            ? prettifyRole(campaignItem.target_value)
                            : "Specific user"}
                      </span>
                    </div>

                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#78849a]">
                      {campaignItem.message}
                    </p>

                    <p className="mt-3 text-xs text-[#9aa3b3]">
                      Sent by {campaignItem.sender?.name || "Administrator"} ·{" "}
                      {formatDate(campaignItem.sent_at)}
                    </p>
                  </div>

                  <div className="grid shrink-0 grid-cols-2 gap-2 lg:w-[190px]">
                    <div className="rounded-xl bg-[#f8f9fc] px-3 py-2 text-center">
                      <strong className="block text-sm text-[#18233f]">
                        {campaignItem.recipient_count ?? 0}
                      </strong>
                      <span className="text-[10px] text-[#78849a]">
                        Recipients
                      </span>
                    </div>

                    <div className="rounded-xl bg-[#f8f9fc] px-3 py-2 text-center">
                      <strong className="block text-xs text-[#18233f]">
                        {(campaignItem.channels || []).join(" + ") || "in-app"}
                      </strong>
                      <span className="text-[10px] text-[#78849a]">
                        Delivery
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </AdminLayout>
  );
}