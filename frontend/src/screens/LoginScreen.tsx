import { useEffect, useState, type CSSProperties } from "react";
import {
  ArrowRight,
  Check,
  LockKeyhole,
  Palette,
  Sparkles,
  UserRound,
} from "lucide-react";
import { ThemePanel } from "../components/StudioLayout";
import { useToast } from "../components/Toast";
import { defaultTheme, type ThemeConfig } from "../theme";
import type { Role } from "../types";
import { request } from "../api";

export function LoginScreen({
  onLogin,
  onGoogleLogin,
  onRegister,
  onResendVerification,
  error,
}: {
  onLogin: (
    email: string,
    password: string,
    role: Role,
    theme: ThemeConfig,
    tenantCode?: string,
  ) => void | Promise<void>;
  onGoogleLogin: (credential: string, role: Role) => void | Promise<void>;
  onRegister: (
    name: string,
    email: string,
    password: string,
    role: Role,
    salonName: string,
    salonLocation: string,
  ) => void | Promise<void>;
  onResendVerification: (email: string) => void | Promise<void>;
  error?: string;
}) {
  const { showToast } = useToast();
  const [role, setRole] = useState<Role>("user");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [salonName, setSalonName] = useState("");
  const [salonLocation, setSalonLocation] = useState("");
  const [registering, setRegistering] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [theme, setTheme] = useState<ThemeConfig>(defaultTheme);
  const [settingsOpen, setSettingsOpen] = useState(false);
  useEffect(() => {
    void request<ThemeConfig>("/salon/theme")
      .then((savedTheme) => setTheme({ ...defaultTheme, ...savedTheme }))
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response.credential)
            void onGoogleLogin(response.credential, role);
        },
      });
      const target = document.querySelector(".google-login");
      if (target instanceof HTMLElement)
        window.google?.accounts.id.renderButton(target, {
          theme: "outline",
          size: "large",
          width: 400,
          text: "continue_with",
        });
    };
    document.head.appendChild(script);
    return () => script.remove();
  }, [onGoogleLogin, role]);
  useEffect(() => {
    const button = document.querySelector(".login-submit");
    if (!(button instanceof HTMLButtonElement)) return;
    const start = () => {
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
    };
    button.addEventListener("click", start);
    return () => button.removeEventListener("click", start);
  }, [registering, role]);
  useEffect(() => {
    if (!error) return;
    const button = document.querySelector(".login-submit");
    if (button instanceof HTMLButtonElement) {
      button.disabled = false;
      button.removeAttribute("aria-busy");
    }
  }, [error]);
  useEffect(() => {
    if (error) showToast(error, "error");
  }, [error]);
  const cssVars = {
    "--rust": theme.primary,
    "--dark": theme.sidebar,
    "--cream": theme.surface,
    "--ink": theme.ink,
  } as CSSProperties;
  const logo = theme.logoUrl ? (
    <img className="brand-image" src={theme.logoUrl} alt={theme.brandName} />
  ) : (
    <span className="brand-mark">{theme.logoMark}</span>
  );
  const googleConfigured = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
  const missing = {
    name: registering && !name.trim(),
    salonName: registering && role === "admin" && !salonName.trim(),
    salonLocation: registering && role === "admin" && !salonLocation.trim(),
    email: !email.trim(),
    password: !password,
  };
  const submitForm = () => {
    setSubmitted(true);
    if (Object.values(missing).some(Boolean)) return;
    if (registering)
      return void onRegister(name, email, password, role, salonName, salonLocation);
    return void onLogin(email, password, role, theme);
  };
  return (
    <main className="login-page" style={cssVars}>
      <button
        className="login-customize"
        title="Customize login page"
        onClick={() => setSettingsOpen(!settingsOpen)}
      >
        <Palette size={16} /> Customize
      </button>
      {settingsOpen && (
        <ThemePanel
          theme={theme}
          onChange={setTheme}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      <section className="login-art">
        <div className="login-brand">
          {logo}
          <div>
            <strong>{theme.brandName}</strong>
            <small>CONSULTATION STUDIO</small>
          </div>
        </div>
        <div className="login-message">
          <label>GOOD HAIR DAYS, CONSIDERED.</label>
          <h1>
            A better conversation
            <br />
            starts here.
          </h1>
          <p>
            Thoughtful consultations for guests. A clearer point of view for
            every stylist.
          </p>
        </div>
        <div className="login-art-footer">
          <span>
            <Sparkles size={15} /> Human judgement, beautifully supported.
          </span>
          <small>Personalized wherever you are</small>
        </div>
      </section>
      <section className="login-panel">
        <div className="login-form">
          <div className="mobile-login-brand">
            {logo}
            <b>{theme.brandName}</b>
          </div>
          <label className="eyebrow">WELCOME BACK</label>
          <h2>
            {registering
              ? `Register with ${theme.brandName}`
              : `Sign in to ${theme.brandName}`}
          </h2>
          <p className="login-copy">
            {registering
              ? role === "admin"
                ? "Admin registrations require approval."
                : "Create your guest account."
              : "Choose your workspace to continue."}
          </p>
          <div className="role-toggle">
            <button
              className={role === "user" ? "selected" : ""}
              onClick={() => {
                setRole("user");
                setSubmitted(false);
              }}
            >
              <UserRound size={16} />
              <span>
                <b>Guest</b>
                <small>Book an appointment</small>
              </span>
            </button>
            <button
              className={role === "admin" ? "selected" : ""}
              onClick={() => {
                setRole("admin");
                setSubmitted(false);
              }}
            >
              <LockKeyhole size={16} />
              <span>
                <b>Admin</b>
                <small>Manage the studio</small>
              </span>
            </button>
          </div>
          {registering && (
            <>
              <label className="login-label">Full name</label>
              <input
                className={submitted && missing.name ? "has-error" : ""}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter your name"
                type="text"
              />
            </>
          )}
          {registering && role === "admin" && (
            <>
              <label className="login-label">Salon name</label>
              <input
                className={submitted && missing.salonName ? "has-error" : ""}
                value={salonName}
                onChange={(event) => setSalonName(event.target.value)}
                placeholder="Enter your salon name"
                type="text"
              />
              <label className="login-label">Salon location</label>
              <input
                className={submitted && missing.salonLocation ? "has-error" : ""}
                value={salonLocation}
                onChange={(event) => setSalonLocation(event.target.value)}
                placeholder="City or full salon address"
                type="text"
              />
            </>
          )}
          <label className="login-label">Email address</label>
          <input
            className={submitted && missing.email ? "has-error" : ""}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter your email"
            type="email"
          />
          <label className="login-label">Password</label>
          <input
            className={submitted && missing.password ? "has-error" : ""}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            type="password"
          />
          {!registering && (
            <div className="login-row">
              <label>
                <input type="checkbox" /> Remember me
              </label>
              <button
                type="button"
                onClick={() => {
                  window.history.pushState({}, "", "/forgot-password");
                  window.location.reload();
                }}
              >
                Forgot password?
              </button>
            </div>
          )}
          <button
            className="primary wide login-submit"
            onClick={submitForm}
          >
            {registering
              ? role === "admin"
                ? "Request admin access"
                : "Create account"
              : `Continue as ${role === "admin" ? "admin" : "guest"}`}{" "}
            <ArrowRight size={17} />
          </button>
          {!registering && role === "user" &&
            (googleConfigured ? (
              <div className="google-login" aria-label="Continue with Google" />
            ) : (
              <button
                className="soft wide google-login-disabled"
                disabled
                title="Configure NEXT_PUBLIC_GOOGLE_CLIENT_ID to enable Google sign-in"
              >
                Continue with Google
              </button>
            ))}
          {error && <p className="login-error">{error}</p>}
          {error?.toLowerCase().includes("verify your email") && email.trim() && (
            <button
              className="text-button verification-resend"
              type="button"
              onClick={() => void onResendVerification(email.trim())}
            >
              Resend verification email
            </button>
          )}
          <button
            className="text-button"
            type="button"
            onClick={() => {
              setRegistering((value) => !value);
              setSubmitted(false);
            }}
          >
            {registering ? "Back to sign in" : "Create an account"}
          </button>
          <p className="demo-hint">
            <Check size={14} /> Sign in securely to continue.
          </p>
        </div>
      </section>
    </main>
  );
}
