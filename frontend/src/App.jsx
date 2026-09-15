import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Conferences from "./pages/Conferences";
import Register from "./pages/Register";
import Contact from "./pages/Contact";
import HelpFAQ from "./pages/HelpFAQ";
import About from "./pages/About";
import { ThemeProvider } from "./context/ThemeContext";
import ForgotPassword from "./pages/ForgotPassword";
import Testimonials from "./pages/Testimonials";
const AuthorDashboard = lazy(() => import("./pages/AuthorDashboard"));
import ReviewerDashboard from "./pages/ReviewerDashboard";
import AccountSettings from "./pages/AccountSettings";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/AdminDashboard";
import CreateEditConference from "./pages/create_edit_conference";
import EditSubmissionPage from "./pages/EditSubmissionPage";
import AssignReviewersPage from "./pages/AssignReviewersPage";
import UsersPage from "./pages/UsersPage";

export default function App() {
  return (
    <ThemeProvider>
      <Suspense fallback={<div className="grid min-h-screen place-items-center text-sm text-[#66728b]">Loading workspace...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/conferences" element={<Conferences />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/help-faq" element={<HelpFAQ />} />
        <Route path="/about" element={<About />} />
        <Route path="/testimonials" element={<Testimonials />} />
        <Route path="/author-dashboard" element={<AuthorDashboard />} />
        <Route path="/ReviewerDashboard" element={<ReviewerDashboard />} />
        <Route path="/account-settings" element={<AccountSettings />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/AdminDashboard" element={<AdminDashboard />} />
        <Route path="/create-conference" element={<CreateEditConference />} />
        <Route path="/edit-conference/:id" element={<CreateEditConference />} />
        <Route path="/edit-submission/:id" element={<EditSubmissionPage />} />
        <Route path="/assign-reviewers/:id" element={<AssignReviewersPage />} />
        <Route path="/users" element={<UsersPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ThemeProvider>
  );
}


