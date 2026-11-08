import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Bookmark, ChevronLeft, ChevronRight, Heart, MessageCircle, MessageSquareText, Plus, RefreshCw, Search, Send, SlidersHorizontal, Sparkles, CheckCircle2, AlertTriangle, X, ShieldCheck, Pin, EyeOff, Trash2, LogIn, TrendingUp } from "lucide-react";
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
  const [sortBy, setSortBy] = useState("newest");
  const [likedIds, setLikedIds] = useState({});
  const [cardLikeBusy, setCardLikeBusy] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [notice, setNotice] = useState("");

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
    setDeleteConfirm(false); setSelectedId(id); setDetail(null); setDetailLoading(signedIn); setActionError(""); setReply("");
    if (!signedIn) {
      const preview = items.find((item) => item.id === id);
      setDetail(preview || null);
      setDetailLoading(false);
      return;
    }
    try { const next = unwrap(await discussionsApi.getById(id)); setDetail(next); setLikedIds((prev) => ({ ...prev, [id]: Boolean(next.is_liked_by_current_user) })); }
    catch (e) { setActionError(errorText(e)); }
    finally { setDetailLoading(false); }
  };
  const create = async (e) => {
    e.preventDefault(); if (saving) return;
    setSaving(true); setActionError("");
    try { await discussionsApi.create({ title: draft.title.trim(), body: draft.body.trim(), category: draft.category }); setCompose(false); setDraft(emptyDraft); setSearch(""); setQuery(""); setCategory("All"); setOnlySaved(false); setPage(1); if (page === 1 && category === "All" && !query) await load(); setNotice("Your discussion was published successfully!"); }
    catch (e) { setActionError(errorText(e)); }
    finally { setSaving(false); }
  };
  const manageDiscussion = async (action) => {
    if (!isAdmin || !detail || adminBusy) return;
    if (action === "delete" && !deleteConfirm) { setDeleteConfirm(true); return; }
    setDeleteConfirm(false);
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
      setNotice(action === "delete" ? "Discussion deleted." : action === "hide" ? "Discussion hidden." : "Discussion pin updated.");
    } catch (e) { setActionError(errorText(e)); }
    finally { setAdminBusy(false); }
  };
  const like = async () => {
    if (!detail || busyLike) return;
    setBusyLike(true); setActionError("");
    try { const data = unwrap(await discussionsApi.toggleLike(detail.id)); setDetail((d) => ({ ...d, is_liked_by_current_user: Boolean(data.liked), likes_count: Number(data.likes_count) })); setLikedIds((prev) => ({ ...prev, [detail.id]: Boolean(data.liked) })); await load(); }
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
  const likeCard = async (item) => {
    if (!signedIn) { navigate("/login", { state: { from: "/discussions" } }); return; }
    if (cardLikeBusy !== null) return;
    setCardLikeBusy(item.id); setActionError("");
    try {
      const result = unwrap(await discussionsApi.toggleLike(item.id));
      const liked = Boolean(result.liked);
      const count = Number(result.likes_count);
      setLikedIds((prev) => ({ ...prev, [item.id]: liked }));
      setItems((prev) => prev.map((entry) => entry.id === item.id ? { ...entry, likes_count: Number.isFinite(count) ? count : entry.likes_count, is_liked_by_current_user: liked } : entry));
      if (detail?.id === item.id) setDetail((prev) => ({ ...prev, likes_count: count, is_liked_by_current_user: liked }));
    } catch (e) { setError(errorText(e)); }
    finally { setCardLikeBusy(null); }
  };
  const toggleSaved = (id) => {
    const next = savedIds.includes(id) ? savedIds.filter((x) => x !== id) : [...savedIds, id];
    setSavedIds(next); try { localStorage.setItem("cmt_discussion_bookmarks", JSON.stringify(next)); } catch { /* private browsing */ }
  };
  const filtered = onlySaved ? items.filter((item) => savedIds.includes(item.id)) : items;
  const visible = [...filtered].sort((a, b) => {
    const likes = (item) => Number(item.likes_count || 0);
    const replies = (item) => Number(item.comments_count || 0);
    const score = (item) => likes(item) + replies(item);
    const newest = (item) => Date.parse(item.created_at) || 0;
    if (sortBy === "popular") return score(b) - score(a) || newest(b) - newest(a);
    if (sortBy === "liked") return likes(b) - likes(a) || newest(b) - newest(a);
    if (sortBy === "replies") return replies(b) - replies(a) || newest(b) - newest(a);
    return newest(b) - newest(a);
  });
  return <DiscussionWorkspaceLayout>
    <div className="min-w-0 text-[#14213d]">
      {notice && <div role="status" aria-live="polite" className="fixed left-1/2 top-24 z-[120] flex w-[min(92vw,440px)] -translate-x-1/2 items-center gap-3 rounded-2xl border border-emerald-200 bg-white p-4 text-sm font-semibold text-emerald-900 shadow-2xl motion-safe:animate-[cmt-notice-in_.35s_ease-out] motion-reduce:animate-none"><CheckCircle2 className="shrink-0 text-emerald-600" size={22}/><span className="flex-1">{notice}</span><button type="button" onClick={() => setNotice("")} aria-label="Dismiss notification" className="rounded-lg p-1 hover:bg-emerald-50"><X size={18}/></button></div>}
      <style>{`@keyframes cmt-notice-in { from { opacity:0; transform:translateY(-16px) scale(.96); } to { opacity:1; transform:translateY(0) scale(1); } } @keyframes cmt-publish-pop { 0% { transform:scale(.85); opacity:0; } 70% { transform:scale(1.06); } 100% { transform:scale(1); opacity:1; } }`}</style>
      <section className="rounded-[24px] bg-gradient-to-br from-[#081a46] via-[#182967] to-[#584bd0] p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5"><div className="max-w-2xl"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#c8c4ff]"><Sparkles size={16} /> CMT community</p><h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">Discussions</h1><p className="mt-3 text-sm leading-7 text-white/80">Explore conversations, exchange research ideas and get answers from the CMT community.</p></div>
          <div className="flex flex-wrap gap-2">{signedIn && <Link to="/my-discussions" className="inline-flex items-center gap-2 rounded-xl border border-white/35 px-4 py-3 text-sm font-bold hover:bg-white/10"><MessageSquareText size={17} /> My discussions</Link>}<button type="button" onClick={() => signedIn ? (setActionError(""), setCompose(true)) : navigate("/login")} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#3930a6] hover:bg-[#f0eeff]"><Plus size={17} /> Start discussion</button></div></div>
      </section>
      <section className="mt-6 rounded-2xl border border-[#e1e6f1] bg-white p-4 shadow-sm" aria-label="Discussion filters">
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); setQuery(search.trim()); }} className="flex flex-wrap gap-2"><label className="relative min-w-[180px] flex-1"><span className="sr-only">Search discussions</span><Search className="absolute left-3 top-3.5 text-[#6b7590]" size={18} /><input value={search} maxLength={100} onChange={(e) => setSearch(e.target.value)} placeholder="Search questions and topics" className="min-h-11 w-full rounded-xl border border-[#dbe1ee] bg-white pl-10 pr-3 text-sm text-[#14213d]" /></label><button className="rounded-xl bg-[#6252f5] px-5 py-2 font-bold text-white" type="submit">Search</button><button className="inline-flex items-center gap-2 rounded-xl border border-[#dbe1ee] px-3 text-sm font-semibold" type="button" onClick={() => { setSearch(""); setQuery(""); setCategory("All"); setOnlySaved(false); setPage(1); }}><SlidersHorizontal size={17} /> Reset</button></form>
        <div className="mt-4 flex flex-wrap items-center gap-2">{CATEGORIES.map((item) => <button key={item} type="button" onClick={() => { setCategory(item); setPage(1); }} aria-pressed={category === item} className={`rounded-full px-3 py-2 text-xs font-bold ${category === item ? "bg-[#172b63] text-white" : "bg-[#f0f2fa] text-[#4e5a76] hover:bg-[#e4e8f6]"}`}>{item}</button>)}<button type="button" onClick={() => setOnlySaved(!onlySaved)} aria-pressed={onlySaved} className={`ml-auto inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-bold ${onlySaved ? "bg-[#e9e5ff] text-[#4537bb]" : "bg-[#f0f2fa] text-[#4e5a76]"}`}><Bookmark size={15} /> Saved</button></div>
      </section>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm font-semibold text-[#172b63]"><TrendingUp size={18} /> Sort by
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded-xl border border-[#cdd4e3] bg-white px-3 py-2 text-[#172b63]">
            <option value="newest">Newest</option><option value="popular">Most popular (likes + replies)</option><option value="liked">Most liked</option><option value="replies">Most replies</option>
          </select>
        </label>
        {isAdmin && <span className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-900"><ShieldCheck size={17} /> Admin management enabled · Open a discussion to moderate</span>}
      </div>
      {error && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error} <button type="button" onClick={load} className="ml-2 font-bold underline">Retry</button></div>}
      <div className="mt-5 flex items-center justify-between gap-2"><h2 className="text-lg font-bold">Community conversations <span className="ml-2 text-sm font-normal text-[#68748c]">{!loading ? `${visible.length} shown` : ""}</span></h2><button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#5545d2] hover:bg-[#eeebff]"><RefreshCw size={16} /> Refresh</button></div>
      {loading ? <p role="status" className="mt-4 rounded-2xl bg-white p-8 text-sm">Loading discussions…</p> : visible.length === 0 ? <div className="mt-4 rounded-2xl border border-dashed border-[#cdd4e3] bg-white p-10 text-center"><MessageCircle className="mx-auto text-[#6556f6]" size={32} /><h3 className="mt-3 font-bold">No discussions found</h3><p className="mt-2 text-sm text-[#65718a]">Try another filter or start a conversation.</p></div> : <div className="mt-4 grid gap-4">{visible.map((item) => <article key={item.id} className="rounded-2xl border border-[#e1e6f1] bg-white p-5 shadow-sm transition hover:border-[#b8b0ff] sm:p-6"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><span className="rounded-full bg-[#eeeaff] px-3 py-1 text-xs font-bold text-[#5344c7]">{item.category || "General"}</span>{item.is_pinned && <span className="ml-2 text-xs font-bold text-[#584bd0]">Pinned</span>}<h3 className="mt-3 break-words text-lg font-extrabold">{item.title}</h3><p className="mt-2 line-clamp-3 break-words text-sm leading-6 text-[#64718a]">{item.body}</p></div><button type="button" onClick={() => toggleSaved(item.id)} aria-label={savedIds.includes(item.id) ? "Remove saved discussion" : "Save discussion"} aria-pressed={savedIds.includes(item.id)} className="shrink-0 rounded-lg p-2 text-[#5c50cb] hover:bg-[#f0edff]"><Bookmark size={19} fill={savedIds.includes(item.id) ? "currentColor" : "none"} /></button></div><div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[#edf0f6] pt-4 text-xs text-[#68748c]"><span>{item.user?.name || "CMT member"} · {formatDate(item.created_at)}</span><button type="button" onClick={() => openDetail(item.id)} aria-label={`Read and write replies to ${item.title}`} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-semibold text-[#4537bb] hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2"><MessageCircle size={17} /> {item.comments_count || 0} replies</button><button type="button" onClick={() => likeCard(item)} disabled={cardLikeBusy === item.id} aria-label={`${likedIds[item.id] ?? item.is_liked_by_current_user ? "Unlike" : "Like"} ${item.title}`} aria-pressed={Boolean(likedIds[item.id] ?? item.is_liked_by_current_user)} className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 font-semibold transition focus-visible:outline focus-visible:outline-2 ${likedIds[item.id] ?? item.is_liked_by_current_user ? "border-blue-500 bg-blue-600 text-white" : "border-[#dce2ed] bg-white text-[#64718a] hover:border-blue-400"}`}><Heart size={17} fill={likedIds[item.id] ?? item.is_liked_by_current_user ? "currentColor" : "none"} /> {item.likes_count || 0} likes</button><button type="button" onClick={() => openDetail(item.id)} className="ml-auto inline-flex items-center gap-1 font-bold text-[#5140c5] hover:underline">{signedIn ? "Read & reply" : "Read preview"} <ArrowRight size={15} /></button></div></article>)}</div>}
      {!loading && !onlySaved && lastPage > 1 && <nav aria-label="Discussion pages" className="mt-5 flex items-center justify-center gap-4"><button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border bg-white p-2 disabled:opacity-40" aria-label="Previous page"><ChevronLeft /></button><span className="text-sm">Page {page} of {lastPage}</span><button type="button" disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)} className="rounded-lg border bg-white p-2 disabled:opacity-40" aria-label="Next page"><ChevronRight /></button></nav>}
    </div>
    {compose && <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-[#07132f]/75 p-4" role="presentation"><div role="dialog" aria-modal="true" aria-labelledby="create-discussion-heading" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 text-[#14213d]"><div className="flex items-center justify-between"><h2 id="create-discussion-heading" className="text-xl font-bold">Start a discussion</h2><button type="button" aria-label="Close" onClick={() => setCompose(false)}><X /></button></div><form onSubmit={create} className="mt-5 grid gap-4"><label className="grid gap-1 text-sm font-semibold">Title<input required minLength={4} maxLength={180} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="rounded-xl border p-3" placeholder="What would you like to discuss?" /></label><label className="grid gap-1 text-sm font-semibold">Category<select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className="rounded-xl border p-3">{CATEGORIES.slice(1).map((c) => <option key={c}>{c}</option>)}</select></label><label className="grid gap-1 text-sm font-semibold">Details<textarea required minLength={10} maxLength={5000} rows={6} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} className="rounded-xl border p-3" placeholder="Add context to help others respond" /></label>{actionError && <p role="alert" className="text-sm text-red-700">{actionError}</p>}<button disabled={saving} type="submit" className="rounded-xl bg-[#6252f5] p-3 font-bold text-white disabled:opacity-60">{saving ? "Publishing…" : "Publish discussion"}</button></form></div></div>}
    {deleteConfirm && <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[#07132f]/75 p-4" role="presentation"><section role="alertdialog" aria-modal="true" aria-labelledby="discussion-delete-title" aria-describedby="discussion-delete-description" className="w-full max-w-md rounded-3xl bg-white p-6 text-[#14213d] shadow-2xl"><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600"><AlertTriangle size={24}/></div><h2 id="discussion-delete-title" className="text-xl font-extrabold">Delete this discussion?</h2><p id="discussion-delete-description" className="mt-2 text-sm leading-6 text-[#5b6780]">This permanently removes the discussion and its replies. This cannot be undone.</p><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setDeleteConfirm(false)} className="rounded-xl border px-4 py-2 font-semibold">Cancel</button><button type="button" disabled={adminBusy} onClick={() => manageDiscussion("delete")} className="rounded-xl bg-red-600 px-4 py-2 font-bold text-white disabled:opacity-50">{adminBusy ? "Deleting…" : "Delete discussion"}</button></div></section></div>}
    {selectedId !== null && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#07132f]/65 p-3 sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) { setSelectedId(null); setDetail(null); setDeleteConfirm(false); } }}>
      <section role="dialog" aria-modal="true" aria-labelledby="discussion-detail-heading" className="flex max-h-[min(92vh,900px)] h-full w-full max-w-[700px] flex-col overflow-hidden rounded-2xl bg-white text-[#14213d] shadow-2xl sm:h-auto sm:min-h-[65vh] sm:rounded-3xl">
        <header className="flex shrink-0 items-center justify-between border-b border-[#e7eaf3] px-5 py-4">
          <div><p className="text-xs font-bold uppercase tracking-wider text-[#6556db]">CMT community</p><h2 id="discussion-detail-heading" className="text-lg font-extrabold">Discussion replies</h2></div>
          <button type="button" onClick={() => { setSelectedId(null); setDetail(null); setDeleteConfirm(false); }} aria-label="Close replies" className="rounded-full border border-[#dfe3ee] p-2 hover:bg-[#f1f2fa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"><X size={20}/></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {detailLoading ? <p role="status">Loading replies…</p> : detail ? <>
            <div className="rounded-2xl bg-[#f4f5fc] p-4"><span className="text-xs font-bold text-[#5749cf]">{detail.category || "General"}</span><h3 className="mt-2 break-words text-lg font-extrabold">{detail.title}</h3><p className="mt-1 text-xs text-[#65718b]">{detail.user?.name || "CMT member"} · {formatDate(detail.created_at)}</p><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6">{detail.body}</p>
              {signedIn && <button type="button" onClick={like} disabled={busyLike} aria-pressed={Boolean(detail.is_liked_by_current_user)} className={`mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-bold ${detail.is_liked_by_current_user ? "border-blue-600 bg-blue-600 text-white" : "border-[#d9dfec] bg-white text-[#55627a]"}`}><Heart size={17} fill={detail.is_liked_by_current_user ? "currentColor" : "none"}/> {detail.likes_count || 0} likes</button>}
            </div>
            {isAdmin && <div className="mt-4 rounded-2xl border-2 border-indigo-200 bg-indigo-50 p-4"><h3 className="flex items-center gap-2 text-sm font-extrabold text-indigo-900"><ShieldCheck size={17}/> Manage discussion · Admin only</h3><div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={adminBusy} onClick={() => manageDiscussion("pin")} className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-sm font-semibold"><Pin size={15}/>{detail.is_pinned ? "Unpin" : "Pin"}</button><button type="button" disabled={adminBusy} onClick={() => manageDiscussion("hide")} className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-sm font-semibold"><EyeOff size={15}/> Hide</button><button type="button" disabled={adminBusy} onClick={() => manageDiscussion("delete")} className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-red-700"><Trash2 size={15}/> Delete</button></div></div>}
            {signedIn ? <><div className="mt-6 flex items-center justify-between"><h3 className="text-base font-extrabold">Replies <span className="text-[#6b7390]">({detail.comments?.length ?? detail.comments_count ?? 0})</span></h3><span className="text-xs text-[#68748c]">Community conversation</span></div>
              <div className="mt-4 space-y-5" aria-live="polite">{(detail.comments || []).length ? detail.comments.map((comment) => <article key={comment.id} className="flex items-start gap-3"><div aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e5e3ff] text-sm font-extrabold text-[#5141b8]">{(comment.user?.name || "C").trim().charAt(0).toUpperCase()}</div><div className="min-w-0 flex-1"><div className="rounded-2xl bg-[#f1f3f9] px-4 py-3"><p className="text-sm font-bold">{comment.user?.name || "CMT member"}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">{comment.body}</p></div><p className="mt-1 px-2 text-xs text-[#68748c]">{formatDate(comment.created_at)}</p></div></article>) : <p className="rounded-xl bg-[#f5f6fb] p-5 text-center text-sm text-[#66728a]">No replies yet. Be the first to reply.</p>}</div>
            </> : <div className="mt-5 rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-950"><p className="font-bold">Sign in to read replies</p><p className="mt-1">Sign in to see the full conversation and share your thoughts with the community.</p><Link to="/login" state={{ from: "/discussions" }} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-indigo-700 px-4 py-2 font-bold text-white"><LogIn size={16}/> Sign in to reply</Link></div>}
          </> : <p role="alert">Discussion unavailable.</p>}
          {actionError && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{actionError}</p>}
        </div>
        {signedIn && detail && <form onSubmit={addReply} className="shrink-0 border-t border-[#e7eaf3] bg-white px-4 py-4 sm:px-6"><label htmlFor="discussion-reply" className="mb-2 block text-sm font-bold">Write a reply</label><div className="flex items-end gap-2"><textarea id="discussion-reply" required minLength={2} maxLength={2000} rows={2} value={reply} onChange={(e) => setReply(e.target.value)} className="max-h-36 min-h-12 flex-1 resize-y rounded-2xl border border-[#d9dfeb] bg-[#f8f9fd] px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none" placeholder="Write a reply…"/><button disabled={replying || reply.trim().length < 2} type="submit" aria-label="Post reply" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#6252f5] text-white disabled:opacity-50"><Send size={19}/></button></div><p className="mt-2 text-xs text-[#68748c]">{replying ? "Posting your reply…" : "Be respectful and keep replies relevant."}</p></form>}
      </section>
    </div>}
  </DiscussionWorkspaceLayout>;
}
