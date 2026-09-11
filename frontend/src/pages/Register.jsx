import { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";
import Navbar from "../components/Navbar";
import { ArrowRight, CheckCircle2, LockKeyhole, Mail, Sparkles, UserRound, Users } from "lucide-react";

function Register() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "author", // default role
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Basic client-side validation
    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("Please fill in every field.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!["author", "admin", "organiser"].includes(formData.role)) {
      setError("Please select a valid role.");
      return;
    }

    setLoading(true);

    try {
      // ✅ Correct endpoint: /api/v1/auth/register
      const response = await fetch("http://localhost:8000/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
          password_confirmation: formData.confirmPassword,
          role: formData.role, // include role
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.message || "Registration failed.";
        if (data.errors) {
          const details = Object.values(data.errors).flat().join(" ");
          throw new Error(`${errorMsg} ${details}`);
        }
        throw new Error(errorMsg);
      }

      // Success
      console.log("Registered:", data);
      setSuccess(true);
      // Optionally redirect to login or dashboard
      // setTimeout(() => window.location.href = "/login", 2000);
    } catch (err) {
      setError(err.message);
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
              {/* Full name */}
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

              {/* Password */}
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
                    placeholder="*******"
                    className="min-h-11 w-full rounded-[10px] border border-[#dfe4ed] px-3 text-sm font-normal text-[#0d1b3d] outline-none transition focus:border-[#7568f7] focus:ring-4 focus:ring-[#7568f7]/10"
                  />
                </label>
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
              </div>

              {/* Role dropdown */}
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
                    className="min-h-11 w-full rounded-[10px] border border-[#dfe4ed] px-3 text-sm font-normal text-[#0d1b3d] outline-none transition focus:border-[#7568f7] focus:ring-4 focus:ring-[#7568f7]/10 bg-white"
                  >
                    <option value="author">Author</option>
                    <option value="admin">Admin</option>
                    <option value="organiser">Organiser</option>
                  </select>
                </label>
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                  {error}
                </p>
              )}

              {success && (
                <p className="rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
                  ✅ Account created! Please check your email to verify your account.
                </p>
              )}

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