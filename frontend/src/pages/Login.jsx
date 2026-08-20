import { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";
import Navbar from "../components/Navbar";
import { ArrowRight, LockKeyhole, Mail, ShieldCheck, Sparkles } from "lucide-react";

function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Please enter both email and password.");
      return;
    }

    // TODO: replace with your actual login API call
    console.log("Logging in with:", formData);
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#0d1b3d]">
      <Navbar />
      <main className="relative overflow-hidden bg-[radial-gradient(circle_at_75%_32%,rgba(98,83,245,.2),transparent_27%),linear-gradient(135deg,#07132f_0%,#0a1740_52%,#15165a_100%)] px-5 py-16 text-white sm:py-24">
        <div className="relative z-10 mx-auto grid w-[min(1100px,100%)] items-center gap-12 lg:grid-cols-[.9fr_1.1fr]">
          <div className="hidden lg:block">
            <span className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[.12em] text-[#b9b3ff]"><Sparkles size={15} /> Welcome back</span>
            <h1 className="mt-4 max-w-[460px] text-5xl font-bold leading-[1.05] tracking-[-.055em]">Continue your research journey.</h1>
            <p className="mt-5 max-w-[430px] text-sm leading-7 text-white/65">Access your conferences, submissions, reviews and professional network from one focused workspace.</p>
            <div className="cmt-float mt-10 flex w-fit items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur"><ShieldCheck className="text-[#8b7eff]" size={20} /><span className="text-xs font-semibold text-white/80">Your work, organised with confidence.</span></div>
          </div>
          <div className="mx-auto w-full max-w-[470px] rounded-2xl border border-white/15 bg-white p-7 text-[#0d1b3d] shadow-[0_25px_70px_rgba(0,0,0,.3)] sm:p-10">
            <div className="mb-6 flex justify-center lg:hidden"><Logo /></div>
            <span className="text-[10px] font-extrabold uppercase tracking-[.12em] text-[#5c50ec]">Member access</span>
            <h2 className="mt-2 text-3xl font-bold tracking-[-.04em]">Log in to CMT</h2>
            <p className="mt-2 text-xs leading-6 text-[#788398]">Pick up where your conference work left off.</p>

        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="grid gap-2">
            <label className="text-xs font-bold text-[#43506a]" htmlFor="email"><span className="mb-2 flex items-center gap-2"><Mail size={14} className="text-[#5c50ec]" /> Email</span><input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="min-h-11 w-full rounded-[10px] border border-[#dfe4ed] px-3 text-sm font-normal text-[#0d1b3d] outline-none transition focus:border-[#7568f7] focus:ring-4 focus:ring-[#7568f7]/10"
            /></label>
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-bold text-[#43506a]" htmlFor="password"><span className="mb-2 flex items-center gap-2"><LockKeyhole size={14} className="text-[#5c50ec]" /> Password</span><input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="******"
              className="min-h-11 w-full rounded-[10px] border border-[#dfe4ed] px-3 text-sm font-normal text-[#0d1b3d] outline-none transition focus:border-[#7568f7] focus:ring-4 focus:ring-[#7568f7]/10"
            /></label>
            <Link to="/forgot-password" className="text-right text-[11px] font-bold text-[#5c50ec] hover:underline">
              Forgot password?
            </Link>
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p>}

          <button type="submit" className="min-h-11 rounded-[11px] border-0 bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-4 text-sm font-bold text-white shadow-[0_10px_26px_rgba(103,87,245,.26)] transition hover:-translate-y-px">
            <span>Log in</span><ArrowRight size={16} />
          </button>

          <p className="text-center text-xs text-[#788398]">
            Don't have an account? <Link to="/register" className="font-bold text-[#5c50ec] hover:underline">Register</Link>
          </p>
        </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Login;