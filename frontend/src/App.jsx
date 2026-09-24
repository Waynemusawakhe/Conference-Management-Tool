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
import ScoreSubmission from "./pages/ScoreSubmission";
import AttendeeDashboard from "./pages/AttendeeDashboard";
import MyConferences from "./pages/MyConferences";
import UsersPage from "./pages/UsersPage";

/* ---------- Admin pages ---------- */
import AdminReportsPage from "./pages/AdminReportsPage";
import AdminUserDetailPage from "./pages/AdminUserDetailPage";
import AdminContactMessagesPage from "./pages/AdminContactMessagesPage";
import AdminContactMessageDetailPage from "./pages/AdminContactMessageDetailPage";
import AdminFaqsPage from "./pages/AdminFaqsPage";
import AdminFaqEditPage from "./pages/AdminFaqEditPage";
import AdminConferencesPage from "./pages/AdminConferencesPage";
import AdminEditConferencePage from "./pages/AdminEditConferencePage";
import AdminReviewsPage from "./pages/AdminReviewsPage";
import AdminRegistrationsPage from "./pages/AdminRegistrationsPage";
import AdminTestimonialsPage from "./pages/AdminTestimonialsPage";
import AdminSubmissionsPage from "./pages/AdminSubmissionsPage";

import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";

const AuthorDashboard = lazy(() => import("./pages/AuthorDashboard"));

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
          {/* ==================== PUBLIC ROUTES ==================== */}

          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/conferences" element={<Conferences />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/help-faq" element={<HelpFAQ />} />
          <Route path="/about" element={<About />} />
          <Route path="/testimonials" element={<Testimonials />} />

          {/* ==================== AUTHOR ==================== */}

          <Route
            path="/author-dashboard"
            element={
              <ProtectedRoute roles={["author"]}>
                <AuthorDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/submit-proposal/:conferenceId"
            element={
              <ProtectedRoute roles={["author"]}>
                <SubmitProposal />
              </ProtectedRoute>
            }
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
            element={
              <ProtectedRoute roles={["reviewer"]}>
                <ReviewerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reviewer/evaluate/:id"
            element={
              <ProtectedRoute roles={["reviewer"]}>
                <ScoreSubmission />
              </ProtectedRoute>
            }
          />
          
         <Route
            path="/user-testimonials"
            element={
              <ProtectedRoute roles={["author", "reviewer", "organiser", "attendee", "admin"]}>
                <Testimonials />
              </ProtectedRoute>
            }
          />
        
          <Route
            path="/reviewer/pending"
            element={<Navigate to="/reviewer-dashboard?filter=pending" replace />}
          />
          <Route
            path="/reviewer/history"
            element={<Navigate to="/reviewer-dashboard?filter=locked" replace />}
          />

          {/* ==================== ATTENDEE ==================== */}

          <Route
            path="/attendee-dashboard"
            element={
              <ProtectedRoute roles={["attendee"]}>
                <AttendeeDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-conferences"
            element={
              <ProtectedRoute
                roles={["author", "reviewer", "organiser", "attendee", "admin"]}
              >
                <MyConferences />
              </ProtectedRoute>
            }
          />

          {/* ==================== ORGANISER ==================== */}

          <Route
            path="/organiser-dashboard"
            element={
              <ProtectedRoute roles={["organiser"]}>
                <OrganiserDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/create-conference"
            element={
              <ProtectedRoute roles={["organiser", "admin"]}>
                <CreateEditConference />
              </ProtectedRoute>
            }
          />

          <Route
            path="/edit-conference/:id"
            element={
              <ProtectedRoute roles={["organiser", "admin"]}>
                <CreateEditConference />
              </ProtectedRoute>
            }
          />

          <Route
            path="/assign-reviewers/:id"
            element={
              <ProtectedRoute roles={["organiser", "admin"]}>
                <AssignReviewersPage />
              </ProtectedRoute>
            }
          />

          {/* ==================== ADMIN ==================== */}

          {/* Dashboard */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Reports */}
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminReportsPage />
              </ProtectedRoute>
            }
          />

          {/* Conferences — list + edit */}
          <Route
            path="/admin/conferences"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminConferencesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/conferences/:id/edit"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminEditConferencePage />
              </ProtectedRoute>
            }
          />

          {/* Submissions (read-only oversight) */}
          <Route
            path="/admin/submissions"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminSubmissionsPage />
              </ProtectedRoute>
            }
          />

          {/* Reviews — assign, lock, remove */}
          <Route
            path="/admin/reviews"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminReviewsPage />
              </ProtectedRoute>
            }
          />

          {/* Registrations */}
          <Route
            path="/admin/registrations"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminRegistrationsPage />
              </ProtectedRoute>
            }
          />

          {/* Users directory + detail */}
          <Route
            path="/users"
            element={
              <ProtectedRoute roles={["admin"]}>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users/:id"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminUserDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Contact messages + detail */}
          <Route
            path="/admin/contact-messages"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminContactMessagesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/contact-messages/:id"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminContactMessageDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Testimonials */}
          <Route
            path="/admin/testimonials"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminTestimonialsPage />
              </ProtectedRoute>
            }
          />

          {/* FAQs — list + create + edit */}
          <Route
            path="/admin/faqs"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminFaqsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/faqs/new"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminFaqEditPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/faqs/:id/edit"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminFaqEditPage />
              </ProtectedRoute>
            }
          />

          {/* ==================== SHARED AUTH ROUTES ==================== */}

          <Route
            path="/profile"
            element={
              <ProtectedRoute
                roles={["author", "reviewer", "organiser", "attendee", "admin"]}
              >
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute
                roles={["author", "reviewer", "organiser", "attendee", "admin"]}
              >
                <Settings />
              </ProtectedRoute>
            }
          />

          <Route
            path="/account-settings"
            element={
              <ProtectedRoute
                roles={["author", "reviewer", "organiser", "attendee", "admin"]}
              >
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