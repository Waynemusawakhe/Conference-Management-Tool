import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!formData.name || !formData.email || !formData.password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    console.log("Registering user:", formData);
  };

  return (
    <div className="site">
      <Navbar />

      <main className="hero">
        <div className="hero-noise" />
        <div className="container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "calc(100vh - 82px)", padding: "40px 0" }}>
          <div style={{
            width: "100%",
            maxWidth: "460px",
            background: "#0d1c44",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "16px",
            padding: "36px",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.3)",
            position: "relative",
            zIndex: 2
          }}>
            
            {/* CMT Brand Header */}
            <div className="brand" style={{ justifyContent: "center", marginBottom: "24px" }}>
              <img className="brand-mark" src="/cmt-mark.png" alt="CMT logo" />
              <div className="brand-copy">
                <strong>CMT</strong>
                <span>Conference Management Tool</span>
              </div>
            </div>

            <h1 style={{ fontSize: "24px", fontWeight: "700", textAlign: "center", margin: "0 0 24px 0", color: "#fff" }}>
              Create an Account
            </h1>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ color: "rgba(255,255,255,0.72)", fontSize: "11px", fontWeight: "700", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Jane Doe"
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "9px",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    background: "rgba(7, 19, 47, 0.6)",
                    color: "#fff",
                    outline: "none"
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ color: "rgba(255,255,255,0.72)", fontSize: "11px", fontWeight: "700", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "9px",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    background: "rgba(7, 19, 47, 0.6)",
                    color: "#fff",
                    outline: "none"
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ color: "rgba(255,255,255,0.72)", fontSize: "11px", fontWeight: "700", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="******"
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "9px",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    background: "rgba(7, 19, 47, 0.6)",
                    color: "#fff",
                    outline: "none"
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ color: "rgba(255,255,255,0.72)", fontSize: "11px", fontWeight: "700", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="*******"
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "9px",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    background: "rgba(7, 19, 47, 0.6)",
                    color: "#fff",
                    outline: "none"
                  }}
                />
              </div>

              {error && <p style={{ color: "#f59a43", fontSize: "12px", margin: "0" }}>{error}</p>}

              <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "12px", marginTop: "8px" }}>
                Register
              </button>

              <p style={{ textAlign: "center", fontSize: "13px", color: "rgba(255,255,255,0.65)", margin: "12px 0 0" }}>
                Already have an account?{" "}
                <Link to="/login" style={{ color: "#8c72ff", fontWeight: "600", textDecoration: "none" }}>
                  Log In
                </Link>
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
