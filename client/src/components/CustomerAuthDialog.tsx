/**
 * Magnetic Source customer access: a concise paper-and-cobalt email form for
 * sign-in and sign-up, presented only after a customer requests price access.
 */
import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, ChevronRight, LockKeyhole } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { supabase } from "@/lib/supabase";

export default function CustomerAuthDialog() {
  const { loginOpen, closeLogin } = useCustomerAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!loginOpen) return;
    setError("");
    setNotice("");
  }, [loginOpen]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) { setError("Customer access is not available at the moment. Please try again shortly."); return; }
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    setLoading(true); setError(""); setNotice("");
    if (mode === "signin") {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) setError(authError.message);
      else closeLogin();
    } else {
      const { data, error: authError } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
      if (authError) setError(authError.message);
      else if (data.session) closeLogin();
      else setNotice("Check your email to confirm your account, then return here to sign in.");
    }
    setLoading(false);
  };

  return <Dialog open={loginOpen} onOpenChange={(open) => { if (!open) closeLogin(); }}>
    <DialogContent className="customer-auth-dialog" aria-describedby="customer-auth-description">
      <div className="customer-auth-icon"><LockKeyhole size={22} /></div>
      <p className="eyebrow">Customer price access</p>
      <DialogTitle>{mode === "signin" ? "Login to see prices" : "Create your customer login"}</DialogTitle>
      <DialogDescription id="customer-auth-description">{mode === "signin" ? "Sign in to unlock customer pricing as soon as the current price list is published." : "Create a secure customer login. We will email you if confirmation is required."}</DialogDescription>
      <form onSubmit={submit} className="customer-auth-form">
        <label>Email address<input name="email" type="email" autoComplete="email" required /></label>
        <label>Password<input name="password" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={6} required /></label>
        {error ? <p className="customer-auth-error" role="alert">{error}</p> : null}
        {notice ? <p className="customer-auth-notice" role="status"><CheckCircle2 size={16} /> {notice}</p> : null}
        <button className="button-primary" type="submit" disabled={loading}>{loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"} <ChevronRight size={17} /></button>
      </form>
      <button type="button" className="customer-auth-switch" onClick={() => { setMode((value) => value === "signin" ? "signup" : "signin"); setError(""); setNotice(""); }}>{mode === "signin" ? "New customer? Create an account" : "Already have an account? Sign in"}</button>
    </DialogContent>
  </Dialog>;
}
