import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

import "./Auth.css";

const preview = [
  { title: "Login page validation is not working", id: "BUG-001", status: "In progress", priority: 3 },
  { title: "Improve dashboard loading performance", id: "BUG-002", status: "Todo", priority: 2 },
  { title: "Add password visibility toggle", id: "BUG-003", status: "Done", priority: 1 }
];

const slug = (s) => s.toLowerCase().replace(/\s+/g, "-");

export default function Login() {
  const navigate = useNavigate();
  const { login, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await login({ email, password });
      navigate("/", { replace: true });
    } catch (err) {
      setError(
        err.response
          ? err.response.data?.message || "Email or password is incorrect."
          : "Can't reach the server. Check your connection and try again."
      );
    }
  };

  return (
    <div className="auth-page">
      <main className="auth-main">
        <div className="auth-brand">
          <span className="auth-mark" aria-hidden="true" />
          Trackly
        </div>

        <div className="auth-panel">
          <header className="auth-heading">
            <h1>Sign in</h1>
            <p>Pick up where you left off.</p>
          </header>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!error}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="password-field">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!error}
                  required
                />
                <button
                  type="button"
                  className="toggle-visibility"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <p className="auth-error" role="alert" hidden={!error}>
              {error}
            </p>

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading && <LoaderCircle size={17} className="spin" />}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="auth-switch">
            New to Trackly? <Link to="/register">Create an account</Link>
          </p>
        </div>

        <small className="auth-footer">© 2026 Trackly</small>
      </main>

      <aside className="auth-aside" aria-hidden="true">
        <div className="aside-inner">
          <h2>See what's broken, who owns it, and what's done.</h2>

          <ul className="pv-list">
            {preview.map((i) => (
              <li key={i.id} className="pv-row">
                <span className={`pv-dot pv-${slug(i.status)}`} />
                <span className="pv-text">
                  <strong>{i.title}</strong>
                  <small>{i.id}</small>
                </span>
                <span className="pv-bars">
                  {[1, 2, 3].map((n) => (
                    <i key={n} className={n <= i.priority ? "on" : ""} />
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}