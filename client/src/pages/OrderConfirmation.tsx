/**
 * Trade Ledger, Recut: a professional no-payment trade enquiry receipt that
 * confirms submission without implying payment, an accepted order, or fulfilment.
 */
import { ArrowRight, CheckCircle2, FileText, PackageCheck } from "lucide-react";
import { Link, useLocation } from "wouter";
import StoreLayout from "@/components/StoreLayout";

export default function OrderConfirmation() {
  const [location] = useLocation();
  const query = new URLSearchParams(location.split("?")[1] || "");
  const reference = query.get("ref") || "MS-ENQ-REVIEW";
  return <StoreLayout><section className="confirmation-section"><div className="confirmation-card"><CheckCircle2 size={45} /><p className="eyebrow">Trade enquiry received</p><h1>Thank you for your enquiry.</h1><p className="confirmation-copy">Your trade enquiry has been received by Magnetic Source. Our trade team will review the requested lines and contact you using the details you provided. Product availability, delivery options and trade pricing will be confirmed before any order is placed.</p><div className="order-reference"><span>Enquiry reference</span><b>{reference}</b></div><div className="confirmation-points"><span><PackageCheck size={18} /> Requested catalogue lines are ready for review</span><span><FileText size={18} /> Our trade team will contact you with next steps</span></div><div className="confirmation-actions"><Link href="/shop" className="button-primary">Continue browsing <ArrowRight size={17} /></Link><Link href="/delivery-returns" className="text-link">Delivery &amp; returns <ArrowRight size={16} /></Link></div></div></section></StoreLayout>;
}
