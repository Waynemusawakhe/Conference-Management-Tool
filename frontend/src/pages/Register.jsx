import { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";
import Navbar from "../components/Navbar";
import { ArrowRight, CheckCircle2, LockKeyhole, Mail, Sparkles, UserRound } from "lucide-react";

function Register() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (
      !formData.fullName ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("Please fill in every field.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // TODO: replace with your actual register API call
    console.log("Registering:", formData);
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
          <div className="grid gap-2">
            <label className="text-xs font-bold text-[#43506a]" htmlFor="fullName"><span className="mb-2 flex items-center gap-2"><UserRound size={14} className="text-[#5c50ec]" /> Full name</span><input
              id="fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              className="min-h-11 w-full rounded-[10px] border border-[#dfe4ed] px-3 text-sm font-normal text-[#0d1b3d] outline-none transition focus:border-[#7568f7] focus:ring-4 focus:ring-[#7568f7]/10"
            /></label>
          </div>

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
              placeholder="*******"
              className="min-h-11 w-full rounded-[10px] border border-[#dfe4ed] px-3 text-sm font-normal text-[#0d1b3d] outline-none transition focus:border-[#7568f7] focus:ring-4 focus:ring-[#7568f7]/10"
            /></label>
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-bold text-[#43506a]" htmlFor="confirmPassword"><span className="mb-2 flex items-center gap-2"><CheckCircle2 size={14} className="text-[#5c50ec]" /> Confirm password</span><input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="******"
              className="min-h-11 w-full rounded-[10px] border border-[#dfe4ed] px-3 text-sm font-normal text-[#0d1b3d] outline-none transition focus:border-[#7568f7] focus:ring-4 focus:ring-[#7568f7]/10"
            /></label>
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p>}

          <button type="submit" className="min-h-11 rounded-[11px] border-0 bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-4 text-sm font-bold text-white shadow-[0_10px_26px_rgba(103,87,245,.26)] transition hover:-translate-y-px">
            <span>Create account</span><ArrowRight size={16} />
          </button>

          <p className="text-center text-xs text-[#788398]">
            Already have an account? <Link to="/login" className="font-bold text-[#5c50ec] hover:underline">Log in</Link>
          </p>
        </form>
          </div>
          <div className="hidden lg:block">
            <span className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[.12em] text-[#b9b3ff]"><Sparkles size={15} /> A better conference workflow</span>
            <h2 className="mt-4 max-w-[460px] text-5xl font-bold leading-[1.05] tracking-[-.055em]">Make every research opportunity count.</h2>
            <p className="mt-5 max-w-[430px] text-sm leading-7 text-white/65">Discover events, submit work, connect with peers and keep your conference journey moving forward.</p>
            <div className="cmt-float cmt-float-delay mt-10 flex w-fit items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur"><CheckCircle2 className="text-[#32d08c]" size={20} /><span className="text-xs font-semibold text-white/80">One connected platform for researchers.</span></div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Register;