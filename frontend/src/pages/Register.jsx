import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import Navbar from "../components/Navbar";
import { ArrowRight, CheckCircle2, LockKeyhole, Mail, Sparkles, UserRound, Users } from "lucide-react";
import { authApi } from "../api/authApi";

// Minimum password length confirmed for your frontend UX.
// The backend remains the final authority.
const MIN_PASSWORD_LENGTH = 8;

// Calculates password strength based on length and character variety.
function getPasswordStrength(password) {
  if (!password) {
    return { score: 0, label: "", color: "" };
  }

  let score = 0;
  if (password.length >= MIN_PASSWORD_LENGTH) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const capped = Math.min(score, 4);

  if (capped <= 1) return { score: 1, label: "Weak", color: "bg-red-500" };
  if (capped === 2) return { score: 2, label: "Fair", color: "bg-orange-500" };
  if (capped === 3) return { score: 3, label: "Good", color: "bg-yellow-500" };
  return { score: 4, label: "Strong", color: "bg-green-500" };
}

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "", // No default — user must choose
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Auto-hide success message and redirect to login after 3 seconds
  useEffect(() => {
    if (!success) return;

    const timer = setTimeout(() => {
      setSuccess(false);
      navigate("/login", { replace: true });
    }, 3000);

    return () => clearTimeout(timer);
  }, [success, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const strength = getPasswordStrength(formData.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Client-side validation (UX only — backend validates too)
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("Please fill in every field.");
      return;
    }
    if (formData.password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (strength.score < 2) {
      setError("Please choose a stronger password (Fair or better).");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!formData.role) {
      setError("Please choose a role.");
      return;
    }
    if (!["admin", "organiser", "reviewer", "attendee"].includes(formData.role)) {
      setError("Please select a valid role.");
      return;
    }

    setLoading(true);

    try {
      // CONFIRM IN SWAGGER: exact field names and accepted role values.
      await authApi.register({
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.confirmPassword,
        role: formData.role,
      });

      // Clear form and show success state
      setFormData({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "",
      });
      setSuccess(true);
    } catch (err) {
      if (err.status === 422 && err.errors) {
        const details = Object.values(err.errors).flat().join(" ");
        setError(details || err.message);
      } else {
        setError(err.message || "Registration failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#0d1b3d]">
      <Navbar />
      <main className="relative overflow-hidden bg-[radial-gradient(circle_at_75%_32%,rgba(98,83,245,.2),transparent_27%),linear-gradient(135deg,#07132f_0%,#0a1740_52%,#15165a_100%)] px-5 py-16 text-white sm:py-24">
        <div className="relative z-10 mx-auto grid w-[min(1100px,100%)] items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
          <div className="mx-auto w-full max-w-[470px] rounded-2xl border border-white/15 bg-white p-7 text-[#0d1b3d] shadow-[0_25px_70px_rgba(0,0,0,.3)] sm:p-10">
            <div className="mb-6 flex justify-center lg:hidden"><Logo /></div>
            <span className="text-[10px] font-extrabold uppercase tracking-[.12em] text-[#5c50ec]">Join the network</span>
            <h1 className="mt-2 text-3xl font-bold tracking-[-.04em]">Create your CMT account</h1>
            <p className="mt-2 text-xs leading-6 text-[#788398]">Bring your research workflow into one connected place.</p>

            <form onSubmit={handleSubmit} className="grid gap-5">
              {/* Full Name */}
              <div className="grid gap-2">
                <label className="text-xs font-bold text-[#43506a]" htmlFor="fullName">
                  <span className="mb-2 flex items-center gap-2">
                    <UserRound size={14} className="text-[#5c50ec]" /> Full name
                  </span>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="min-h-11 w-full rounded-[10px] border border-[#dfe4ed] px-3 text-sm font-normal text-[#0d1b3d] outline-none transition focus:border-[#7568f7] focus:ring-4 focus:ring-[#7568f7]/10"
                  />
                </label>
              </div>

              {/* Email */}
              <div className="grid gap-2">
                <label className="text-xs font-bold text-[#43506a]" htmlFor="email">
                  <span className="mb-2 flex items-center gap-2">
                    <Mail size={14} className="text-[#5c50ec]" /> Email
                  </span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="min-h-11 w-full rounded-[10px] border border-[#dfe4ed] px-3 text-sm font-normal text-[#0d1b3d] outline-none transition focus:border-[#7568f7] focus:ring-4 focus:ring-[#7568f7]/10"
                  />
                </label>
              </div>

              {/* Password + Strength Meter */}
              <div className="grid gap-2">
                <label className="text-xs font-bold text-[#43506a]" htmlFor="password">
                  <span className="mb-2 flex items-center gap-2">
                    <LockKeyhole size={14} className="text-[#5c50ec]" /> Password
                  </span>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="At least 8 characters"
                    minLength={MIN_PASSWORD_LENGTH}
                    className="min-h-11 w-full rounded-[10px] border border-[#dfe4ed] px-3 text-sm font-normal text-[#0d1b3d] outline-none transition focus:border-[#7568f7] focus:ring-4 focus:ring-[#7568f7]/10"
                  />
                </label>

                {formData.password && (
                  <div className="grid gap-1.5">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((step) => (
                        <span
                          key={step}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            step <= strength.score ? strength.color : "bg-[#e5e8f0]"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-[#788398]">
                        Strength:{" "}
                        <span
                          className={
                            strength.score <= 1
                              ? "text-red-600"
                              : strength.score === 2
                              ? "text-orange-600"
                              : strength.score === 3
                              ? "text-yellow-600"
                              : "text-green-600"
                          }
                        >
                          {strength.label}
                        </span>
                      </span>
                      <span className="text-[#9aa3b5]">
                        {formData.password.length}/{MIN_PASSWORD_LENGTH} min
                      </span>
                    </div>
                    <ul className="mt-1 grid gap-1 text-[11px] text-[#788398]">
                      <li className={formData.password.length >= MIN_PASSWORD_LENGTH ? "text-green-600" : ""}>
                        {formData.password.length >= MIN_PASSWORD_LENGTH ? "✓" : "•"} At least {MIN_PASSWORD_LENGTH} characters
                      </li>
                      <li className={/[A-Z]/.test(formData.password) && /[a-z]/.test(formData.password) ? "text-green-600" : ""}>
                        {/[A-Z]/.test(formData.password) && /[a-z]/.test(formData.password) ? "✓" : "•"} Upper and lower case
                      </li>
                      <li className={/\d/.test(formData.password) ? "text-green-600" : ""}>
                        {/\d/.test(formData.password) ? "✓" : "•"} At least one number
                      </li>
                      <li className={/[^A-Za-z0-9]/.test(formData.password) ? "text-green-600" : ""}>
                        {/[^A-Za-z0-9]/.test(formData.password) ? "✓" : "•"} At least one symbol
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="grid gap-2">
                <label className="text-xs font-bold text-[#43506a]" htmlFor="confirmPassword">
                  <span className="mb-2 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#5c50ec]" /> Confirm password
                  </span>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="******"
                    className="min-h-11 w-full rounded-[10px] border border-[#dfe4ed] px-3 text-sm font-normal text-[#0d1b3d] outline-none transition focus:border-[#7568f7] focus:ring-4 focus:ring-[#7568f7]/10"
                  />
                </label>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-[11px] font-semibold text-red-600">Passwords do not match.</p>
                )}
              </div>

              {/* Role Dropdown */}
              <div className="grid gap-2">
                <label className="text-xs font-bold text-[#43506a]" htmlFor="role">
                  <span className="mb-2 flex items-center gap-2">
                    <Users size={14} className="text-[#5c50ec]" /> Role
                  </span>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                    className="min-h-11 w-full rounded-[10px] border border-[#dfe4ed] px-3 text-sm font-normal text-[#0d1b3d] outline-none transition focus:border-[#7568f7] focus:ring-4 focus:ring-[#7568f7]/10 bg-white"
                  >
                    <option value="" disabled>Please choose a role</option>
                    <option value="attendee">Attendee</option>
                    <option value="reviewer">Reviewer</option>
                    <option value="organiser">Organiser</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
              </div>

              {/* Error Message */}
              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                  {error}
                </p>
              )}

              {/* Success Message (Auto-hides and redirects) */}
              {success && (
                <p className="rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
                  ✅ Account created! Redirecting to login...
                </p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="min-h-11 rounded-[11px] border-0 bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-4 text-sm font-bold text-white shadow-[0_10px_26px_rgba(103,87,245,.26)] transition hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? "Creating..." : "Create account"}
                <ArrowRight size={16} />
              </button>

              <p className="text-center text-xs text-[#788398]">
                Already have an account?{" "}
                <Link to="/login" className="font-bold text-[#5c50ec] hover:underline">
                  Log in
                </Link>
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Register;