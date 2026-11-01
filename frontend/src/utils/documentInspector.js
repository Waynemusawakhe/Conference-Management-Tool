export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_TYPES = {
  pdf: ["application/pdf"],
  doc: ["application/msword"],
  docx: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
};

export function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Inspect a File before upload.
 * Returns null when no file is given, otherwise:
 * { name, extension, size, sizeLabel, valid, problems, canPreview }
 * Frontend checks only improve the user experience. Laravel must still
 * validate the same rules on the server.
 */
export function inspectDocument(file) {
  if (!file) return null;

  const name = file.name || "";
  const extension = name.includes(".")
    ? name.split(".").pop().toLowerCase()
    : "";
  const problems = [];

  if (!ALLOWED_TYPES[extension]) {
    problems.push("Unsupported format. Only PDF, DOC and DOCX files are allowed.");
  } else if (
    file.type &&
    file.type !== "application/octet-stream" &&
    !ALLOWED_TYPES[extension].includes(file.type)
  ) {
    problems.push("The file content type does not match its extension.");
  }

  if (file.size === 0) {
    problems.push("The file is empty.");
  }

  if (file.size > MAX_FILE_SIZE) {
    problems.push(
      `The file is ${formatFileSize(file.size)}. The limit is 10 MB.`,
    );
  }

  return {
    name,
    extension,
    size: file.size,
    sizeLabel: formatFileSize(file.size),
    valid: problems.length === 0,
    problems,
    canPreview: extension === "pdf" && problems.length === 0,
  };
}