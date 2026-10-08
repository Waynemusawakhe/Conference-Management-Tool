// src/pages/OrganiserDashboard.jsx



import { useCallback, useEffect, useMemo, useState } from "react";



import {



  AlertCircle,



  BarChart3,



  CalendarDays,



  Check,



  ChevronDown,



  ClipboardList,



  Download,



  FileText,



  Gavel,



  Pencil,



  Plus,



  Search,



  Sparkles,



  Trash2,



  UserPlus,



  Users,



  X,



} from "lucide-react";



import { useNavigate } from "react-router-dom";



import OrganiserLayout from "../components/OrganiserLayout";



import { useAuth } from "../context/AuthContext";



import { conferencesApi } from "../api/conferencesApi";



import { submissionsApi } from "../api/submissionsApi";



import { reviewsApi } from "../api/reviewsApi";



import { usersApi } from "../api/usersApi";



import { sessionsApi } from "../api/sessionsApi";







const STATUS_LABELS = {



  pending: "Pending",



  under_review: "Under review",



  accepted: "Accepted",



  rejected: "Rejected",



  revision_requested: "Revision requested",



  withdrawn: "Withdrawn",



};







const STATUS_STYLES = {



  pending: "border-[#e9d9a7] bg-[#fff9e9] text-[#9b7414]",



  under_review: "border-[#cfd0ff] bg-[#f0efff] text-[#5548d7]",



  accepted: "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]",



  rejected: "border-[#f1c8c8] bg-[#fff2f2] text-[#b13a3a]",



  revision_requested: "border-[#f0d0b9] bg-[#fff6ee] text-[#a55b25]",



  withdrawn: "border-[#d7dce5] bg-[#f4f6f9] text-[#68748b]",



};







function getErrorMessage(error) {



  const first = Object.values(error?.errors || {})[0];



  return Array.isArray(first)



    ? first[0]



    : first || error?.message || "Something went wrong.";



}







function unwrapList(response) {



  return Array.isArray(response) ? response : response?.data || [];



}







function dateLabel(value) {



  if (!value) return "—";



  const d = new Date(value);



  return Number.isNaN(d.getTime())



    ? value



    : d.toLocaleDateString(undefined, {



        day: "2-digit",



        month: "short",



        year: "numeric",



      });



}







function Modal({ title, children, onClose, wide = false }) {



  return (



    <div



      className="fixed inset-0 z-[100] grid place-items-center bg-[#07132f]/55 p-4 backdrop-blur-sm"



      onMouseDown={(e) => e.target === e.currentTarget && onClose()}



    >



      <div



        className={`max-h-[92vh] w-full overflow-y-auto rounded-[22px] bg-white p-5 text-[#0d1b3d] shadow-[0_30px_90px_rgba(7,19,47,.3)] dark:bg-[#0f172a] dark:text-white sm:p-7 ${



          wide ? "max-w-[820px]" : "max-w-[560px]"



        }`}



      >



        <div className="mb-6 flex items-start justify-between gap-4">



          <div>



            <span className="text-[10px] font-extrabold uppercase tracking-[.12em] text-[#6655f6] dark:text-[#a9a2ff]">



              Organiser workspace



            </span>



            <h2 className="mb-0 mt-1 text-xl font-bold tracking-[-.03em]">



              {title}



            </h2>



          </div>



          <button



            onClick={onClose}



            className="grid h-9 w-9 place-items-center rounded-xl bg-[#f3f5f9] text-[#657089] transition hover:bg-[#e9ecf3] dark:bg-[#1e293b] dark:text-white dark:hover:bg-[#334155]"



            aria-label="Close"



          >



            <X size={17} />



          </button>



        </div>



        {children}



      </div>



    </div>



  );



}







export default function OrganiserDashboard() {



  const navigate = useNavigate();



  const { user, logout } = useAuth();







  const [conferences, setConferences] = useState([]);



  const [selectedConference, setSelectedConference] = useState(null);



  const [submissions, setSubmissions] = useState([]);



  const [reviews, setReviews] = useState([]);



  const [registrations, setRegistrations] = useState([]);



  const [sessions, setSessions] = useState([]);







  const [loading, setLoading] = useState(true);



  const [detailLoading, setDetailLoading] = useState(false);



  const [error, setError] = useState("");







  const [query, setQuery] = useState("");



  const [statusFilter, setStatusFilter] = useState("all");







  const [modal, setModal] = useState(null);



  const [selectedSubmission, setSelectedSubmission] = useState(null);



  const [saving, setSaving] = useState(false);



  const [formError, setFormError] = useState("");



  const [reviewerId, setReviewerId] = useState("");



  const [reviewerCandidates, setReviewerCandidates] = useState([]);



  const [sessionForm, setSessionForm] = useState({

      title: "",

      submission_id: "",

      scheduled_time: "",

      room: "",

    });



  const [sessionSaving, setSessionSaving] = useState(false);







  const loadConferences = useCallback(async () => {



    setLoading(true);



    setError("");



    try {



      const response = await conferencesApi.getAll({ per_page: 100 });



      const all = unwrapList(response);



      const mine = all.filter(



        (c) =>



          Number(c.organiser_id) === Number(user?.id) ||



          Number(c.organiser?.id) === Number(user?.id)



      );



      setConferences(mine);



      setSelectedConference((current) =>



        current && mine.some((c) => c.id === current.id)



          ? mine.find((c) => c.id === current.id)



          : mine[0] || null



      );



    } catch (err) {



      setError(getErrorMessage(err));



    } finally {



      setLoading(false);



    }



  }, [user?.id]);









  const loadConferenceData =



  useCallback(



    async (conference) => {



      if (!conference) {



        setSubmissions([]);



        setReviews([]);



        setRegistrations([]);



        setSessions([]);



        return;



      }







      setDetailLoading(true);



      setError("");







      try {



        const [



          submissionResponse,



          registrationResponse,



          sessionResponse,



          reviewResponse,



        ] = await Promise.all([



          submissionsApi.getAll({



            conference_id:



              conference.id,







            per_page: 100,



          }),







          conferencesApi



            .getRegistrations(



              conference.id



            ),







          conferencesApi



            .getSessions(



              conference.id



            ),







          reviewsApi.getAll({



            per_page: 100,



          }),



        ]);







        const nextSubmissions =



          unwrapList(



            submissionResponse



          );







        const submissionIds =



          new Set(



            nextSubmissions.map(



              (submission) =>



                Number(



                  submission.id



                )



            )



          );







        const relevantReviews =



          unwrapList(



            reviewResponse



          ).filter(



            (review) =>



              submissionIds.has(



                Number(



                  review.submission_id



                )



              )



          );







        setSubmissions(



          nextSubmissions



        );







        setRegistrations(



          unwrapList(



            registrationResponse



          )



        );







        setSessions(



          unwrapList(



            sessionResponse



          )



        );







        setReviews(



          relevantReviews



        );



      } catch (err) {



        if (



          err?.status ===



          401



        ) {



          logout();



          return;



        }







        setError(



          getErrorMessage(



            err



          )



        );







        setReviews([]);



      } finally {



        setDetailLoading(



          false



        );



      }



    },



    [logout]



  );









  useEffect(() => {



    loadConferences();



  }, [loadConferences]);







  useEffect(() => {



    loadConferenceData(selectedConference);



  }, [selectedConference, loadConferenceData]);







  useEffect(() => {



    usersApi



      .getReviewers()



      .then((response) => setReviewerCandidates(unwrapList(response)))



      .catch(() => setReviewerCandidates([]));



  }, []);







  const filteredSubmissions = useMemo(() => {



    const q = query.trim().toLowerCase();



    return submissions.filter((s) => {



      const status = s.status || "pending";



      const matchesStatus = statusFilter === "all" || status === statusFilter;



      const author = s.author?.name || s.author_name || "";



      return (



        matchesStatus &&



        (!q ||



          [s.title, s.track, author, String(s.id)]



            .filter(Boolean)



            .join(" ")



            .toLowerCase()



            .includes(q))



      );



    });



  }, [submissions, query, statusFilter]);







  const stats = useMemo(



    () => ({



      submissions: submissions.length,



      pending: submissions.filter((s) => s.status === "pending").length,



      reviewed: submissions.filter((s) =>



        reviews.some(



          (r) =>



            Number(r.submission_id) === Number(s.id) &&



            (r.locked)



        )



      ).length,



      attendees: registrations.filter((r) => r.status !== "cancelled").length,



    }),



    [submissions, reviews, registrations]



  );







  const openCreateConference = () => navigate("/create-conference");



  const openEditConference = (c) => {



    if (!c?.id) return;



    navigate(`/edit-conference/${c.id}`);



  };







  const deleteConference = async () => {



    if (



      !selectedConference ||



      !window.confirm(



        `Delete "${selectedConference.name}"? This cannot be undone.`



      )



    )



      return;



    try {



      await conferencesApi.remove(selectedConference.id);



      setSelectedConference(null);



      await loadConferences();



    } catch (err) {



      setError(getErrorMessage(err));



    }



  };







  const toggleSubmissionStatus = async () => {



    if (!selectedConference) return;



    const next =



      selectedConference.submission_status === "open" ? "closed" : "open";



    try {



      await conferencesApi.updateStatus(selectedConference.id, next);



      await loadConferences();



    } catch (err) {



      setError(getErrorMessage(err));



    }



  };







  const openAssign = (submission) => {



    setSelectedSubmission(submission);



    const existing = reviews.find(



      (r) => Number(r.submission_id) === Number(submission.id) && r.reviewer_id



    );



    setReviewerId(existing?.reviewer_id ? String(existing.reviewer_id) : "");



    setFormError("");



    setModal("assign");



  };







  const assignReviewer = async (e) => {



    e.preventDefault();



    setFormError("");



    if (!reviewerId || !selectedSubmission?.id) {



      setFormError("Select a reviewer before assigning.");



      return;



    }



    setSaving(true);



    try {



      const existing = reviews.find(



        (r) => Number(r.submission_id) === Number(selectedSubmission.id)



      );



      if (existing && Number(existing.reviewer_id) !== Number(reviewerId)) {



        if (existing.locked || existing.submitted_at) {



          setFormError(



            "This review has already been submitted or locked and cannot be reassigned."



          );



          return;



        }



        await reviewsApi.remove(existing.id);



      }



      if (!existing || Number(existing.reviewer_id) !== Number(reviewerId)) {



        await reviewsApi.assign({



          submission_id: Number(selectedSubmission.id),



          reviewer_id: Number(reviewerId),



        });



      }



      if (selectedSubmission.status === "pending") {



        await submissionsApi.updateStatus(



          selectedSubmission.id,



          "under_review"



        );



      }



      setModal(null);



      await loadConferenceData(selectedConference);



    } catch (err) {



      setFormError(getErrorMessage(err));



    } finally {



      setSaving(false);



    }



  };







  const decide = async (submission, status) => {



    const related = reviews.filter(



      (r) => Number(r.submission_id) === Number(submission.id)



    );



    const lockedReview = related.find((r) => r.locked);



    if (!lockedReview) {



      setError(



        "A reviewer must submit and lock the review before the final decision can be recorded."



      );



      return;



    }



    const labels = {



      accepted: "accept",



      rejected: "reject",



      revision_requested: "request a revision",



    };



    if (



      !window.confirm(



        `Are you sure you want to ${labels[status]} "${submission.title}"?`



      )



    )



      return;



    try {



      await submissionsApi.updateStatus(submission.id, status);



      await loadConferenceData(selectedConference);



    } catch (err) {



      setError(getErrorMessage(err));



    }



  };







  const createSession = async (event) => {



    event.preventDefault();



    if (!selectedConference) return;



    if (

      !sessionForm.title.trim() ||

      !sessionForm.scheduled_time

    ) {

      setError("Session title and scheduled time are required.");

      return;

    }



    setSessionSaving(true);



    setError("");



    try {



      await sessionsApi.create({

          conference_id: Number(selectedConference.id),



          submission_id: sessionForm.submission_id

            ? Number(sessionForm.submission_id)

            : null,



          title: sessionForm.title.trim(),



          scheduled_time: sessionForm.scheduled_time,



          room: sessionForm.room.trim() || null,

        });



      setSessionForm({

        title: "",

        submission_id: "",

        scheduled_time: "",

        room: "",

      });



      await loadConferenceData(selectedConference);



    } catch (err) {



      setError(getErrorMessage(err));



    } finally {



      setSessionSaving(false);



    }



  };







  const removeSession = async (session) => {



    if (



      !window.confirm(`Remove session "${session.title || "Untitled session"}"?`)



    )



      return;



    try {



      await sessionsApi.remove(session.id);



      await loadConferenceData(selectedConference);



    } catch (err) {



      setError(getErrorMessage(err));



    }



  };







  const exportReport = () => {



    if (!selectedConference) return;



    const rows = [



      ["Conference", selectedConference.name],



      [



        "Date",



        `${dateLabel(selectedConference.start_date)} - ${dateLabel(



          selectedConference.end_date



        )}`,



      ],



      ["Submissions", submissions.length],



      ["Reviewed", stats.reviewed],



      ["Attendees", stats.attendees],



      ["Sessions", sessions.length],



      [],



      ["Submission ID", "Title", "Status", "Reviewer", "Recommendation"],



      ...submissions.map((submission) => {



        const review = reviews.find(



          (r) =>



            Number(r.submission_id) === Number(submission.id) &&



            (r.locked)



        );



        return [



          submission.id,



          submission.title,



          submission.status || "pending",



          review?.reviewer?.name || review?.reviewer_id || "Unassigned",



          review?.recommendation || "Pending",



        ];



      }),



    ];



    const csv = rows



      .map((row) =>



        row



          .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)



          .join(",")



      )



      .join("\n");



    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });



    const url = URL.createObjectURL(blob);



    const link = document.createElement("a");



    link.href = url;



    link.download = `${String(



      selectedConference.code || selectedConference.name



    )



      .replace(/[^a-z0-9]+/gi, "-")



      .toLowerCase()}-report.csv`;



    link.click();



    URL.revokeObjectURL(url);



  };







  const displayName = user?.name || "Organiser";







  return (



    <OrganiserLayout>



      {/* Hero */}



      <section



        id="overview"



        className="relative scroll-mt-24 overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_78%_18%,rgba(121,104,255,.22),transparent_25%),radial-gradient(circle_at_100%_100%,rgba(27,94,255,.18),transparent_36%),linear-gradient(135deg,#07132f_0%,#0a1740_52%,#15165a_100%)] p-6 text-white shadow-[0_18px_55px_rgba(15,28,65,.12)] sm:p-8"



      >



        <div className="absolute inset-0 opacity-[.16] [background-image:radial-gradient(rgba(255,255,255,.15)_0.7px,transparent_0.7px)] [background-size:22px_22px]" />



        <div className="relative flex items-end justify-between gap-6 max-[700px]:block">



          <div>



            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#b9b3ff]">



              <Sparkles size={14} /> Organiser dashboard



            </span>



            <h1 className="mb-2 mt-3 text-[clamp(28px,4vw,44px)] font-bold leading-tight tracking-[-.045em]">



              Welcome, {displayName.split(" ")[0]}.



            </h1>



            <p className="m-0 max-w-[620px] text-[12px] leading-6 text-white/65">



              Run your conferences from one workspace — monitor submissions,



              assign reviewers and make final decisions.



            </p>



          </div>



          <button



            onClick={openCreateConference}



            className="mt-5 inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-4 py-3 text-[12px] font-extrabold text-white shadow-[0_12px_28px_rgba(103,87,245,.28)] transition hover:-translate-y-px"



          >



            <Plus size={16} /> Create conference



          </button>



        </div>



      </section>







      {/* Error */}



      {error && (



        <div



          role="alert"



          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 dark:border-[#5b1e1e] dark:bg-[#2a1218] dark:text-[#f08a9a]"



        >



          <AlertCircle size={17} className="mt-0.5 shrink-0" />



          <span className="flex-1">{error}</span>



          <button



            onClick={() => {



              loadConferences();



              loadConferenceData(selectedConference);



            }}



            className="font-extrabold underline"



          >



            Retry



          </button>



        </div>



      )}







      {/* Stats */}



      <section className="grid grid-cols-4 gap-4 max-[1000px]:grid-cols-2 max-[520px]:grid-cols-1">



        {[



          [FileText, stats.submissions, "Submissions", "In selected conference"],



          [ClipboardList, stats.pending, "Awaiting action", "Pending submissions"],



          [Check, stats.reviewed, "Reviews received", "Locked reviews"],



          [Users, stats.attendees, "Attendees", "Active registrations"],



        ].map(([Icon, value, label, note]) => (



          <article



            key={label}



            className="rounded-[17px] border border-[#e4e8f0] bg-white p-4 shadow-[0_10px_28px_rgba(15,28,65,.04)] dark:border-[#1e293b] dark:bg-[#0f172a]"



          >



            <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#efedff] text-[#5c50ec] dark:bg-[#2a2354] dark:text-[#a9a2ff]">



              <Icon size={18} />



            </span>



            <strong className="mt-4 block text-[25px] leading-none tracking-[-.04em] text-[#0d1b3d] dark:text-white">



              {value}



            </strong>



            <p className="mb-0 mt-1.5 text-[11px] font-bold text-[#35415f] dark:text-[#cbd5e1]">



              {label}



            </p>



            <span className="text-[9px] text-[#8b95a8] dark:text-[#94a3b8]">



              {note}



            </span>



          </article>



        ))}



      </section>







      {/* Conference management */}



      <section



        id="conference-management"



        className="scroll-mt-24 rounded-[20px] border border-[#e4e8f0] bg-white shadow-[0_10px_30px_rgba(15,28,65,.035)] dark:border-[#1e293b] dark:bg-[#0f172a]"



      >



        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0f5] p-5 dark:border-[#1e293b] sm:p-6">



          <div>



            <span className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#6655f6] dark:text-[#a9a2ff]">



              Conference management



            </span>



            <h2 className="mb-0 mt-1 text-xl font-bold tracking-[-.03em] text-[#0d1b3d] dark:text-white">



              My conferences



            </h2>



          </div>



          <button



            onClick={openCreateConference}



            className="inline-flex items-center gap-2 rounded-xl bg-[#efedff] px-3.5 py-2.5 text-[10px] font-extrabold text-[#5548d7] transition hover:-translate-y-px dark:bg-[#2a2354] dark:text-[#a9a2ff]"



          >



            <Plus size={14} /> New conference



          </button>



        </div>







        {loading ? (



          <div className="p-10 text-center text-xs font-semibold text-[#7c879a] dark:text-[#94a3b8]">



            Loading your conferences…



          </div>



        ) : conferences.length ? (



          <div className="grid gap-3 p-4 sm:p-5">



            {conferences.map((c) => (



              <button



                key={c.id}



                onClick={() => setSelectedConference(c)}



                className={`w-full rounded-[15px] border p-4 text-left transition hover:-translate-y-px ${



                  selectedConference?.id === c.id



                    ? "border-[#bcb6ff] bg-[#f7f6ff] shadow-[0_8px_24px_rgba(103,87,245,.08)] dark:border-[#4c3fa8] dark:bg-[#1e1a44]"



                    : "border-[#e9ecf2] bg-[#fafbfe] dark:border-[#1e293b] dark:bg-[#0b1224]"



                }`}



              >



                <div className="flex flex-wrap items-start justify-between gap-3">



                  <div className="min-w-0 flex-1">



                    <div className="flex flex-wrap items-center gap-2">



                      <span className="text-[9px] font-extrabold uppercase tracking-wide text-[#6757f5] dark:text-[#a9a2ff]">



                        {c.code}



                      </span>



                      <span



                        className={`rounded-full px-2 py-1 text-[8px] font-extrabold ${



                          c.submission_status === "open"



                            ? "bg-emerald-50 text-emerald-700 dark:bg-[#052e1f] dark:text-[#34d399]"



                            : "bg-slate-100 text-slate-600 dark:bg-[#1e293b] dark:text-[#94a3b8]"



                        }`}



                      >



                        {c.submission_status === "open"



                          ? "Submissions open"



                          : "Submissions closed"}



                      </span>



                    </div>



                    <h3 className="mb-0 mt-1 truncate text-sm font-bold text-[#0d1b3d] dark:text-white">



                      {c.name}



                    </h3>



                    <p className="mb-0 mt-1 text-[9px] text-[#7e899c] dark:text-[#94a3b8]">



                      {dateLabel(c.start_date)} — {dateLabel(c.end_date)} ·{" "}



                      {c.city}, {c.country}



                    </p>



                  </div>



                  <ChevronDown



                    className={`mt-1 shrink-0 transition ${



                      selectedConference?.id === c.id



                        ? "rotate-180 text-[#5c50ec]"



                        : "text-[#9aa3b2]"



                    }`}



                    size={17}



                  />



                </div>



              </button>



            ))}



          </div>



        ) : (



          <div className="p-10 text-center">



            <CalendarDays



              size={22}



              className="mx-auto text-[#aab2c0] dark:text-[#64748b]"



            />



            <h3 className="mb-1 mt-3 text-sm font-bold text-[#0d1b3d] dark:text-white">



              No conferences yet



            </h3>



            <p className="mb-4 text-[10px] text-[#8993a6] dark:text-[#94a3b8]">



              Create your first conference to start receiving submissions.



            </p>



            <button



              onClick={openCreateConference}



              className="rounded-xl bg-[#6655f6] px-4 py-2.5 text-xs font-extrabold text-white transition hover:-translate-y-px"



            >



              Create conference



            </button>



          </div>



        )}







        {selectedConference && (



          <div className="border-t border-[#edf0f5] bg-[#fcfcfe] p-5 dark:border-[#1e293b] dark:bg-[#0b1224] sm:p-6">



            <div className="flex flex-wrap items-center justify-between gap-3">



              <div>



                <p className="m-0 text-[9px] font-extrabold uppercase tracking-[.1em] text-[#8c96a9] dark:text-[#94a3b8]">



                  Selected conference



                </p>



                <h3 className="mb-0 mt-1 text-lg font-bold text-[#0d1b3d] dark:text-white">



                  {selectedConference.name}



                </h3>



                <p className="m-0 mt-1 text-[10px] text-[#7c879a] dark:text-[#94a3b8]">



                  Submission deadline:{" "}



                  {dateLabel(selectedConference.submission_deadline)}



                </p>



              </div>



              <div className="flex flex-wrap gap-2">



                <button



                  onClick={() => openEditConference(selectedConference)}



                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#dfe4ed] bg-white px-3 py-2 text-[10px] font-extrabold text-[#58647b] transition hover:-translate-y-px dark:border-[#1e293b] dark:bg-[#0f172a] dark:text-[#94a3b8]"



                >



                  <Pencil size={13} /> Edit



                </button>



                <button



                  onClick={toggleSubmissionStatus}



                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#dfe4ed] bg-white px-3 py-2 text-[10px] font-extrabold text-[#58647b] transition hover:-translate-y-px dark:border-[#1e293b] dark:bg-[#0f172a] dark:text-[#94a3b8]"



                >



                  {selectedConference.submission_status === "open"



                    ? "Close submissions"



                    : "Open submissions"}



                </button>



                <button



                  onClick={deleteConference}



                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-[10px] font-extrabold text-red-700 transition hover:-translate-y-px dark:border-[#5b1e1e] dark:bg-[#2a1218] dark:text-[#f08a9a]"



                >



                  <Trash2 size={13} /> Delete



                </button>



              </div>



            </div>



          </div>



        )}



      </section>







      {/* Submissions */}



      <section



        id="submissions"



        className="scroll-mt-24 rounded-[20px] border border-[#e4e8f0] bg-white shadow-[0_10px_30px_rgba(15,28,65,.035)] dark:border-[#1e293b] dark:bg-[#0f172a]"



      >



        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0f5] p-5 dark:border-[#1e293b] sm:p-6">



          <div>



            <span className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#6655f6] dark:text-[#a9a2ff]">



              Manage submissions



            </span>



            <h2 className="mb-0 mt-1 text-xl font-bold tracking-[-.03em] text-[#0d1b3d] dark:text-white">



              {selectedConference?.name || "Select a conference"}



            </h2>



          </div>



          {selectedConference && (



            <div className="flex gap-2">



              <div className="relative">



                <Search



                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a1b3]"



                  size={14}



                />



                <input



                  value={query}



                  onChange={(e) => setQuery(e.target.value)}



                  placeholder="Search submissions…"



                  className="h-10 w-[180px] rounded-[10px] border border-[#e2e6ee] bg-[#fafbfe] pl-9 pr-3 text-[11px] outline-none focus:border-[#8175ef] dark:border-[#1e293b] dark:bg-[#0b1224] dark:text-white"



                />



              </div>



              <select



                value={statusFilter}



                onChange={(e) => setStatusFilter(e.target.value)}



                className="h-10 rounded-[10px] border border-[#e2e6ee] bg-[#fafbfe] px-3 text-[10px] font-semibold text-[#59657d] outline-none dark:border-[#1e293b] dark:bg-[#0b1224] dark:text-[#94a3b8]"



              >



                <option value="all">All statuses</option>



                {Object.entries(STATUS_LABELS).map(([v, l]) => (



                  <option key={v} value={v}>



                    {l}



                  </option>



                ))}



              </select>



            </div>



          )}



        </div>







        {!selectedConference ? (



          <div className="p-12 text-center text-xs text-[#8993a6] dark:text-[#94a3b8]">



            Create or select one of your conferences above.



          </div>



        ) : detailLoading ? (



          <div className="p-12 text-center text-xs font-semibold text-[#7c879a] dark:text-[#94a3b8]">



            Loading submissions, reviews and attendee data…



          </div>



        ) : filteredSubmissions.length ? (



          <>



            <div className="hidden overflow-x-auto md:block">



              <table className="w-full border-collapse text-left">



                <thead>



                  <tr className="border-b border-[#edf0f5] text-[9px] font-extrabold uppercase tracking-[.08em] text-[#9ba4b5] dark:border-[#1e293b]">



                    <th className="px-6 py-3">Submission</th>



                    <th className="px-4 py-3">Author</th>



                    <th className="px-4 py-3">Status</th>



                    <th className="px-4 py-3">Reviewer</th>



                    <th className="px-6 py-3 text-right">Decision / action</th>



                  </tr>



                </thead>



                <tbody>



                  {filteredSubmissions.map((s) => {



                    const related = reviews.filter(



                      (r) => Number(r.submission_id) === Number(s.id)



                    );



                    const reviewer = related[0]?.reviewer;



                    const status = s.status || "pending";



                    return (



                      <tr



                        key={s.id}



                        className="border-b border-[#f0f2f6] last:border-0 hover:bg-[#fbfbfe] dark:border-[#1e293b] dark:hover:bg-[#111c33]"



                      >



                        <td className="px-6 py-4">



                          <div className="flex gap-3">



                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[#f1efff] text-[#5b4fe3] dark:bg-[#2a2354] dark:text-[#a9a2ff]">



                              <FileText size={15} />



                            </span>



                            <div className="min-w-0">



                              <strong className="block max-w-[260px] truncate text-[11px] text-[#0d1b3d] dark:text-white">



                                {s.title}



                              </strong>



                              <span className="text-[9px] text-[#929bad] dark:text-[#94a3b8]">



                                #{s.id} · {s.track || "General track"}



                              </span>



                            </div>



                          </div>



                        </td>



                        <td className="px-4 py-4 text-[10px] font-semibold text-[#5c6880] dark:text-[#94a3b8]">



                          {s.author?.name || "Author"}



                        </td>



                        <td className="px-4 py-4">



                          <span



                            className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold ${



                              STATUS_STYLES[status] || STATUS_STYLES.pending



                            }`}



                          >



                            {STATUS_LABELS[status] || status}



                          </span>



                        </td>



                        <td className="px-4 py-4 text-[10px] text-[#68748b] dark:text-[#94a3b8]">



                          {reviewer?.name ||



                            (related.length



                              ? `User #${related[0]?.reviewer_id}`



                              : "Unassigned")}



                        </td>



                        <td className="px-6 py-4">



                          <div className="flex flex-wrap justify-end gap-1.5">



                            <button



                              onClick={() => openAssign(s)}



                              className="inline-flex items-center gap-1 rounded-lg bg-[#efedff] px-2.5 py-2 text-[9px] font-extrabold text-[#5548d7] transition hover:bg-[#e5e2ff] dark:bg-[#2a2354] dark:text-[#a9a2ff]"



                            >



                              <UserPlus size={12} />{" "}



                              {related.length ? "Reassign" : "Assign"}



                            </button>



                            {related.some((r) => r.locked) &&



                              status !== "accepted" && (



                                <button



                                  onClick={() => decide(s, "accepted")}



                                  className="rounded-lg bg-emerald-50 px-2.5 py-2 text-[9px] font-extrabold text-emerald-700 transition hover:-translate-y-px dark:bg-[#052e1f] dark:text-[#34d399]"



                                >



                                  Accept



                                </button>



                              )}



                            {related.some((r) => r.locked) &&



                              status !== "rejected" && (



                                <button



                                  onClick={() => decide(s, "rejected")}



                                  className="rounded-lg bg-red-50 px-2.5 py-2 text-[9px] font-extrabold text-red-700 transition hover:-translate-y-px dark:bg-[#2a1218] dark:text-[#f08a9a]"



                                >



                                  Reject



                                </button>



                              )}



                            {related.some((r) => r.locked) &&



                              status !== "revision_requested" && (



                                <button



                                  onClick={() => decide(s, "revision_requested")}



                                  className="rounded-lg bg-orange-50 px-2.5 py-2 text-[9px] font-extrabold text-orange-700 transition hover:-translate-y-px dark:bg-[#2a1a08] dark:text-[#fbbf24]"



                                >



                                  Revise



                                </button>



                              )}



                            {!related.some((r) => r.locked) &&



                              related.length > 0 && (



                                <span className="inline-flex items-center rounded-lg bg-amber-50 px-2.5 py-2 text-[9px] font-extrabold text-amber-700 dark:bg-[#2a1a08] dark:text-[#fbbf24]">



                                  Awaiting review



                                </span>



                              )}



                          </div>



                        </td>



                      </tr>



                    );



                  })}



                </tbody>



              </table>



            </div>







            <div className="divide-y divide-[#edf0f5] dark:divide-[#1e293b] md:hidden">



              {filteredSubmissions.map((s) => {



                const related = reviews.filter(



                  (r) => Number(r.submission_id) === Number(s.id)



                );



                const status = s.status || "pending";



                return (



                  <article key={s.id} className="p-4">



                    <div className="flex gap-3">



                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[#f1efff] text-[#5b4fe3] dark:bg-[#2a2354] dark:text-[#a9a2ff]">



                        <FileText size={15} />



                      </span>



                      <div className="min-w-0 flex-1">



                        <strong className="block text-[11px] text-[#0d1b3d] dark:text-white">



                          {s.title}



                        </strong>



                        <p className="mb-2 mt-1 text-[9px] text-[#8c96a9] dark:text-[#94a3b8]">



                          {s.author?.name || "Author"} ·{" "}



                          {s.track || "General track"}



                        </p>



                        <span



                          className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold ${



                            STATUS_STYLES[status] || STATUS_STYLES.pending



                          }`}



                        >



                          {STATUS_LABELS[status] || status}



                        </span>



                      </div>



                    </div>



                    <div className="mt-3 flex flex-wrap gap-1.5">



                      <button



                        onClick={() => openAssign(s)}



                        className="rounded-lg bg-[#efedff] px-2.5 py-2 text-[9px] font-extrabold text-[#5548d7] dark:bg-[#2a2354] dark:text-[#a9a2ff]"



                      >



                        {related.length ? "Reassign" : "Assign reviewer"}



                      </button>



                      {related.some((r) => r.locked) &&



                        status !== "accepted" && (



                          <button



                            onClick={() => decide(s, "accepted")}



                            className="rounded-lg bg-emerald-50 px-2.5 py-2 text-[9px] font-extrabold text-emerald-700 dark:bg-[#052e1f] dark:text-[#34d399]"



                          >



                            Accept



                          </button>



                        )}



                      {related.some((r) => r.locked) &&



                        status !== "rejected" && (



                          <button



                            onClick={() => decide(s, "rejected")}



                            className="rounded-lg bg-red-50 px-2.5 py-2 text-[9px] font-extrabold text-red-700 dark:bg-[#2a1218] dark:text-[#f08a9a]"



                          >



                            Reject



                          </button>



                        )}



                      {related.some((r) => r.locked) &&



                        status !== "revision_requested" && (



                          <button



                            onClick={() => decide(s, "revision_requested")}



                            className="rounded-lg bg-orange-50 px-2.5 py-2 text-[9px] font-extrabold text-orange-700 dark:bg-[#2a1a08] dark:text-[#fbbf24]"



                          >



                            Revise



                          </button>



                        )}



                      {!related.some((r) => r.locked) &&



                        related.length > 0 && (



                          <span className="rounded-lg bg-amber-50 px-2.5 py-2 text-[9px] font-extrabold text-amber-700 dark:bg-[#2a1a08] dark:text-[#fbbf24]">



                            Awaiting review



                          </span>



                        )}



                    </div>



                  </article>



                );



              })}



            </div>



          </>



        ) : (



          <div className="p-12 text-center">



            <FileText



              size={22}



              className="mx-auto text-[#aab2c0] dark:text-[#64748b]"



            />



            <h3 className="mb-1 mt-3 text-sm font-bold text-[#0d1b3d] dark:text-white">



              No submissions found



            </h3>



            <p className="m-0 text-[10px] text-[#8993a6] dark:text-[#94a3b8]">



              Incoming proposals for this conference will appear here.



            </p>



          </div>



        )}



      </section>







      {/* Sessions + Workflow */}



      <section



        id="sessions"



        className="scroll-mt-24 grid gap-5 md:grid-cols-2"



      >



        <article className="rounded-[20px] border border-[#e4e8f0] bg-white p-5 shadow-[0_10px_30px_rgba(15,28,65,.035)] dark:border-[#1e293b] dark:bg-[#0f172a] sm:p-6">



          <div className="flex items-start justify-between gap-3">



            <div>



              <span className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#6655f6] dark:text-[#a9a2ff]">



                Programme



              </span>



              <h2 className="mb-0 mt-1 text-xl font-bold text-[#0d1b3d] dark:text-white">



                Schedule sessions



              </h2>



            </div>



            <BarChart3 size={19} className="text-[#6a5af2]" />



          </div>







          {selectedConference && (



            <form onSubmit={createSession} className="mt-5 grid gap-3">



              <input



                value={sessionForm.title}



                onChange={(e) =>



                  setSessionForm((v) => ({ ...v, title: e.target.value }))



                }



                placeholder="Session title"



                className="h-10 rounded-xl border border-[#dfe4ed] px-3 text-xs outline-none focus:border-[#7568f7] dark:border-[#1e293b] dark:bg-[#0b1224] dark:text-white"



              />



              <select



                value={sessionForm.submission_id}



                onChange={(e) =>



                  setSessionForm((v) => ({



                    ...v,



                    submission_id: e.target.value,



                  }))



                }



                className="h-10 rounded-xl border border-[#dfe4ed] bg-white px-3 text-xs dark:border-[#1e293b] dark:bg-[#0b1224] dark:text-white"



              >



                <option value="">General session</option>



                {submissions



                  .filter((x) => x.status === "accepted")



                  .map((x) => (



                    <option key={x.id} value={x.id}>



                      {x.title}



                    </option>



                  ))}



              </select>



              <label className="grid gap-2 text-xs font-semibold">

                Scheduled time

                <input aria-label="Scheduled time" type="datetime-local"

                  value={sessionForm.scheduled_time}

                  onChange={(e) => setSessionForm((v) => ({ ...v, scheduled_time: e.target.value }))}

                  className="h-10 rounded-xl border border-[#dfe4ed] px-3 text-[11px] dark:border-[#1e293b] dark:bg-[#0b1224] dark:text-white" />

              </label>



              <div className="flex gap-2">



                <input



                  value={sessionForm.room}



                  onChange={(e) =>



                    setSessionForm((v) => ({ ...v, room: e.target.value }))



                  }



                  placeholder="Room / venue"



                  className="h-10 min-w-0 flex-1 rounded-xl border border-[#dfe4ed] px-3 text-xs dark:border-[#1e293b] dark:bg-[#0b1224] dark:text-white"



                />



                <button



                  disabled={sessionSaving}



                  className="rounded-xl bg-[#6655f6] px-3.5 text-[10px] font-extrabold text-white transition hover:-translate-y-px disabled:opacity-60"



                >



                  {sessionSaving ? "Saving…" : "Add session"}



                </button>



              </div>



            </form>



          )}







          <div className="mt-5 space-y-2">



            {sessions.length ? (



              sessions.map((session) => (



                <div



                  key={session.id}



                  className="flex items-center justify-between gap-3 rounded-xl bg-[#fafbfe] p-3 dark:bg-[#0b1224]"



                >



                  <div className="min-w-0">



                    <strong className="block truncate text-[11px] text-[#0d1b3d] dark:text-white">



                      {session.title || "Untitled session"}



                    </strong>



                    <span className="text-[9px] text-[#8993a6] dark:text-[#94a3b8]">



                      {dateLabel(session.scheduled_time)} ·{" "}



                      {session.room || "Room TBA"}



                    </span>



                  </div>



                  <button



                    onClick={() => removeSession(session)}



                    className="text-[9px] font-extrabold text-red-600 hover:underline dark:text-[#f08a9a]"



                  >



                    Remove



                  </button>



                </div>



              ))



            ) : (



              <p className="text-[10px] text-[#8993a6] dark:text-[#94a3b8]">



                No sessions scheduled yet. Accepted submissions can be attached



                to a session above.



              </p>



            )}



          </div>



        </article>







        <article className="rounded-[20px] bg-gradient-to-br from-[#111e4b] to-[#342b87] p-6 text-white shadow-[0_18px_45px_rgba(20,28,80,.15)]">



          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10">



            <Gavel size={18} />



          </span>



          <h2 className="mb-2 mt-5 text-xl font-bold">Decision workflow</h2>



          <p className="m-0 text-[10px] leading-6 text-white/60">



            Assign reviewers, wait for review activity, then record the final



            accept, reject or revision-requested decision.



          </p>



          <div className="mt-5 flex flex-wrap items-center gap-2 text-[9px] font-bold text-white/75">



            <button



              onClick={exportReport}



              className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1.5 transition hover:bg-white/25"



            >



              <Download size={12} /> Export report



            </button>



            <span className="rounded-full bg-white/10 px-2.5 py-1.5">



              1 · Assign



            </span>



            <span className="rounded-full bg-white/10 px-2.5 py-1.5">



              2 · Review



            </span>



            <span className="rounded-full bg-white/10 px-2.5 py-1.5">



              3 · Decide



            </span>



          </div>



        </article>



      </section> 







      {/* Assign reviewer modal */}



      {modal === "assign" && selectedSubmission ? (



        <Modal



          title={`Assign reviewer · ${selectedSubmission.title}`}



          onClose={() => setModal(null)}



        >



          <form onSubmit={assignReviewer} className="grid gap-4">



            <div className="rounded-xl border border-[#e7eaf0] bg-[#fafbfe] p-4 text-[10px] leading-5 text-[#6d7890] dark:border-[#1e293b] dark:bg-[#0b1224] dark:text-[#94a3b8]">



              Select an available reviewer from the reviewer directory. The



              assignment is saved against this submission and can be



              reassigned until a review is locked.



            </div>







            {reviewerCandidates.length > 0 && (



              <label className="grid gap-1.5 text-[11px] font-bold text-[#43506a] dark:text-[#cbd5e1]">



                Known reviewer



                <select



                  value={reviewerId}



                  onChange={(e) => setReviewerId(e.target.value)}



                  className="h-11 rounded-xl border border-[#dfe4ed] bg-white px-3 text-sm font-normal dark:border-[#1e293b] dark:bg-[#0b1224] dark:text-white"



                >



                  <option value="">Select a reviewer</option>



                  {reviewerCandidates.map((r) => (



                    <option key={r.id} value={r.id}>



                      {r.name || r.email || `User #${r.id}`} · #{r.id}



                    </option>



                  ))}



                </select>



              </label>



            )}







            <label className="grid gap-1.5 text-[11px] font-bold text-[#43506a] dark:text-[#cbd5e1]">



              Reviewer user ID



              <input



                type="number"



                min="1"



                value={reviewerId}



                onChange={(e) => setReviewerId(e.target.value)}



                placeholder="e.g. 12"



                className="h-11 rounded-xl border border-[#dfe4ed] px-3 text-sm font-normal outline-none focus:border-[#7568f7] dark:border-[#1e293b] dark:bg-[#0b1224] dark:text-white"



              />



            </label>







            {formError && (



              <p



                role="alert"



                className="m-0 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 dark:bg-[#2a1218] dark:text-[#f08a9a]"



              >



                {formError}



              </p>



            )}







            <div className="flex justify-end gap-2 border-t border-[#edf0f5] pt-4 dark:border-[#1e293b]">



              <button



                type="button"



                onClick={() => setModal(null)}



                className="rounded-xl border border-[#dfe4ed] px-4 py-2.5 text-xs font-bold text-[#66728b] dark:border-[#1e293b] dark:text-[#94a3b8]"



              >



                Cancel



              </button>



              <button



                disabled={saving}



                type="submit"



                className="rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-5 py-2.5 text-xs font-extrabold text-white transition hover:-translate-y-px disabled:opacity-60"



              >



                {saving ? "Assigning…" : "Assign reviewer"}



              </button>



            </div>



          </form>



        </Modal>



      ) : null}



    </OrganiserLayout>



  );



}