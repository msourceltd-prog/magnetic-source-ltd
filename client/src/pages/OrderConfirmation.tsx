/**
 * Trade Ledger, Recut: a clear completion state for the deliberately local,
 * no-payment order simulation; no order is represented as live or dispatched.
 */
import { ArrowRight, CheckCircle2, FileText, PackageCheck } from "lucide-react";
import { Link, useLocation } from "wouter";
import StoreLayout from "@/components/StoreLayout";

export default function OrderConfirmation() {
  const [location] = useLocation();
  const query = new URLSearchParams(location.split("?")[1] || "");
  const reference = query.get("ref") || "MS-DEMO-REVIEW";
  const persisted = query.get("stored") === "database";
  return <StoreLayout><section className="confirmation-section"><div className="confirmation-card"><CheckCircle2 size={45} /><p className="eyebrow">Demo order complete</p><h1>The review flow is ready.</h1><p className="confirmation-copy">A no-payment order reference has been generated to demonstrate the final state of the customer journey. No payment, delivery request or real fulfilment has been created. {persisted ? "The demo order record was saved to the configured database." : "The result remains local because a Supabase project has not yet been configured."}</p><div className="order-reference"><span>Demo reference</span><b>{reference}</b></div><div className="confirmation-points"><span><PackageCheck size={18} /> Catalogue-to-basket journey verified</span><span><FileText size={18} /> {persisted ? "Demo order recorded in Supabase" : "Confirmation ready for Supabase connection"}</span></div><div className="confirmation-actions"><Link href="/shop" className="button-primary">Return to catalogue <ArrowRight size={17} /></Link><Link href="/delivery-returns" className="text-link">Review delivery terms <ArrowRight size={16} /></Link></div></div></section></StoreLayout>;
}
