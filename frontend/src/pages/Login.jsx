import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

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
    <div className="min-h-screen bg-[#0A0A0D]">
      <Navbar />

      <main className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-lg border border-[#23252E] bg-[#121318] p-8 shadow-lg">
          <h1 className="mb-8 text-center text-2xl font-bold text-white">
            Log In
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-md border border-[#23252E] bg-[#0A0A0D] px-3 py-2.5 text-white placeholder-gray-600 outline-none focus:border-[#6D5DFC] focus:ring-2 focus:ring-[#6D5DFC]/30"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full rounded-md border border-[#23252E] bg-[#0A0A0D] px-3 py-2.5 text-white placeholder-gray-600 outline-none focus:border-[#6D5DFC] focus:ring-2 focus:ring-[#6D5DFC]/30"
                placeholder="******"
              />
              <Link
                to="/forgot-password"
                className="mt-2 inline-block text-sm text-[#9B8CFF] hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              className="w-full rounded-md bg-[#6D5DFC] py-2.5 font-semibold text-white transition-colors hover:bg-[#9B8CFF]"
            >
              Log In
            </button>

            <p className="text-center text-sm text-[#9CA3AF]">
              Don't have an account?{" "}
              <Link to="/register" className="text-[#9B8CFF] hover:underline">
                Register
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}

export default Login;
