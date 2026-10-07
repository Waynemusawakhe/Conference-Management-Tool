import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Conferences = lazy(() => import("./pages/Conferences"));
const Register = lazy(() => import("./pages/Register"));
const Contact = lazy(() => import("./pages/Contact"));
const HelpFAQ = lazy(() => import("./pages/HelpFAQ"));
const About = lazy(() => import("./pages/About"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Testimonials = lazy(() => import("./pages/Testimonials"));
const EmailVerified = lazy(() => import("./pages/EmailVerified"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

const ReviewerDashboard = lazy(() => import("./pages/ReviewerDashboard"));
const OrganiserDashboard = lazy(() => import("./pages/OrganiserDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

const AccountSettings = lazy(() => import("./pages/AccountSettings"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const SubmitProposal = lazy(() => import("./pages/SubmitProposal"));

const CreateEditConference = lazy(() => import("./pages/create_edit_conference"));
const EditSubmissionPage = lazy(() => import("./pages/EditSubmissionPage"));
const AssignReviewersPage = lazy(() => import("./pages/AssignReviewersPage"));
const ScoreSubmission = lazy(() => import("./pages/ScoreSubmission"));
const AttendeeDashboard = lazy(() => import("./pages/AttendeeDashboard"));
const MyConferences = lazy(() => import("./pages/MyConferences"));
const UsersPage = lazy(() => import("./pages/UsersPage"));

/* ---------- Organiser sub-pages ---------- */
const OrganiserConferences = lazy(() => import("./pages/OrganiserConferences"));
const OrganiserReviews = lazy(() => import("./pages/OrganiserReviews"));
const OrganiserRegistrations = lazy(() => import("./pages/OrganiserRegistrations"));

/* ---------- Admin pages ---------- */
const AdminReportsPage = lazy(() => import("./pages/AdminReportsPage"));
const AdminUserDetailPage = lazy(() => import("./pages/AdminUserDetailPage"));
const AdminContactMessagesPage = lazy(() => import("./pages/AdminContactMessagesPage"));
const AdminContactMessageDetailPage = lazy(() => import("./pages/AdminContactMessageDetailPage"));
const AdminFaqsPage = lazy(() => import("./pages/AdminFaqsPage"));
const AdminFaqEditPage = lazy(() => import("./pages/AdminFaqEditPage"));
const AdminConferencesPage = lazy(() => import("./pages/AdminConferencesPage"));
const AdminEditConferencePage = lazy(() => import("./pages/AdminEditConferencePage"));
const AdminReviewsPage = lazy(() => import("./pages/AdminReviewsPage"));
const AdminRegistrationsPage = lazy(() => import("./pages/AdminRegistrationsPage"));
const AdminTestimonialsPage = lazy(() => import("./pages/AdminTestimonialsPage"));
const AdminSubmissionsPage = lazy(() => import("./pages/AdminSubmissionsPage"));

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
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/conferences" element={<Conferences />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/help-faq" element={<HelpFAQ />} />
          <Route path="/about" element={<About />} />
          <Route path="/testimonials" element={<Testimonials />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/email-verified" element={<EmailVerified />} />

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
            path="/submit-proposal"
            element={
              <ProtectedRoute roles={["author"]}>
                <SubmitProposal />
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
              <ProtectedRoute roles={["author", "admin"]}>
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
              <ProtectedRoute
                roles={["author", "reviewer", "organiser", "attendee", "admin"]}
              >
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
            path="/organiser/conferences"
            element={
              <ProtectedRoute roles={["organiser"]}>
                <OrganiserConferences />
              </ProtectedRoute>
            }
          />

          <Route
            path="/organiser/reviews"
            element={
              <ProtectedRoute roles={["organiser"]}>
                <OrganiserReviews />
              </ProtectedRoute>
            }
          />

          <Route
            path="/organiser/registrations"
            element={
              <ProtectedRoute roles={["organiser"]}>
                <OrganiserRegistrations />
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

          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminReportsPage />
              </ProtectedRoute>
            }
          />

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

          <Route
            path="/admin/submissions"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminSubmissionsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/reviews"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminReviewsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/registrations"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminRegistrationsPage />
              </ProtectedRoute>
            }
          />

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

          <Route
            path="/admin/testimonials"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminTestimonialsPage />
              </ProtectedRoute>
            }
          />

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