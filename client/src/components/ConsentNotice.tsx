/**
 * Trade Ledger, Recut: a plain-English essential-storage notice with calm,
 * non-intrusive acknowledgement rather than a generic marketing overlay.
 */
import { useEffect, useState } from "react";

const storageKey = "magnetic-source-essential-storage-notice";

export default function ConsentNotice() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setVisible(localStorage.getItem(storageKey) !== "acknowledged"); }, []);
  if (!visible) return null;
  return <aside className="consent-notice" aria-label="Cookie and storage notice"><p>We use essential browser storage to keep your basket during this visit. We do not use advertising cookies.</p><button type="button" onClick={() => { localStorage.setItem(storageKey, "acknowledged"); setVisible(false); }}>Got it</button></aside>;
}
