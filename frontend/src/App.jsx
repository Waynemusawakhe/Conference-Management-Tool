import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Conferences from "./pages/Conferences";
import Register from "./pages/Register";
import Contact from "./pages/Contact";
import HelpFAQ from "./pages/HelpFAQ";
import About from "./pages/About";
import ForgotPassword from "./pages/ForgotPassword";
import EmailVerified from "./pages/EmailVerified";
import Testimonials from "./pages/Testimonials";

import ReviewerDashboard from "./pages/ReviewerDashboard";
import OrganiserDashboard from "./pages/OrganiserDashboard";
import AdminDashboard from "./pages/AdminDashboard";

import AccountSettings from "./pages/AccountSettings";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import SubmitProposal from "./pages/SubmitProposal";

import CreateEditConference from "./pages/create_edit_conference";
import EditSubmissionPage from "./pages/EditSubmissionPage";
import AssignReviewersPage from "./pages/AssignReviewersPage";
import UsersPage from "./pages/UsersPage";

import AdminReportsPage from "./pages/AdminReportsPage";
import AdminUserDetailPage from "./pages/AdminUserDetailPage";
import AdminContactMessagesPage from "./pages/AdminContactMessagesPage";
import AdminContactMessageDetailPage from "./pages/AdminContactMessageDetailPage";
import AdminFaqsPage from "./pages/AdminFaqsPage";
import AdminFaqEditPage from "./pages/AdminFaqEditPage";
import AdminEditConferencePage from "./pages/AdminEditConferencePage";
import AdminConferencesPage from "./pages/AdminConferencesPage";

import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";

const AuthorDashboard = lazy(() => import("./pages/AuthorDashboard"));
const AttendeeDashboard = lazy(() => import("./pages/AttendeeDashboard"));

const ADMIN = ["admin"];

export default function App() {
  return (
    <ThemeProvider>
      <Suspense
        fallback={
          <div className="grid min-h-screen place-items-center text-sm text-[#66728b]">
            Loading workspace...
          </div>
        }
      >
        <Routes>
          {/* ==================== PUBLIC ==================== */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/email-verified" element={<EmailVerified />} />
          <Route path="/conferences" element={<Conferences />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/help-faq" element={<HelpFAQ />} />
          <Route path="/about" element={<About />} />
          <Route path="/testimonials" element={<Testimonials />} />

          {/* ==================== AUTHOR ==================== */}
          <Route
            path="/author-dashboard"
            element={<ProtectedRoute roles={["author"]}><AuthorDashboard /></ProtectedRoute>}
          />
          <Route
            path="/submit-proposal/:conferenceId"
            element={<ProtectedRoute roles={["author"]}><SubmitProposal /></ProtectedRoute>}
          />
          <Route
            path="/author/proposals"
            element={<ProtectedRoute roles={["author"]}><AuthorDashboard /></ProtectedRoute>}
          />
          <Route
            path="/author/deadlines"
            element={<ProtectedRoute roles={["author"]}><AuthorDashboard /></ProtectedRoute>}
          />
          <Route
            path="/edit-submission/:id"
            element={
              <ProtectedRoute roles={["author", "organiser", "admin"]}>
                <EditSubmissionPage />
              </ProtectedRoute>
            }
          />

          {/* ==================== REVIEWER ==================== */}
          <Route
            path="/reviewer-dashboard"
            element={<ProtectedRoute roles={["reviewer"]}><ReviewerDashboard /></ProtectedRoute>}
          />

          {/* ==================== ORGANISER ==================== */}
          <Route
            path="/organiser-dashboard"
            element={<ProtectedRoute roles={["organiser"]}><OrganiserDashboard /></ProtectedRoute>}
          />
          <Route
            path="/create-conference"
            element={<ProtectedRoute roles={["organiser", "admin"]}><CreateEditConference /></ProtectedRoute>}
          />
          <Route
            path="/edit-conference/:id"
            element={<ProtectedRoute roles={["organiser", "admin"]}><CreateEditConference /></ProtectedRoute>}
          />
          <Route
            path="/assign-reviewers/:id"
            element={<ProtectedRoute roles={["organiser", "admin"]}><AssignReviewersPage /></ProtectedRoute>}
          />

          {/* ==================== ATTENDEE ==================== */}
          <Route
            path="/my-conferences"
            element={<ProtectedRoute roles={["attendee"]}><AttendeeDashboard /></ProtectedRoute>}
          />
          <Route path="/attendee-dashboard" element={<Navigate to="/my-conferences" replace />} />
          <Route path="/attendee/registrations" element={<Navigate to="/my-conferences" replace />} />

          {/* ==================== ADMIN ==================== */}
          <Route
            path="/admin-dashboard"
            element={<ProtectedRoute roles={ADMIN}><AdminDashboard /></ProtectedRoute>}
          />
          <Route
            path="/admin/reports"
            element={<ProtectedRoute roles={ADMIN}><AdminReportsPage /></ProtectedRoute>}
          />

          {/*  Conferences management page (view / edit / delete ) */}
          <Route
            path="/admin/conferences"
            element={<ProtectedRoute roles={ADMIN}><AdminConferencesPage /></ProtectedRoute>}
          />

          {/* Users directory + detail */}
          <Route
            path="/users"
            element={<ProtectedRoute roles={ADMIN}><UsersPage /></ProtectedRoute>}
          />
          <Route
            path="/admin/users/:id"
            element={<ProtectedRoute roles={ADMIN}><AdminUserDetailPage /></ProtectedRoute>}
          />

          {/* Contact messages */}
          <Route
            path="/admin/contact-messages"
            element={<ProtectedRoute roles={ADMIN}><AdminContactMessagesPage /></ProtectedRoute>}
          />
          <Route
            path="/admin/contact-messages/:id"
            element={<ProtectedRoute roles={ADMIN}><AdminContactMessageDetailPage /></ProtectedRoute>}
          />

          {/* FAQs */}
          <Route
            path="/admin/faqs"
            element={<ProtectedRoute roles={ADMIN}><AdminFaqsPage /></ProtectedRoute>}
          />
          <Route
            path="/admin/faqs/new"
            element={<ProtectedRoute roles={ADMIN}><AdminFaqEditPage /></ProtectedRoute>}
          />
          <Route
            path="/admin/faqs/:id/edit"
            element={<ProtectedRoute roles={ADMIN}><AdminFaqEditPage /></ProtectedRoute>}
          />

          {/* Conference editing (admin side) */}
          <Route
            path="/admin/conferences/:id/edit"
            element={<ProtectedRoute roles={ADMIN}><AdminEditConferencePage /></ProtectedRoute>}
          />

          {/* ==================== SHARED AUTH ==================== */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute roles={["author", "reviewer", "organiser", "attendee", "admin"]}>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute roles={["author", "reviewer", "organiser", "attendee", "admin"]}>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account-settings"
            element={
              <ProtectedRoute roles={["author", "reviewer", "organiser", "attendee", "admin"]}>
                <AccountSettings />
              </ProtectedRoute>
            }
          />

          {/* ==================== FALLBACK ==================== */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ThemeProvider>
  );
}