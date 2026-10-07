export function safeReturnPath(from) {
  const path =
    typeof from === "string"
      ? from
      : from?.pathname &&
        `${from.pathname}${from.search || ""}${from.hash || ""}`;
  if (
    !path ||
    !path.startsWith("/") ||
    path.startsWith("//") ||
    /\\/.test(path) ||
    [...path].some((char) => char.charCodeAt(0) <= 32)
  )
    return null;
  if (["/login", "/register"].includes(path.split(/[?#]/)[0])) return null;
  return path;
}
