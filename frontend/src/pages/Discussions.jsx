import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Bookmark, ChevronLeft, ChevronRight, Heart, MessageCircle, MessageSquareText, Plus, RefreshCw, Search, Send, SlidersHorizontal, Sparkles, X, ShieldCheck, Pin, EyeOff, Trash2, LogIn } from "lucide-react";
import { discussionsApi } from "../api/discussionsApi";
import { useAuth } from "../context/AuthContext";
import DiscussionWorkspaceLayout from "../components/DiscussionWorkspaceLayout";

const CATEGORIES = ["All", "General", "Research", "Conference help", "Networking", "Calls for papers"];
const emptyDraft = { title: "", category: "General", body: "" };
const unwrap = (r) => r?.data ?? r;
const errorText = (e) => e?.message || "Something went wrong. Please try again.";
const formatDate = (value) => value && !Number.isNaN(Date.parse(value)) ? new Date(value).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }) : "Recently";

export default function Discussions() {
  const { status, role } = useAuth();
  const isAdmin = status === "authenticated" && role === "admin";
  const navigate = useNavigate();
  const signedIn = status === "authenticated";
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [compose, setCompose] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [replying, setReplying] = useState(false);
  const [busyLike, setBusyLike] = useState(false);
  const [adminBusy, setAdminBusy] = useState(false);
  const [savedIds, setSavedIds] = useState(() => { try { return JSON.parse(localStorage.getItem("cmt_discussion_bookmarks") || "[]"); } catch { return []; } });
  const [onlySaved, setOnlySaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = unwrap(await discussionsApi.getAll({ page, ...(category !== "All" ? { category } : {}), ...(query ? { search: query } : {}) }));
      setItems(Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : []);
      setLastPage(Math.max(1, Number(response?.last_page || 1)));
    } catch (e) { setError(errorText(e)); }
    finally { setLoading(false); }
  }, [page, category, query]);
  useEffect(() => { load(); }, [load]);

  const openDetail = async (id) => {
    setSelectedId(id); setDetail(null); setDetailLoading(signedIn); setActionError(""); setReply("");
    if (!signedIn) {
      const preview = items.find((item) => item.id === id);
      setDetail(preview || null);
      setDetailLoading(false);
      return;
    }
    try { setDetail(unwrap(await discussionsApi.getById(id))); }
    catch (e) { setActionError(errorText(e)); }
    finally { setDetailLoading(false); }
  };
  const create = async (e) => {
    e.preventDefault(); if (saving) return;
    setSaving(true); setActionError("");
    try { await discussionsApi.create({ title: draft.title.trim(), body: draft.body.trim(), category: draft.category }); setCompose(false); setDraft(emptyDraft); setSearch(""); setQuery(""); setCategory("All"); setOnlySaved(false); setPage(1); if (page === 1 && category === "All" && !query) await load(); }
    catch (e) { setActionError(errorText(e)); }
    finally { setSaving(false); }
  };
  const manageDiscussion = async (action) => {
    if (!isAdmin || !detail || adminBusy) return;
    if (action === "delete" && !window.confirm("Permanently delete this discussion and its replies?")) return;
    setAdminBusy(true); setActionError("");
    try {
      if (action === "delete") {
        await discussionsApi.remove(detail.id);
        setSelectedId(null); setDetail(null);
      } else {
        await discussionsApi.setVisibility(detail.id, {
          is_hidden: action === "hide",
          is_pinned: action === "pin" ? !detail.is_pinned : Boolean(detail.is_pinned),
        });
        if (action === "hide") { setSelectedId(null); setDetail(null); }
        else setDetail((current) => ({ ...current, is_pinned: !current.is_pinned }));
      }
      await load();
    } catch (e) { setActionError(errorText(e)); }
    finally { setAdminBusy(false); }
  };
  const like = async () => {
    if (!detail || busyLike) return;
    setBusyLike(true); setActionError("");
    try { const data = unwrap(await discussionsApi.toggleLike(detail.id)); setDetail((d) => ({ ...d, is_liked_by_current_user: Boolean(data.liked), likes_count: Number(data.likes_count) })); await load(); }
    catch (e) { setActionError(errorText(e)); }
    finally { setBusyLike(false); }
  };
  const addReply = async (e) => {
    e.preventDefault(); if (!detail || replying) return;
    setReplying(true); setActionError("");
    try { await discussionsApi.addComment(detail.id, reply.trim()); setReply(""); setDetail(unwrap(await discussionsApi.getById(detail.id))); await load(); }
    catch (e) { setActionError(errorText(e)); }
    finally { setReplying(false); }
  };
  const toggleSaved = (id) => {
    const next = savedIds.includes(id) ? savedIds.filter((x) => x !== id) : [...savedIds, id];
    setSavedIds(next); try { localStorage.setItem("cmt_discussion_bookmarks", JSON.stringify(next)); } catch { /* private browsing */ }
  };
  const visible = onlySaved ? items.filter((item) => savedIds.includes(item.id)) : items;
  return <DiscussionWorkspaceLayout>
    <div className="min-w-0 text-[#14213d]">
      <section className="rounded-[24px] bg-gradient-to-br from-[#081a46] via-[#182967] to-[#584bd0] p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5"><div className="max-w-2xl"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#c8c4ff]"><Sparkles size={16} /> CMT community</p><h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">Discussions</h1><p className="mt-3 text-sm leading-7 text-white/80">Explore conversations, exchange research ideas and get answers from the CMT community.</p></div>
          <div className="flex flex-wrap gap-2">{signedIn && <Link to="/my-discussions" className="inline-flex items-center gap-2 rounded-xl border border-white/35 px-4 py-3 text-sm font-bold hover:bg-white/10"><MessageSquareText size={17} /> My discussions</Link>}<button type="button" onClick={() => signedIn ? (setActionError(""), setCompose(true)) : navigate("/login")} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#3930a6] hover:bg-[#f0eeff]"><Plus size={17} /> Start discussion</button></div></div>
      </section>
      <section className="mt-6 rounded-2xl border border-[#e1e6f1] bg-white p-4 shadow-sm" aria-label="Discussion filters">
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); setQuery(search.trim()); }} className="flex flex-wrap gap-2"><label className="relative min-w-[180px] flex-1"><span className="sr-only">Search discussions</span><Search className="absolute left-3 top-3.5 text-[#6b7590]" size={18} /><input value={search} maxLength={100} onChange={(e) => setSearch(e.target.value)} placeholder="Search questions and topics" className="min-h-11 w-full rounded-xl border border-[#dbe1ee] bg-white pl-10 pr-3 text-sm text-[#14213d]" /></label><button className="rounded-xl bg-[#6252f5] px-5 py-2 font-bold text-white" type="submit">Search</button><button className="inline-flex items-center gap-2 rounded-xl border border-[#dbe1ee] px-3 text-sm font-semibold" type="button" onClick={() => { setSearch(""); setQuery(""); setCategory("All"); setOnlySaved(false); setPage(1); }}><SlidersHorizontal size={17} /> Reset</button></form>
        <div className="mt-4 flex flex-wrap items-center gap-2">{CATEGORIES.map((item) => <button key={item} type="button" onClick={() => { setCategory(item); setPage(1); }} aria-pressed={category === item} className={`rounded-full px-3 py-2 text-xs font-bold ${category === item ? "bg-[#172b63] text-white" : "bg-[#f0f2fa] text-[#4e5a76] hover:bg-[#e4e8f6]"}`}>{item}</button>)}<button type="button" onClick={() => setOnlySaved(!onlySaved)} aria-pressed={onlySaved} className={`ml-auto inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-bold ${onlySaved ? "bg-[#e9e5ff] text-[#4537bb]" : "bg-[#f0f2fa] text-[#4e5a76]"}`}><Bookmark size={15} /> Saved</button></div>
      </section>
      {error && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error} <button type="button" onClick={load} className="ml-2 font-bold underline">Retry</button></div>}
      <div className="mt-5 flex items-center justify-between gap-2"><h2 className="text-lg font-bold">Community conversations <span className="ml-2 text-sm font-normal text-[#68748c]">{!loading ? `${visible.length} shown` : ""}</span></h2><button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#5545d2] hover:bg-[#eeebff]"><RefreshCw size={16} /> Refresh</button></div>
      {loading ? <p role="status" className="mt-4 rounded-2xl bg-white p-8 text-sm">Loading discussions…</p> : visible.length === 0 ? <div className="mt-4 rounded-2xl border border-dashed border-[#cdd4e3] bg-white p-10 text-center"><MessageCircle className="mx-auto text-[#6556f6]" size={32} /><h3 className="mt-3 font-bold">No discussions found</h3><p className="mt-2 text-sm text-[#65718a]">Try another filter or start a conversation.</p></div> : <div className="mt-4 grid gap-4">{visible.map((item) => <article key={item.id} className="rounded-2xl border border-[#e1e6f1] bg-white p-5 shadow-sm transition hover:border-[#b8b0ff] sm:p-6"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><span className="rounded-full bg-[#eeeaff] px-3 py-1 text-xs font-bold text-[#5344c7]">{item.category || "General"}</span>{item.is_pinned && <span className="ml-2 text-xs font-bold text-[#584bd0]">Pinned</span>}<h3 className="mt-3 break-words text-lg font-extrabold">{item.title}</h3><p className="mt-2 line-clamp-3 break-words text-sm leading-6 text-[#64718a]">{item.body}</p></div><button type="button" onClick={() => toggleSaved(item.id)} aria-label={savedIds.includes(item.id) ? "Remove saved discussion" : "Save discussion"} aria-pressed={savedIds.includes(item.id)} className="shrink-0 rounded-lg p-2 text-[#5c50cb] hover:bg-[#f0edff]"><Bookmark size={19} fill={savedIds.includes(item.id) ? "currentColor" : "none"} /></button></div><div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[#edf0f6] pt-4 text-xs text-[#68748c]"><span>{item.user?.name || "CMT member"} · {formatDate(item.created_at)}</span><span className="inline-flex items-center gap-1"><MessageCircle size={15} /> {item.comments_count || 0} replies</span><span className="inline-flex items-center gap-1"><Heart size={15} /> {item.likes_count || 0} likes</span><button type="button" onClick={() => openDetail(item.id)} className="ml-auto inline-flex items-center gap-1 font-bold text-[#5140c5] hover:underline">{signedIn ? "Read & reply" : "Read preview"} <ArrowRight size={15} /></button></div></article>)}</div>}
      {!loading && !onlySaved && lastPage > 1 && <nav aria-label="Discussion pages" className="mt-5 flex items-center justify-center gap-4"><button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border bg-white p-2 disabled:opacity-40" aria-label="Previous page"><ChevronLeft /></button><span className="text-sm">Page {page} of {lastPage}</span><button type="button" disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)} className="rounded-lg border bg-white p-2 disabled:opacity-40" aria-label="Next page"><ChevronRight /></button></nav>}
    </div>
    {compose && <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-[#07132f]/75 p-4" role="presentation"><div role="dialog" aria-modal="true" aria-labelledby="create-discussion-heading" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 text-[#14213d]"><div className="flex items-center justify-between"><h2 id="create-discussion-heading" className="text-xl font-bold">Start a discussion</h2><button type="button" aria-label="Close" onClick={() => setCompose(false)}><X /></button></div><form onSubmit={create} className="mt-5 grid gap-4"><label className="grid gap-1 text-sm font-semibold">Title<input required minLength={4} maxLength={180} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="rounded-xl border p-3" placeholder="What would you like to discuss?" /></label><label className="grid gap-1 text-sm font-semibold">Category<select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className="rounded-xl border p-3">{CATEGORIES.slice(1).map((c) => <option key={c}>{c}</option>)}</select></label><label className="grid gap-1 text-sm font-semibold">Details<textarea required minLength={10} maxLength={5000} rows={6} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} className="rounded-xl border p-3" placeholder="Add context to help others respond" /></label>{actionError && <p role="alert" className="text-sm text-red-700">{actionError}</p>}<button disabled={saving} type="submit" className="rounded-xl bg-[#6252f5] p-3 font-bold text-white disabled:opacity-60">{saving ? "Publishing…" : "Publish discussion"}</button></form></div></div>}
    {selectedId !== null && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#07132f]/75 p-4"><section role="dialog" aria-modal="true" aria-labelledby="discussion-detail-heading" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 text-[#14213d]"><div className="flex justify-end"><button type="button" onClick={() => { setSelectedId(null); setDetail(null); }} aria-label="Close discussion"><X /></button></div>{detailLoading ? <p role="status">Loading conversation…</p> : detail ? <><p className="text-xs font-bold uppercase tracking-wide text-[#6252f5]">{detail.category}</p><h2 id="discussion-detail-heading" className="mt-2 break-words text-2xl font-bold">{detail.title}</h2><p className="mt-2 text-xs text-[#68748c]">{detail.user?.name || "CMT member"} · {formatDate(detail.created_at)}</p><p className="mt-5 whitespace-pre-wrap break-words leading-7">{detail.body}</p>{!signedIn && <div className="mt-5 rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-950"><p className="font-semibold">Want to read replies and join the conversation?</p><p className="mt-1">Sign in to view replies, like posts and contribute. Public replies require a backend permission change.</p><Link to="/login" state={{ from: "/discussions" }} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-indigo-700 px-4 py-2 font-bold text-white"><LogIn size={16} /> Sign in</Link></div>}{signedIn && <button type="button" onClick={like} disabled={busyLike} aria-pressed={Boolean(detail.is_liked_by_current_user)} className="mt-4 inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold text-[#5a49d5]"><Heart size={17} fill={detail.is_liked_by_current_user ? "currentColor" : "none"} /> {detail.likes_count || 0} likes</button>}{isAdmin && <div className="mt-4 flex flex-wrap gap-2 rounded-xl border border-indigo-100 bg-indigo-50 p-3"><span className="w-full text-xs font-bold uppercase tracking-wide text-indigo-900"><ShieldCheck size={15} className="mr-1 inline" /> Admin moderation</span><button type="button" disabled={adminBusy} onClick={() => manageDiscussion("pin")} className="inline-flex items-center gap-1 rounded-lg border bg-white px-3 py-2 text-sm font-semibold"><Pin size={15} /> {detail.is_pinned ? "Unpin" : "Pin"}</button><button type="button" disabled={adminBusy} onClick={() => manageDiscussion("hide")} className="inline-flex items-center gap-1 rounded-lg border bg-white px-3 py-2 text-sm font-semibold"><EyeOff size={15} /> Hide</button><button type="button" disabled={adminBusy} onClick={() => manageDiscussion("delete")} className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700"><Trash2 size={15} /> Delete</button></div>}{signedIn && <><h3 className="mt-6 border-t pt-5 font-bold">Replies ({detail.comments?.length || 0})</h3><div className="mt-3 space-y-3">{(detail.comments || []).map((comment) => <div key={comment.id} className="rounded-xl bg-[#f3f5fa] p-4"><p className="whitespace-pre-wrap break-words text-sm">{comment.body}</p><p className="mt-2 text-xs text-[#6b7690]">{comment.user?.name || "CMT member"} · {formatDate(comment.created_at)}</p></div>)}</div><form onSubmit={addReply} className="mt-5 grid gap-2"><label htmlFor="discussion-reply" className="text-sm font-bold">Add a reply</label><textarea id="discussion-reply" required minLength={2} maxLength={2000} rows={3} value={reply} onChange={(e) => setReply(e.target.value)} className="rounded-xl border p-3" placeholder="Share a helpful response" /><button disabled={replying} type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6252f5] px-5 py-3 font-bold text-white"><Send size={16} /> {replying ? "Posting…" : "Post reply"}</button></form></>} </> : <h2 id="discussion-detail-heading">Discussion unavailable</h2>}{actionError && <p role="alert" className="mt-3 text-sm text-red-700">{actionError}</p>}</section></div>}
  </DiscussionWorkspaceLayout>;
}
