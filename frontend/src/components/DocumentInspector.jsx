import { useEffect, useMemo } from "react";
import { CheckCircle2, XCircle, FileText, Download } from "lucide-react";
import { inspectDocument } from "../utils/documentInspector";

/**
 * Shows file name, size and a pass/fail result for a chosen File.
 * Props:
 *  - file: the File object (or null)
 *  - onInspect: optional callback, called with the result when the file changes
 */
export default function DocumentInspector({ file, onInspect }) {
  const result = useMemo(() => inspectDocument(file), [file]);

  useEffect(() => {
    if (onInspect) onInspect(result);
  }, [result]); // eslint-disable-line react-hooks/exhaustive-deps

  // Object URL for preview/download. Revoked when the file changes.
  const url = useMemo(
    () => (file && result?.valid ? URL.createObjectURL(file) : null),
    [file, result],
  );

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  if (!result) return null;

  return (
    <div
      className={`mt-2 rounded-xl border p-3 text-[11px] ${
        result.valid
          ? "border-[#bfe8d3] bg-[#f3fbf7]"
          : "border-[#f3c1c1] bg-[#fff5f5]"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <FileText size={16} className="mt-0.5 shrink-0 text-[#5b4fe3]" />
          <div className="min-w-0">
            <strong className="block truncate text-[#1c2a4a]">
              {result.name}
            </strong>
            <span className="text-[#66728b]">
              {result.extension ? result.extension.toUpperCase() : "No extension"}{" "}
              · {result.sizeLabel}
            </span>
          </div>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 font-bold ${
            result.valid
              ? "bg-[#dcf5e9] text-[#159b64]"
              : "bg-[#fde2e2] text-[#c0392b]"
          }`}
        >
          {result.valid ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
          {result.valid ? "Passed" : "Failed"}
        </span>
      </div>

      {!result.valid && (
        <ul className="mb-0 mt-2 list-disc pl-5 text-[#c0392b]">
          {result.problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}

      {result.valid && result.canPreview && url && (
        <iframe
          title={`Preview of ${result.name}`}
          src={url}
          className="mt-3 h-64 w-full rounded-lg border border-[#dfe4ed] bg-white"
        />
      )}

      {result.valid && !result.canPreview && url && (
        <div className="mt-3">
          <p className="m-0 mb-2 text-[#66728b]">
            Preview is not available for {result.extension.toUpperCase()} files.
          </p>
          <a
            href={url}
            download={result.name}
            className="inline-flex items-center gap-1 font-bold text-[#5649dc] underline"
          >
            <Download size={13} /> Download file
          </a>
        </div>
      )}
    </div>
  );
}