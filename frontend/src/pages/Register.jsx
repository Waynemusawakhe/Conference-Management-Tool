import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
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

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // TODO: replace with your actual registration API call
    console.log("Registering with:", formData);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0D]">
      <Navbar />

      <main className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-lg border border-[#23252E] bg-[#121318] p-8 shadow-lg">
          <h1 className="mb-8 text-center text-2xl font-bold text-white">
            Create Account
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]"
              >
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-md border border-[#23252E] bg-[#0A0A0D] px-3 py-2.5 text-white placeholder-gray-600 outline-none focus:border-[#6D5DFC] focus:ring-2 focus:ring-[#6D5DFC]/30"
              />
            </div>

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
                placeholder="********"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full rounded-md border border-[#23252E] bg-[#0A0A0D] px-3 py-2.5 text-white placeholder-gray-600 outline-none focus:border-[#6D5DFC] focus:ring-2 focus:ring-[#6D5DFC]/30"
                placeholder="*******"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              className="w-full rounded-md bg-[#6D5DFC] py-2.5 font-semibold text-white transition-colors hover:bg-[#9B8CFF]"
            >
              Register
            </button>

            <p className="text-center text-sm text-[#9CA3AF]">
              Already have an account?{" "}
              <Link to="/login" className="text-[#9B8CFF] hover:underline">
                Log In
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}

export default Register;
