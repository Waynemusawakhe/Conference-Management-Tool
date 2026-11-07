import { MessageCircle, Plus, Send, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { conferencesApi } from "../api/conferencesApi";
import { discussionsApi } from "../api/discussionsApi";
import { useAuth } from "../hooks/useAuth";

const CATEGORIES = [
  "General",
  "Research",
  "Conference help",
  "Networking",
  "Calls for papers",
];

function listFrom(response) {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response)) return response;
  return [];
}

function formatDate(value) {
  if (!value) return "Just now";

  return new Date(value).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Discussions() {
  const navigate = useNavigate();
  const { status } = useAuth();

  const [discussions, setDiscussions] = useState([]);
  const [conferences, setConferences] = useState([]);
  const [selected, setSelected] = useState(null);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [posting, setPosting] = useState(false);
  const [comment, setComment] = useState("");

  const [form, setForm] = useState({
    title: "",
    body: "",
    category: "General",
    conference_id: "",
  });

  const loadDiscussions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await discussionsApi.getAll({
        category,
        search,
        per_page: 30,
      });

      setDiscussions(listFrom(response));
    } catch (requestError) {
      setError(requestError.message || "Could not load discussions.");
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useEffect(() => {
    const timer = window.setTimeout(loadDiscussions, 250);

    return () => window.clearTimeout(timer);
  }, [loadDiscussions]);

  useEffect(() => {
    conferencesApi
      .getAll({ per_page: 100 })
      .then((response) => setConferences(listFrom(response)))
      .catch(() => setConferences([]));
  }, []);

  const openDiscussion = async (discussion) => {
    setSelected({
      ...discussion,
      loading: true,
    });

    try {
      const response = await discussionsApi.getById(discussion.id);

      setSelected(response?.data || response);
    } catch (requestError) {
      setError(requestError.message || "Could not open this discussion.");
      setSelected(null);
    }
  };

  const createDiscussion = async (event) => {
    event.preventDefault();

    setPosting(true);
    setError("");

    try {
      const response = await discussionsApi.create({
        ...form,
        conference_id: form.conference_id || null,
      });

      setForm({
        title: "",
        body: "",
        category: "General",
        conference_id: "",
      });

      setShowComposer(false);

      await loadDiscussions();
      await openDiscussion(response?.data || response);
    } catch (requestError) {
      setError(
        requestError.message || "Your discussion could not be published."
      );
    } finally {
      setPosting(false);
    }
  };

  const postComment = async (event) => {
    event.preventDefault();

    if (!selected || !comment.trim()) return;

    setPosting(true);

    try {
      const response = await discussionsApi.addComment(
        selected.id,
        comment.trim()
      );

      setSelected((current) => ({
        ...current,
        comments: [
          ...(current.comments || []),
          response?.data || response,
        ],
        comments_count: Number(current.comments_count || 0) + 1,
      }));

      setComment("");

      setDiscussions((items) =>
        items.map((item) =>
          item.id === selected.id
            ? {
                ...item,
                comments_count: Number(item.comments_count || 0) + 1,
              }
            : item
        )
      );
    } catch (requestError) {
      setError(requestError.message || "Your reply could not be posted.");
    } finally {
      setPosting(false);
    }
  };

  const authenticated = status === "authenticated";

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-[#14213d]">
      <Navbar />

      <main className="mx-auto w-[min(1180px,calc(100%-40px))] py-12">
        <section className="rounded-[28px] bg-gradient-to-br from-[#081a46] via-[#152c72] to-[#6250d9] px-7 py-10 text-white shadow-xl sm:px-10">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[#c7c2ff]">
            CMT community
          </p>

          <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-extrabold sm:text-4xl">
                Talk research. Solve conference questions. Meet your community.
              </h1>

              <p className="mt-3 text-white/75">
                A shared space for researchers, attendees, reviewers and
                organisers to learn from one another.
              </p>
            </div>

            {authenticated ? (
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/my-discussions"
                  className="inline-flex items-center justify-center rounded-xl border border-white/40 px-4 py-3 font-bold text-white"
                >
                  My activity
                </Link>

                <button
                  type="button"
                  onClick={() => setShowComposer(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-[#3f35bd] transition hover:-translate-y-0.5"
                >
                  <Plus size={18} />
                  Start a discussion
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="rounded-xl bg-white px-5 py-3 font-bold text-[#3f35bd]"
              >
                Join to contribute
              </button>
            )}
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search discussions"
                className="min-h-11 flex-1 rounded-xl border border-[#dce1ee] bg-white px-4 outline-none focus:border-[#6556f6]"
              />

              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="min-h-11 rounded-xl border border-[#dce1ee] bg-white px-3 outline-none focus:border-[#6556f6]"
              >
                <option value="">All topics</option>

                {CATEGORIES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>

            {error ? (
              <p className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            {loading ? (
              <p className="rounded-2xl bg-white p-6 text-[#66728b]">
                Loading discussions…
              </p>
            ) : null}

            {!loading && discussions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#cfd6e6] bg-white p-10 text-center">
                <MessageCircle className="mx-auto text-[#6758f6]" />

                <h2 className="mt-3 font-bold">
                  Be the first to start a conversation
                </h2>

                <p className="mt-1 text-sm text-[#66728b]">
                  Ask a practical question, share research advice, or connect
                  around a conference.
                </p>
              </div>
            ) : null}

            <div className="space-y-3">
              {discussions.map((discussion) => (
                <button
                  key={discussion.id}
                  type="button"
                  onClick={() => openDiscussion(discussion)}
                  className="w-full rounded-2xl border border-[#e2e6f0] bg-white p-5 text-left shadow-sm transition hover:border-[#a79eff] hover:shadow-md"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-[#6556f6]">
                    <span>{discussion.category}</span>

                    {discussion.is_pinned ? <span>• Pinned</span> : null}
                  </div>

                  <h2 className="mt-2 text-lg font-bold">
                    {discussion.title}
                  </h2>

                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#66728b]">
                    {discussion.body}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#7b8498]">
                    <span>{discussion.user?.name || "CMT member"}</span>
                    <span>{formatDate(discussion.created_at)}</span>
                    <span>{discussion.comments_count || 0} replies</span>

                    {discussion.conference ? (
                      <span>
                        {discussion.conference.code ||
                          discussion.conference.name}
                      </span>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <aside className="h-fit rounded-2xl border border-[#e2e6f0] bg-white p-6">
            <h2 className="font-bold">A useful community</h2>

            <ul className="mt-4 space-y-3 text-sm leading-6 text-[#66728b]">
              <li>
                Ask about registrations, calls for papers and programme
                planning.
              </li>
              <li>Share practical research and networking advice.</li>
              <li>
                Never post passwords, private reviews or confidential
                submissions.
              </li>
            </ul>

            {!authenticated ? (
              <p className="mt-5 border-t pt-5 text-sm text-[#66728b]">
                Want to reply?{" "}
                <Link
                  className="font-bold text-[#5c4cec]"
                  to="/register"
                >
                  Create your CMT account
                </Link>
                .
              </p>
            ) : null}
          </aside>
        </section>
      </main>

      {showComposer && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-[#07132f]/55 p-4">
          <form
            onSubmit={createDiscussion}
            className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Start a discussion</h2>

              <button
                type="button"
                onClick={() => setShowComposer(false)}
                aria-label="Close"
              >
                <X />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <input
                required
                minLength="4"
                maxLength="180"
                value={form.title}
                onChange={(event) =>
                  setForm({
                    ...form,
                    title: event.target.value,
                  })
                }
                placeholder="What would you like to discuss?"
                className="min-h-11 w-full rounded-xl border border-[#dce1ee] px-3 outline-none focus:border-[#6556f6]"
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      category: event.target.value,
                    })
                  }
                  className="min-h-11 rounded-xl border border-[#dce1ee] px-3"
                >
                  {CATEGORIES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>

                <select
                  value={form.conference_id}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      conference_id: event.target.value,
                    })
                  }
                  className="min-h-11 rounded-xl border border-[#dce1ee] px-3"
                >
                  <option value="">Not linked to a conference</option>

                  {conferences.map((conference) => (
                    <option key={conference.id} value={conference.id}>
                      {conference.code || conference.name}
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                required
                minLength="10"
                maxLength="5000"
                value={form.body}
                onChange={(event) =>
                  setForm({
                    ...form,
                    body: event.target.value,
                  })
                }
                rows="7"
                placeholder="Give the community enough context to help."
                className="w-full rounded-xl border border-[#dce1ee] p-3 outline-none focus:border-[#6556f6]"
              />
            </div>

            <button
              disabled={posting}
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#6252f5] px-5 font-bold text-white disabled:opacity-60"
            >
              <Send size={16} />
              {posting ? "Publishing…" : "Publish discussion"}
            </button>
          </form>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-[#07132f]/55 p-4">
          <div className="mx-auto my-6 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#6556f6]">
                  {selected.category}
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  {selected.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close"
              >
                <X />
              </button>
            </div>

            {selected.loading ? (
              <p className="mt-6 text-sm text-[#66728b]">
                Loading conversation…
              </p>
            ) : (
              <>
                <p className="mt-4 whitespace-pre-wrap leading-7 text-[#4d5870]">
                  {selected.body}
                </p>

                <p className="mt-4 text-xs text-[#7b8498]">
                  Posted by {selected.user?.name || "CMT member"} ·{" "}
                  {formatDate(selected.created_at)}
                </p>

                <section className="mt-7 border-t pt-5">
                  <h3 className="font-bold">
                    Replies (
                    {selected.comments_count ||
                      selected.comments?.length ||
                      0}
                    )
                  </h3>

                  <div className="mt-4 space-y-3">
                    {(selected.comments || []).map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl bg-[#f7f8fc] p-4"
                      >
                        <p className="text-sm leading-6 text-[#4d5870]">
                          {item.body}
                        </p>

                        <p className="mt-2 text-xs text-[#7b8498]">
                          {item.user?.name || "CMT member"} ·{" "}
                          {formatDate(item.created_at)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {authenticated ? (
                    <form onSubmit={postComment} className="mt-5 flex gap-2">
                      <input
                        value={comment}
                        onChange={(event) => setComment(event.target.value)}
                        minLength="2"
                        maxLength="2000"
                        required
                        placeholder="Write a helpful reply…"
                        className="min-h-11 flex-1 rounded-xl border border-[#dce1ee] px-3 outline-none focus:border-[#6556f6]"
                      />

                      <button
                        disabled={posting}
                        className="rounded-xl bg-[#6252f5] px-4 text-white disabled:opacity-60"
                        aria-label="Post reply"
                      >
                        <Send size={16} />
                      </button>
                    </form>
                  ) : (
                    <p className="mt-5 text-sm text-[#66728b]">
                      <Link to="/login" className="font-bold text-[#5c4cec]">
                        Log in
                      </Link>{" "}
                      to join this conversation.
                    </p>
                  )}
                </section>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}