import { useEffect, useState } from "react";
import { ArrowLeft, FileText } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { submissionsApi } from "../api/submissionsApi";
import RoleChrome from "../components/RoleChrome";

export default function SubmissionDetailPage() {
  const { id } = useParams();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    submissionsApi
      .getById(id)
      .then((result) => {
        if (active) setSubmission(result?.data ?? result);
      })
      .catch((err) => {
        if (active) setError(err.message || "Unable to load this submission.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  return (
    <RoleChrome>
      <main className="mx-auto w-full max-w-4xl space-y-5">
        <Link
          to="/notifications"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#526078] hover:text-[#342b87]"
        >
          <ArrowLeft size={16} /> Back to notifications
        </Link>

        {loading ? (
          <section aria-live="polite" className="rounded-xl border border-[#e4e8f0] bg-white p-8 text-sm text-[#78849a]">
            Loading submission...
          </section>
        ) : error ? (
          <section role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {error}
          </section>
        ) : (
          <article className="rounded-xl border border-[#e4e8f0] bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#edf5f2] text-[#16735a]">
                <FileText size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-[#16735a]">
                  Submission #{submission.id}
                </p>
                <h1 className="mt-1 break-words text-2xl font-bold text-[#18233f]">
                  {submission.title || "Untitled submission"}
                </h1>
                <p className="mt-2 text-sm text-[#66728b]">
                  {submission.conference?.name || "Conference"}
                  {submission.author?.name ? ` · ${submission.author.name}` : ""}
                  {submission.status ? ` · ${submission.status.replaceAll("_", " ")}` : ""}
                </p>
              </div>
            </div>

            <section className="mt-7 border-t border-[#edf0f5] pt-6">
              <h2 className="text-sm font-bold text-[#18233f]">Abstract</h2>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-[#526078]">
                {submission.abstract || "No abstract provided."}
              </p>
            </section>
          </article>
        )}
      </main>
    </RoleChrome>
  );
}
