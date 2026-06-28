import { useState } from "react";
import { BrainCircuit, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ emailOrUsername: "", password: "", remember: false });
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const submit = async (event) => {
    event.preventDefault();
    if (!form.emailOrUsername.trim() || !form.password) {
      setError("Enter your email or username and password.");
      return;
    }
    setError(""); setSubmitting(true);
    try {
      await login(form);
      notify("Login successful");
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (err) {
      const message = err.message || "Login failed";
      setError(message); notify(message, "error");
    } finally { setSubmitting(false); }
  };

  return <AuthLayout title="Welcome back" subtitle="Sign in to continue to your TumorNet workspace.">
    <form className="auth-form" onSubmit={submit} noValidate>
      {error && <div className="form-alert" role="alert">{error}</div>}
      <label>Email or Username<div className="input-wrap"><Mail/><input autoFocus autoComplete="username" value={form.emailOrUsername} onChange={e=>setForm({...form,emailOrUsername:e.target.value})} placeholder="you@example.com or username"/></div></label>
      <label>Password<div className="input-wrap"><LockKeyhole/><input type={show?"text":"password"} autoComplete="current-password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Enter your password"/><button type="button" aria-label={show?"Hide password":"Show password"} onClick={()=>setShow(!show)}>{show?<EyeOff/>:<Eye/>}</button></div></label>
      <div className="form-options"><label className="check-label"><input type="checkbox" checked={form.remember} onChange={e=>setForm({...form,remember:e.target.checked})}/>Remember me</label><a href="#forgot">Forgot Password?</a></div>
      <button className="btn primary auth-submit" disabled={submitting}>{submitting?<><LoaderCircle className="spinner"/>Signing in...</>:"Log in"}</button>
      <div className="divider"><span>New to TumorNet?</span></div>
      <p className="auth-switch">New User? <Link to="/register">Create Account</Link></p>
    </form>
  </AuthLayout>;
}

export function AuthLayout({ title, subtitle, children }) {
  return <main className="auth-page"><Link className="auth-logo" to="/"><span><BrainCircuit/></span><b>Tumor<span>Net</span></b></Link>
    <div className="auth-orb one"/><div className="auth-orb two"/>
    <section className="auth-card"><header><div className="auth-icon"><ShieldIcon/></div><h1>{title}</h1><p>{subtitle}</p></header>{children}</section>
    <p className="auth-note">AI-assisted classification is not a substitute for professional medical diagnosis.</p>
  </main>;
}
function ShieldIcon(){return <LockKeyhole/>}
