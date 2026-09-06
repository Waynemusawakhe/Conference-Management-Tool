import { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";

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
    <div className="auth-page">
      <div className="auth-card">
        {/* CMT Brand Header — shared Logo component */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
          <Logo />
        </div>

        <h1 className="auth-title">Log In</h1>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="******"
            />
            <Link to="/forgot-password" className="auth-link small">
              Forgot password?
            </Link>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="btn btn-primary auth-submit">
            Log In
          </button>

          <p className="auth-footer">
            Don't have an account? <Link to="/register" className="auth-link">Register</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;