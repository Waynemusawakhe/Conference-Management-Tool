import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Navbar from "./Navbar";
import AdminLayout from "./AdminLayout";
import AuthorLayout from "./AuthorLayout";
import ReviewerLayout from "./ReviewerLayout";
import OrganiserLayout from "./OrganiserLayout";
import AttendeeSidebar from "./AttendeeSidebar";

const DASHBOARDS = {
  admin: "/admin-dashboard", author: "/author-dashboard",
  reviewer: "/reviewer-dashboard", organiser: "/organiser-dashboard",
  organizer: "/organiser-dashboard", attendee: "/attendee-dashboard",
};

export default function DiscussionWorkspaceLayout({ children }) {
  const { status, role } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  if (status !== "authenticated") return <><Navbar />{children}</>;
  if (role === "admin") return <AdminLayout>{children}</AdminLayout>;
  if (role === "author") return <AuthorLayout>{children}</AuthorLayout>;
  if (role === "reviewer") return <ReviewerLayout>{children}</ReviewerLayout>;
  if (role === "organiser" || role === "organizer") return <OrganiserLayout>{children}</OrganiserLayout>;
  if (role === "attendee") return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#0d1b3d]">
      <header className="sticky top-0 z-50 flex min-h-[72px] items-center gap-3 bg-[#07132f] px-4 text-white sm:px-8">
        <button type="button" className="rounded-lg p-2 lg:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Close dashboard menu" : "Open dashboard menu"} aria-expanded={menuOpen}>{menuOpen ? <X /> : <Menu />}</button>
        <Link to="/attendee-dashboard" className="text-lg font-bold tracking-tight">CMT <span className="text-[#b9b3ff]">Attendee</span></Link>
        <Link to="/attendee-dashboard" className="ml-auto inline-flex items-center gap-2 rounded-lg border border-white/25 px-3 py-2 text-sm font-semibold hover:bg-white/10"><ArrowLeft size={16} /> Dashboard</Link>
      </header>
      <div className="mx-auto flex w-[min(1400px,calc(100%-32px))] gap-6 py-6">
        <AttendeeSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
  return <><Navbar /><div className="mx-auto max-w-6xl px-4 py-6"><Link className="text-sm font-semibold text-indigo-700" to={DASHBOARDS[role] || "/home"}>Back to dashboard</Link></div>{children}</>;
}
