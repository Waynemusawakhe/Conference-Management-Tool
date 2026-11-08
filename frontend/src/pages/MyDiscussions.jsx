import { Heart, MessageCircle, Pencil, Plus, Trash2, ArrowRight, CalendarDays, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DiscussionWorkspaceLayout from "../components/DiscussionWorkspaceLayout";
import { discussionsApi } from "../api/discussionsApi";

function listFrom(response) {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
}

function date(value) {
  return new Date(value).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function MyDiscussions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await discussionsApi.mine();
      setItems(listFrom(response));
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Could not load your discussions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totals = useMemo(() => items.reduce((result, item) => ({
    posts: result.posts + 1,
    comments: result.comments + Number(item.comments_count || 0),
    likes: result.likes + Number(item.likes_count || 0),
  }), { posts: 0, comments: 0, likes: 0 }), [items]);

  const remove = async (id) => {
    setDeleteId(null);
    try {
      await discussionsApi.remove(id);
      setItems((current) => current.filter((item) => item.id !== id));
      setNotice("Discussion deleted successfully.");
    } catch (requestError) {
      setError(requestError.message || "This discussion could not be deleted.");
    }
  };

  const save = async (event) => {
    event.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      const response = await discussionsApi.update(editing.id, editing);
      const updated = response?.data || response;
      setItems((current) => current.map((item) => item.id === updated.id ? { ...item, ...updated } : item));
      setEditing(null);
      setNotice("Your discussion changes were saved.");
    } catch (requestError) {
      setError(requestError.message || "Your changes could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DiscussionWorkspaceLayout>
      {notice && <div role="status" className="fixed left-1/2 top-24 z-[120] flex w-[min(92vw,440px)] -translate-x-1/2 items-center gap-3 rounded-2xl border border-emerald-200 bg-white p-4 text-sm font-semibold text-emerald-900 shadow-2xl"><CheckCircle2 size={22} className="text-emerald-600"/><span className="flex-1">{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss notification"><X size={18}/></button></div>}
      {deleteId !== null && <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[#07132f]/75 p-4"><section role="alertdialog" aria-modal="true" aria-labelledby="my-discussion-delete-title" className="w-full max-w-md rounded-3xl bg-white p-6 text-[#14213d] shadow-2xl"><AlertTriangle className="mb-4 text-red-600" size={28}/><h2 id="my-discussion-delete-title" className="text-xl font-extrabold">Delete your discussion?</h2><p className="mt-2 text-sm text-[#5b6780]">The discussion and its replies will be permanently removed.</p><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setDeleteId(null)} className="rounded-xl border px-4 py-2">Cancel</button><button type="button" onClick={() => remove(deleteId)} className="rounded-xl bg-red-600 px-4 py-2 font-bold text-white">Delete discussion</button></div></section></div>}
      <main className="mx-auto w-[min(1120px,calc(100%-40px))] py-12">
        <div className="flex flex-col justify-between gap-5 rounded-[28px] bg-gradient-to-br from-[#081a46] to-[#5d4bd9] px-7 py-9 text-white sm:flex-row sm:items-end sm:px-10">
          <div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#cac6ff]">Your community activity</p><h1 className="mt-2 text-3xl font-extrabold">My Discussions</h1><p className="mt-2 max-w-xl text-white/75">Manage the questions you have started and follow the responses from the CMT community.</p></div>
          <Link to="/discussions" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-[#3f35bd]"><Plus size={18} /> New discussion</Link>
        </div>

        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          {[['Discussions started', totals.posts], ['Replies received', totals.comments], ['Likes received', totals.likes]].map(([label, value]) => <div key={label} className="rounded-2xl border border-[#e3e7f0] bg-white p-5"><p className="text-sm text-[#68738a]">{label}</p><p className="mt-2 text-3xl font-extrabold">{value}</p></div>)}
        </section>

        {error ? <p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        {loading ? <p className="mt-6 rounded-2xl bg-white p-6 text-[#68738a]">Loading your activity…</p> : null}
        {!loading && items.length === 0 ? <section className="mt-6 rounded-2xl border border-dashed border-[#ccd4e2] bg-white p-10 text-center"><MessageCircle className="mx-auto text-[#6556f6]" /><h2 className="mt-3 font-bold">You have not started a discussion yet</h2><p className="mt-1 text-sm text-[#68738a]">Start a useful conversation around research or a conference.</p><Link to="/discussions" className="mt-5 inline-block rounded-xl bg-[#6252f5] px-5 py-3 font-bold text-white">Explore discussions</Link></section> : null}

        <section className="mt-6 space-y-4">
          {items.map((item) => <article key={item.id} className="rounded-2xl border border-[#e3e7f0] bg-white p-6 shadow-sm"><div className="flex flex-col justify-between gap-4 sm:flex-row"><div><p className="text-xs font-bold uppercase tracking-wide text-[#6556f6]">{item.category}</p><h2 className="mt-1 text-xl font-bold">{item.title}</h2><p className="mt-2 line-clamp-2 text-sm leading-6 text-[#68738a]">{item.body}</p><div className="mt-4 flex flex-wrap gap-4 text-sm text-[#68738a]"><span className="inline-flex items-center gap-1"><MessageCircle size={15} /> {item.comments_count || 0} replies</span><span className="inline-flex items-center gap-1"><Heart size={15} /> {item.likes_count || 0} likes</span><span className="inline-flex items-center gap-1"><CalendarDays size={15} /> {date(item.created_at)}</span></div></div><div className="flex shrink-0 flex-wrap gap-2"><Link to="/discussions" className="inline-flex h-10 items-center gap-1 rounded-xl border border-[#d6dcef] px-3 text-sm font-bold text-[#35415d]"><ArrowRight size={15} /> Browse</Link><button type="button" onClick={() => setEditing({ ...item })} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#d6dcef] px-3 text-sm font-bold text-[#35415d]"><Pencil size={15} /> Edit</button><button type="button" onClick={() => setDeleteId(item.id)} className="grid h-10 w-10 place-items-center rounded-xl border border-red-200 text-red-600" aria-label="Delete discussion"><Trash2 size={16} /></button></div></div>{item.comments?.length ? <div className="mt-5 border-t pt-4"><h3 className="text-sm font-bold">Latest replies</h3><div className="mt-3 space-y-2">{item.comments.map((comment) => <div key={comment.id} className="rounded-xl bg-[#f7f8fc] p-3 text-sm"><p>{comment.body}</p><p className="mt-1 text-xs text-[#7d8799]">{comment.user?.name || "CMT member"} · {date(comment.created_at)}</p></div>)}</div></div> : null}</article>)}
        </section>
      </main>

      {editing ? <div className="fixed inset-0 z-[60] grid place-items-center bg-[#07132f]/55 p-4"><form onSubmit={save} className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl"><h2 className="text-xl font-bold">Edit discussion</h2><div className="mt-5 space-y-3"><input required minLength="4" maxLength="180" value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} className="min-h-11 w-full rounded-xl border border-[#dce1ee] px-3" /><select value={editing.category} onChange={(event) => setEditing({ ...editing, category: event.target.value })} className="min-h-11 w-full rounded-xl border border-[#dce1ee] px-3"><option>General</option><option>Research</option><option>Conference help</option><option>Networking</option><option>Calls for papers</option></select><textarea required minLength="10" maxLength="5000" rows="7" value={editing.body} onChange={(event) => setEditing({ ...editing, body: event.target.value })} className="w-full rounded-xl border border-[#dce1ee] p-3" /></div><div className="mt-5 flex justify-end gap-3"><button type="button" onClick={() => setEditing(null)} className="rounded-xl px-4 py-3 font-bold text-[#56627b]">Cancel</button><button disabled={saving} className="rounded-xl bg-[#6252f5] px-5 py-3 font-bold text-white">{saving ? "Saving…" : "Save changes"}</button></div></form></div> : null}
    </DiscussionWorkspaceLayout>
  );
}
