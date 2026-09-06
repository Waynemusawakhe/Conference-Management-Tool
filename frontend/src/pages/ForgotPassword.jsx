import { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#15165a,#07132f_65%)] px-5 py-10">
      <section className="w-full max-w-[440px] rounded-2xl border border-white/10 bg-white p-8 shadow-[0_25px_70px_rgba(0,0,0,.3)] sm:p-10">
        <div className="mb-6 flex justify-center"><Logo /></div>
        <h1 className="text-center text-3xl font-bold tracking-[-.04em] text-[#0d1b3d]">Reset your password</h1>
        {sent ? (
          <p className="mt-6 rounded-xl bg-[#e8faf2] p-4 text-center text-sm leading-6 text-[#16734b]" role="status">If an account exists for that email, reset instructions will be sent shortly.</p>
        ) : (
          <form className="mt-7 grid gap-5" onSubmit={(event) => { event.preventDefault(); if (email.trim()) setSent(true); }}>
            <label className="grid gap-2 text-xs font-bold text-[#43506a]" htmlFor="reset-email">Email<input id="reset-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="min-h-11 rounded-[10px] border border-[#dfe4ed] px-3 text-sm font-normal text-[#0d1b3d] outline-none focus:border-[#7568f7] focus:ring-4 focus:ring-[#7568f7]/10" placeholder="you@example.com" /></label>
            <button type="submit" className="min-h-11 rounded-[11px] border-0 bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-4 text-sm font-bold text-white">Send reset link</button>
          </form>
        )}
        <Link to="/login" className="mt-6 block text-center text-xs font-bold text-[#5c50ec] hover:underline">Back to login</Link>
      </section>
    </main>
  );
}