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
      const passwordConfirm = String(form.get("passwordConfirm") || "");
      if (password !== passwordConfirm) { setError("The two password fields do not match."); setLoading(false); return; }
      const details = {
        full_name: String(form.get("fullName") || "").trim(),
        company_name: String(form.get("companyName") || "").trim(),
        company_number: String(form.get("companyNumber") || "").trim(),
        vat_number: String(form.get("vatNumber") || "").trim(),
        phone: String(form.get("phone") || "").trim(),
        address_line_1: String(form.get("addressLine1") || "").trim(),
        address_line_2: String(form.get("addressLine2") || "").trim(),
        city: String(form.get("city") || "").trim(),
        postcode: String(form.get("postcode") || "").trim(),
        country: "United Kingdom",
      };
      const { data, error: authError } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin, data: details } });
      if (authError) setError(authError.message);
      else if (data.session) closeLogin();
      else setNotice("Check your email to confirm your account, then return here to sign in.");
    }
    setLoading(false);
  };

  return <Dialog open={loginOpen} onOpenChange={(open) => { if (!open) closeLogin(); }}>
    <DialogContent className={`customer-auth-dialog${mode === "signup" ? " customer-auth-dialog-signup" : ""}`} aria-describedby="customer-auth-description">
      <div className="customer-auth-icon"><LockKeyhole size={22} /></div>
      <p className="eyebrow">Customer price access</p>
      <DialogTitle>{mode === "signin" ? "Login to see prices" : "Create your customer login"}</DialogTitle>
      <DialogDescription id="customer-auth-description">{mode === "signin" ? "Sign in to unlock customer pricing as soon as the current price list is published." : "Register your business details to create a secure customer login. We will email you if confirmation is required."}</DialogDescription>
      <form onSubmit={submit} className="customer-auth-form">
        {mode === "signup" ? <div className="customer-registration-grid">
          <label className="customer-field-full">Contact name<input name="fullName" autoComplete="name" required /></label>
          <label className="customer-field-full">Business or company name<input name="companyName" autoComplete="organization" required /></label>
          <label>Company number <span>Optional</span><input name="companyNumber" autoComplete="off" /></label>
          <label>VAT number <span>Optional</span><input name="vatNumber" autoComplete="off" /></label>
          <label className="customer-field-full">Telephone number<input name="phone" type="tel" autoComplete="tel" required /></label>
          <label className="customer-field-full">Trading address<input name="addressLine1" autoComplete="address-line1" required /></label>
          <label className="customer-field-full">Address line 2 <span>Optional</span><input name="addressLine2" autoComplete="address-line2" /></label>
          <label>Town or city<input name="city" autoComplete="address-level2" required /></label>
          <label>Postcode<input name="postcode" autoComplete="postal-code" required /></label>
        </div> : null}
        <label>Email address<input name="email" type="email" autoComplete="email" required /></label>
        <label>Password<input name="password" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={6} required /></label>
        {mode === "signup" ? <><label>Confirm password<input name="passwordConfirm" type="password" autoComplete="new-password" minLength={6} required /></label><label className="customer-auth-consent"><input name="accountConsent" type="checkbox" required /> I confirm these business details are correct and I agree to the customer account terms.</label></> : null}
        {error ? <p className="customer-auth-error" role="alert">{error}</p> : null}
        {notice ? <p className="customer-auth-notice" role="status"><CheckCircle2 size={16} /> {notice}</p> : null}
        <button className="button-primary" type="submit" disabled={loading}>{loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"} <ChevronRight size={17} /></button>
      </form>
      <button type="button" className="customer-auth-switch" onClick={() => { setMode((value) => value === "signin" ? "signup" : "signin"); setError(""); setNotice(""); }}>{mode === "signin" ? "New customer? Create an account" : "Already have an account? Sign in"}</button>
    </DialogContent>
  </Dialog>;
}
