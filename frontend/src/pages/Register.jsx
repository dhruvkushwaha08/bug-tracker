
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

const MIN_LENGTH = 8;

export default function Register() {
  const navigate = useNavigate();
  const { register, loading } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("DEVELOPER");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [errorField, setErrorField] = useState("");

  const fail = (message, field = "") => {
    setError(message);
    setErrorField(field);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    fail("");

    if (password.length < MIN_LENGTH) {
      fail(`Password needs at least ${MIN_LENGTH} characters.`, "password");
      return;
    }

    if (password !== confirmPassword) {
      fail("The two passwords don't match.", "confirm");
      return;
    }

    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        role,
      });

      navigate("/", { replace: true });
    } catch (err) {
      fail(
        err.response
          ? err.response.data?.message ||
              "We couldn't create your account. Try again."
          : "Can't reach the server. Check your connection and try again.",
        err.response?.status === 409 ? "email" : ""
      );
    }
  };

  const invalid = (field) => errorField === field;

  return (
    <div className="auth-page">
      <main className="auth-main">
        <div className="auth-brand">
          <span className="auth-mark" aria-hidden="true" />
          Trackly
        </div>

        <div className="auth-panel">
          <header className="auth-heading">
            <h1>Create account</h1>
            <p>Set up a workspace and start logging issues.</p>
          </header>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="field">
              <label htmlFor="fullName">Full name</label>
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                autoFocus
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="registerEmail">Email</label>
              <input
                id="registerEmail"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={invalid("email")}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="role">Register as</label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              >
                <option value="DEVELOPER">Developer</option>
                <option value="TESTER">Tester</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="registerPassword">Password</label>
              <div className="password-field">
                <input
                  id="registerPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={invalid("password")}
                  aria-describedby="passwordHint"
                  required
                />

                <button
                  type="button"
                  className="toggle-visibility"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide passwords" : "Show passwords"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <small id="passwordHint" className="field-hint">
                Use at least {MIN_LENGTH} characters.
              </small>
            </div>

            <div className="field">
              <label htmlFor="confirmPassword">Confirm password</label>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                aria-invalid={invalid("confirm")}
                required
              />
            </div>

            <p className="auth-error" role="alert" hidden={!error}>
              {error}
            </p>

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading && <LoaderCircle size={17} className="spin" />}
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>

        <small className="auth-footer">© 2026 Trackly</small>
      </main>

      <aside className="auth-aside" aria-hidden="true">
        <div className="aside-inner">
          <h2>Add your issues, and see how far along the project is.</h2>

          <div className="pv-progress">
            <div className="pv-progress-head">
              <div>
                <strong>Bug Tracker Development</strong>
                <small>1 of 3 issues done</small>
              </div>
              <span className="pv-pct">33%</span>
            </div>

            <div className="pv-segments">
              <span className="pv-seg pv-seg-done" />
              <span className="pv-seg pv-seg-progress" />
              <span className="pv-seg pv-seg-todo" />
            </div>

            <ul className="pv-legend">
              <li><span className="pv-key pv-seg-done" />Done</li>
              <li><span className="pv-key pv-seg-progress" />In progress</li>
              <li><span className="pv-key pv-seg-todo" />Todo</li>
            </ul>
          </div>
        </div>
      </aside>
    </div>
  );
}
