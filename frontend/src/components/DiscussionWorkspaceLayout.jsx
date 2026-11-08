import { useAuth } from "../context/AuthContext";
import Navbar from "./Navbar";
import RoleChrome from "./RoleChrome";
export default function DiscussionWorkspaceLayout({ children }) {
  const { status } = useAuth();
  if (status === "authenticated") return <RoleChrome>{children}</RoleChrome>;
  return <><Navbar /><main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">{children}</main></>;
}
