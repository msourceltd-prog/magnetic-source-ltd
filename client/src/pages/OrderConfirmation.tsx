/**
 * Trade Ledger, Recut: a professional no-payment order-request receipt that
 * confirms submission without implying payment, an accepted order, or fulfilment.
 */
import { ArrowRight, CheckCircle2, FileText, PackageCheck } from "lucide-react";
import { Link, useLocation } from "wouter";
import StoreLayout from "@/components/StoreLayout";

export default function OrderConfirmation() {
  const [location] = useLocation();
  const query = new URLSearchParams(window.location.search || location.split("?")[1] || "");
  const reference = query.get("ref") || "MS-REQ-REVIEW";
  return <StoreLayout><section className="confirmation-section"><div className="confirmation-card"><CheckCircle2 size={45} /><p className="eyebrow">Order request received</p><h1>Thank you for your request.</h1><p className="confirmation-copy">Your selected lines have been received by Magnetic Source. Our team will review the products and contact you using the details you provided. Availability and delivery options will be reviewed before any order is placed.</p><div className="order-reference"><span>Request reference</span><b>{reference}</b></div><div className="confirmation-points"><span><PackageCheck size={18} /> Selected catalogue lines are ready for review</span><span><FileText size={18} /> Our team will contact you with next steps</span></div><div className="confirmation-actions"><Link href="/shop" className="button-primary">Continue browsing <ArrowRight size={17} /></Link><Link href="/delivery-returns" className="text-link">Delivery &amp; returns <ArrowRight size={16} /></Link></div></div></section></StoreLayout>;
}
