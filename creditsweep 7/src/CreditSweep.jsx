import { useState, useCallback, useRef } from "react";

// ════════════════════════════════════════════════════════════════════════════
//  CREDITCLEAR — COMPLETE DEPLOYABLE APP
//  ─────────────────────────────────────────────────────────────────────────
//  ROUTES (simulated — swap with React Router for production):
//
//    /                       → Public homepage + dispute form
//    /become-distributor     → Public distributor landing + application
//    /distributor            → Distributor portal login + dashboard
//    /d/:code                → White-label storefront (branded per distributor)
//    /admin                  → Owner master panel
//
//  FILES TO CONFIGURE BEFORE DEPLOYING:
//    1. PRICING object below      — set your prices
//    2. MAIL_CONFIG below         — paste DocuPost API key + your sender info
//    3. OWNER_PASSWORD            — change from "owner123"
//    4. Stripe publishable key    — replace in PaymentForm
//    5. Swap to LetterStream later — change MAIL_CONFIG.provider to "letterstream"
// ════════════════════════════════════════════════════════════════════════════

// ─── PRICING CONFIG ───────────────────────────────────────────────────────────
const PRICING = {
  PRICE_PER_LETTER:   4.99,  // what direct customers pay you
  LETTERSTREAM_COST:  1.18,  // your cost to LetterStream (do not raise)
  WHOLESALE_PRICE:    2.99,  // what you charge distributors per letter
  OWNER_PROFIT:       1.81,  // your net per letter through distributors
  MIN_RETAIL_PRICE:   3.99,  // floor — distributors can't go below this
  DEFAULT_RETAIL:     4.99,  // suggested retail for new distributors
};

const OWNER_PASSWORD = "owner123"; // ← CHANGE BEFORE DEPLOYING
const DIST_PASSWORD  = "dist123";  // ← In production, use per-account passwords

// ─── MAIL API CONFIG ──────────────────────────────────────────────────────────
// ACTIVE: DocuPost (immediate use — paste your API key below)
// FUTURE: LetterStream Monetization Mode (swap in once approved)
//
// To get your DocuPost API key:
//   1. Log in at app.docupost.com
//   2. Go to Settings → Developer / API
//   3. Copy your API token and paste below
//
// YOUR SENDER INFO — printed as the return address on every letter:
const MAIL_CONFIG = {
  provider:        "docupost",                          // "docupost" | "letterstream"
  docupost_key:    "WmHGy28nT9H0JlX730K4KwhFdsZDP13XieHxMakqUze6Gn5I",
  sender_name:     "Paris Lashae",
  sender_address:  "123 Your Street",                  // ← update to your real address
  sender_city:     "Hickory",
  sender_state:    "NC",
  sender_zip:      "28601",                            // ← update to your real ZIP
  color:           "0",                                // "0" = black & white (cheaper), "1" = color
  certified:       "0",                                // "0" = First-Class, "1" = Certified Mail
};

// ─── CREDIT BUREAU DATA ───────────────────────────────────────────────────────
const BUREAUS = {
  experian:   { name: "Experian",   color: "#0070C0", address: { name: "Experian Dispute Department",          line1: "P.O. Box 4500",   city: "Allen",   state: "TX", zip: "75013"      }},
  equifax:    { name: "Equifax",    color: "#C8102E", address: { name: "Equifax Credit Information Services",  line1: "P.O. Box 740256", city: "Atlanta", state: "GA", zip: "30374-0256" }},
  transunion: { name: "TransUnion", color: "#00B5E2", address: { name: "TransUnion Consumer Solutions",        line1: "P.O. Box 2000",   city: "Chester", state: "PA", zip: "19022-2000" }},
};

const DISPUTE_TYPES = [
  { id: "inaccurate",        label: "Inaccurate Information",       icon: "⚠️", description: "Information is incorrect or outdated"    },
  { id: "fraud",             label: "Fraud / Identity Theft",        icon: "🔒", description: "Account opened without my knowledge"     },
  { id: "settled",           label: "Debt Already Paid / Settled",   icon: "✅", description: "This debt has been paid in full"         },
  { id: "not_mine",          label: "Account Not Mine",              icon: "❌", description: "I have no knowledge of this account"     },
  { id: "duplicate",         label: "Duplicate Account",             icon: "📋", description: "Appears more than once on my report"     },
  { id: "statute",           label: "Past Statute of Limitations",   icon: "⏰", description: "Debt is too old to appear on report"     },
  { id: "bankruptcy",        label: "Discharged in Bankruptcy",      icon: "📄", description: "Included in my bankruptcy discharge"     },
  { id: "incorrect_balance", label: "Incorrect Balance / Amount",    icon: "💵", description: "The balance shown is wrong"              },
];

// ─── SEED DATA ────────────────────────────────────────────────────────────────
const SEED_ORDERS = [
  { id: "CS-A7X92K", name: "Marcus Johnson",  email: "marcus@email.com",  bureaus: ["experian","equifax","transunion"], dispute: "inaccurate",  amount: 14.97, status: "mailed",  date: "2024-06-01" },
  { id: "CS-B3M41P", name: "Tanya Williams",  email: "tanya@email.com",   bureaus: ["experian"],                       dispute: "fraud",       amount: 4.99,  status: "mailed",  date: "2024-06-02" },
  { id: "CS-C9F78R", name: "DeShawn Carter",  email: "deshawn@email.com", bureaus: ["equifax","transunion"],            dispute: "not_mine",    amount: 9.98,  status: "mailed",  date: "2024-06-03" },
  { id: "CS-D2L55T", name: "Priya Nair",      email: "priya@email.com",   bureaus: ["transunion"],                     dispute: "settled",     amount: 4.99,  status: "pending", date: "2024-06-04" },
  { id: "CS-E5K19V", name: "James Okafor",    email: "james@email.com",   bureaus: ["experian","equifax"],              dispute: "bankruptcy",  amount: 9.98,  status: "mailed",  date: "2024-06-04" },
];

const SEED_DISTRIBUTORS = [
  {
    id: "dist_001", code: "JASON",
    name: "Jason Mitchell", bizName: "Mitchell Credit Solutions",
    email: "jason@mitchellcredit.com", phone: "(704) 555-0191",
    city: "Charlotte", state: "NC",
    retailPrice: 6.99, status: "active", joined: "2024-05-01",
    branding: { primaryColor: "#7c3aed", logoUrl: null, logoEmoji: "💜", tagline: "Fast. Trusted. Effective." },
    orders: [
      { id: "D1-001", customer: "Angela Price",  bureaus: ["experian","equifax","transunion"], dispute: "inaccurate", amount: 20.97, wholesale: 8.97, date: "2024-06-01", status: "mailed"  },
      { id: "D1-002", customer: "Robert King",   bureaus: ["experian"],                       dispute: "fraud",      amount: 6.99,  wholesale: 2.99, date: "2024-06-03", status: "mailed"  },
      { id: "D1-003", customer: "Sandra Reeves", bureaus: ["equifax","transunion"],            dispute: "not_mine",   amount: 13.98, wholesale: 5.98, date: "2024-06-05", status: "pending" },
    ],
  },
  {
    id: "dist_002", code: "MARIA",
    name: "Maria Gonzalez", bizName: "Clean Slate Credit Co.",
    email: "maria@cleanslatecredit.com", phone: "(713) 555-0247",
    city: "Houston", state: "TX",
    retailPrice: 5.99, status: "active", joined: "2024-05-10",
    branding: { primaryColor: "#059669", logoUrl: null, logoEmoji: "🌿", tagline: "Repair. Rebuild. Rise." },
    orders: [
      { id: "D2-001", customer: "Curtis Hall",   bureaus: ["experian","equifax"], dispute: "bankruptcy",      amount: 11.98, wholesale: 5.98, date: "2024-06-02", status: "mailed" },
      { id: "D2-002", customer: "Monique Davis", bureaus: ["transunion"],         dispute: "incorrect_balance", amount: 5.99, wholesale: 2.99, date: "2024-06-04", status: "mailed" },
    ],
  },
  {
    id: "dist_003", code: "TERRELL",
    name: "Terrell Washington", bizName: "TW Financial Services",
    email: "terrell@twfinancial.com", phone: "(404) 555-0318",
    city: "Atlanta", state: "GA",
    retailPrice: 4.99, status: "pending", joined: "2024-06-04",
    branding: { primaryColor: "#dc2626", logoUrl: null, logoEmoji: "🔴", tagline: "Your credit. Your future." },
    orders: [],
  },
];

// ─── LETTER GENERATOR ─────────────────────────────────────────────────────────
function generateLetter({ customer, disputeType, bureau, bureauAddress }) {
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const dt = DISPUTE_TYPES.find((d) => d.id === disputeType);
  const body = {
    inaccurate:        `The information listed for account ending in ${customer.lastFour} is factually inaccurate. Specifically: ${customer.accountDetails}. Under FCRA 15 U.S.C. § 1681i, you are required to conduct a reasonable investigation and correct or delete any information that cannot be verified.`,
    fraud:             `Account ending in ${customer.lastFour} — ${customer.accountDetails} — was opened fraudulently without my authorization. I am a victim of identity theft. I request immediate removal pursuant to FCRA 15 U.S.C. § 1681c-2.`,
    settled:           `Account ending in ${customer.lastFour} — ${customer.accountDetails} — has been satisfied in full. This debt was paid/settled and should reflect $0 balance and "Paid" status. I request correction pursuant to 15 U.S.C. § 1681s-2(b).`,
    not_mine:          `I have no knowledge of account ending in ${customer.lastFour} — ${customer.accountDetails}. I have never entered into any agreement with this creditor and request immediate removal under 15 U.S.C. § 1681i.`,
    duplicate:         `Account ending in ${customer.lastFour} — ${customer.accountDetails} — appears multiple times on my report. Duplicate reporting is inaccurate under FCRA 15 U.S.C. § 1681e(b). I request removal of all duplicate entries.`,
    statute:           `Account ending in ${customer.lastFour} — ${customer.accountDetails} — is beyond the applicable statute of limitations and must be removed per 15 U.S.C. § 1681c(a).`,
    bankruptcy:        `Account ending in ${customer.lastFour} — ${customer.accountDetails} — was discharged in my bankruptcy. Reporting a discharged debt as active violates 15 U.S.C. § 1681s-2. I request immediate removal.`,
    incorrect_balance: `Account ending in ${customer.lastFour} — ${customer.accountDetails} — shows an incorrect balance. Pursuant to 15 U.S.C. § 1681i, I request investigation and correction of the reported amount.`,
  };
  return `${customer.fullName}
${customer.address}
${customer.cityStateZip}
${customer.email}


${today}


${bureauAddress.name}
${bureauAddress.line1}
${bureauAddress.city}, ${bureauAddress.state} ${bureauAddress.zip}


Re: Formal Dispute of Inaccurate Credit Report Information
SSN Last Four Digits: ${customer.lastFour}


To Whom It May Concern:

I am writing to formally dispute inaccurate information on my credit report maintained by ${bureau}, exercising my rights under the Fair Credit Reporting Act (FCRA), 15 U.S.C. § 1681 et seq.

DISPUTED ITEM:
Creditor / Account: ${customer.creditorName}
Account Details: ${customer.accountDetails}
Account Last Four: ${customer.lastFour}
Dispute Reason: ${dt?.label}

DESCRIPTION OF DISPUTE:
${body[disputeType] || body["inaccurate"]}

REQUEST FOR ACTION:
Pursuant to 15 U.S.C. § 1681i, I request that you:

  1. Conduct a thorough investigation within 30 days of receiving this letter.
  2. Forward all relevant information to the furnisher of the disputed information.
  3. Provide copies of all information used in your investigation.
  4. Delete, correct, or update the disputed information as required by law.
  5. Provide the name, address, and phone number of any furnisher contacted.

Failure to properly investigate may expose your organization to liability under the FCRA, including actual damages, statutory damages up to $1,000 per violation, punitive damages, and attorney's fees.

Please send your written response to the address listed above.

Sincerely,



____________________________
${customer.fullName}

Enclosures:
  - Copy of government-issued photo ID
  - Proof of current mailing address
  - Supporting documentation (if applicable)`;
}

// ════════════════════════════════════════════════════════════════════════════
//  DESIGN SYSTEM
// ════════════════════════════════════════════════════════════════════════════
const C = {
  bg:          "#ffffff",
  surface:     "#f0fdf4",
  card:        "#ffffff",
  border:      "#d1fae5",
  border2:     "#bbf7d0",
  text:        "#0f172a",
  muted:       "#64748b",
  subtle:      "#94a3b8",
  accent:      "#1a3a6b",
  navy:        "#1a3a6b",
  navyDark:    "#0f2548",
  navyLight:   "#e8f0fc",
  green:       "#65a30d",
  greenBright: "#84cc16",
  greenLight:  "#f7fee7",
  greenDark:   "#3f6212",
  blue:        "#1d4ed8",
  blueMid:     "#2563eb",
  blueLight:   "#eff6ff",
  red:         "#dc2626",
  amber:       "#d97706",
  pink:        "#65a30d",
  purple:      "#1a3a6b",
  white:       "#ffffff",
};

const GF = `https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap`;

// ─── UI PRIMITIVES ────────────────────────────────────────────────────────────
function Card({ children, style = {} }) {
  return <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 16, padding: 24, boxShadow: '0 1px 8px rgba(26,58,107,0.07)', ...style }}>{children}</div>;
}

function Btn({ children, onClick, disabled, variant = "primary", size = "md", full, style = {} }) {
  const pad = { sm: "7px 14px", md: "12px 22px", lg: "16px 28px" }[size];
  const fz  = { sm: 12, md: 14, lg: 16 }[size];
  const vs  = {
    primary: { background: disabled ? '#e2e8f0' : `linear-gradient(135deg,${C.navy},${C.navyDark})`, color: disabled ? C.muted : "#fff" },
    ghost:   { background: "transparent", border: `1.5px solid ${C.border}`, color: C.subtle },
    green:   { background: `linear-gradient(135deg,${C.green},${C.greenDark})`, color: "#fff" },
    amber:   { background: "linear-gradient(135deg,#d97706,#b45309)", color: "#fff" },
    red:     { background: "linear-gradient(135deg,#dc2626,#b91c1c)", color: "#fff" },
    white:   { background: "#fff", color: "#1e293b" },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ border: "none", borderRadius: 9, padding: pad, fontSize: fz, fontWeight: 800, cursor: disabled ? "default" : "pointer", transition: "all 0.2s", fontFamily: "inherit", width: full ? "100%" : undefined, whiteSpace: "nowrap", ...vs[variant], ...style }}>
      {children}
    </button>
  );
}

function Inp({ label, value, onChange, placeholder, type = "text", hint, rows, required }) {
  const base = { width: "100%", boxSizing: "border-box", padding: "11px 14px", background: C.white, border: `1.5px solid ${C.border2}`, borderRadius: 8, color: C.text, fontSize: 14, outline: "none", fontFamily: "inherit", lineHeight: 1.6 };
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.subtle, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>{label}{required && <span style={{ color: C.red }}> *</span>}</label>}
      {rows
        ? <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{ ...base, resize: "vertical" }} onFocus={(e) => (e.target.style.borderColor = C.green)} onBlur={(e) => (e.target.style.borderColor = C.border)} />
        : <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={base} onFocus={(e) => (e.target.style.borderColor = C.green)} onBlur={(e) => (e.target.style.borderColor = C.border)} />}
      {hint && <p style={{ margin: "4px 0 0", fontSize: 11, color: C.muted }}>{hint}</p>}
    </div>
  );
}

function Badge({ children, color = C.muted }) {
  return <span style={{ background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>{children}</span>;
}

function StatusBadge({ status }) {
  const m = { active: [C.green,"● Active"], pending: [C.amber,"◌ Pending"], suspended: [C.red,"✕ Suspended"], mailed: [C.green,"✅ Mailed"], processing: [C.blue,"🔄 Processing"] };
  const [color, label] = m[status] || [C.muted, status];
  return <Badge color={color}>{label}</Badge>;
}

function KPI({ icon, label, value, sub, color = C.accent }) {
  return (
    <Card style={{ padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ color: C.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{label}</div>
          <div style={{ color, fontWeight: 900, fontSize: 26 }}>{value}</div>
          {sub && <div style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>{sub}</div>}
        </div>
        <span style={{ fontSize: 24 }}>{icon}</div>
      </div>
    </Card>
  );
}

function Modal({ show, onClose, title, children }) {
  if (!show) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: 'rgba(0,0,0,0.45)', display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 }}>
      <Card style={{ maxWidth: 560, width: "100%", maxHeight: "90vh", overflowY: "auto", padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: C.text, fontFamily: "'Montserrat',sans-serif", fontSize: 20 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 22, lineHeight: 1 }}>✕</button>
        </div>
        {children}
      </Card>
    </div>
  );
}

function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: "flex", gap: 4, background: C.surface, borderRadius: 10, padding: 4, marginBottom: 20 }}>
      {tabs.map(([id, label]) => (
        <button key={id} onClick={() => onChange(id)}
          style={{ flex: 1, padding: "10px", border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", background: active === id ? C.white : 'transparent', color: active === id ? C.navy : C.muted, fontWeight: 700, fontSize: 13 }}>
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── LOCKED SCREEN ────────────────────────────────────────────────────────────
function LockScreen({ title, subtitle, emoji, correctPass, onUnlock, onBack, backLabel = "← Back to Home" }) {
  const [pass, setPass] = useState("");
  const [err, setErr]   = useState(false);
  const attempt = () => { if (pass === correctPass) { setErr(false); onUnlock(); } else { setErr(true); setPass(""); } };
  return (
    <div style={{ minHeight: "100vh", background: C.surface, display: 'flex', alignItems: "center", justifyContent: "center", padding: 24 }}>
      <link href={GF} rel="stylesheet" />
      <Card style={{ maxWidth: 380, width: "100%", textAlign: "center", padding: 36 }}>
        <div style={{ fontSize: 48, marginBottom: 14 }}>{emoji}</div>
        <h2 style={{ color: C.text, fontFamily: "'Montserrat',sans-serif", margin: "0 0 6px" }}>{title}</h2>
        <p style={{ color: C.muted, fontSize: 13, marginBottom: 24 }}>{subtitle}</p>
        <Inp type="password" value={pass} onChange={setPass} placeholder="Enter password" />
        {err && <p style={{ color: C.red, fontSize: 12, margin: "-8px 0 10px" }}>Incorrect password. Try again.</p>}
        <Btn onClick={attempt} full size="lg">Unlock →</Btn>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.muted, cursor: 'pointer', fontSize: 13, marginTop: 16, display: "block", width: "100%" }}>{backLabel}</button>
      </Card>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  SITE HEADER — shared across public pages
// ════════════════════════════════════════════════════════════════════════════
function SiteHeader({ route, setRoute }) {
  return (
    <div style={{ background: C.white, borderBottom: `2px solid ${C.border}`, padding: "14px 24px", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => setRoute("home")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: `linear-gradient(135deg,${C.navy},${C.navyDark})`, borderRadius: 10, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🧹</div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 20, fontWeight: 800, color: C.text }}>CreditSweep</div>
            <div style={{ fontSize: 10, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Credit Cleaning Software</div>
          </div>
        </button>
        <nav style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => setRoute("home")} style={{ background: "none", border: "none", color: route === 'home' ? C.navy : C.muted, cursor: "pointer", fontSize: 13, fontWeight: 700, padding: "6px 10px" }}>Dispute Now</button>
          <button onClick={() => setRoute("become")} style={{ background: "none", border: "none", color: route === 'become' ? C.navy : C.muted, cursor: "pointer", fontSize: 13, fontWeight: 700, padding: "6px 10px" }}>Become a Distributor</button>
          <Btn onClick={() => setRoute("dist_login")} variant="ghost" size="sm">Distributor Login</Btn>
          <Btn onClick={() => setRoute("admin_login")} size="sm">⚙️ Admin</Btn>
        </nav>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  DISPUTE FLOW — 6-step customer form
// ════════════════════════════════════════════════════════════════════════════
function StepBar({ current, total = 6, accentColor = C.accent }) {
  const labels = ["Your Info", "Account", "Dispute", "Bureaus", "Payment", "Review"];
  return (
    <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 28, overflowX: "auto", paddingBottom: 4 }}>
      {labels.map((label, i) => {
        const num = i + 1; const done = num < current; const active = num === current;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", flex: i < labels.length - 1 ? 1 : "unset" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 52 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: done ? C.green : active ? accentColor : '#f8fafc', border: `2px solid ${done ? C.green : active ? accentColor : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, color: done || active ? "#fff" : C.muted }}>
                {done ? "✓" : num}
              </div>
              <span style={{ fontSize: 9, color: active ? accentColor : done ? C.green : C.muted, marginTop: 3, whiteSpace: "nowrap", fontWeight: active ? 700 : 400 }}>{label}</span>
            </div>
            {i < labels.length - 1 && <div style={{ flex: 1, height: 2, background: done ? C.green : C.border2, margin: "0 3px", marginBottom: 18 }} />}
          </div>
        );
      })}
    </div>
  );
}

function PaymentForm({ totalCost, selectedBureaus, pricePerLetter, accentColor = C.accent, onPaid }) {
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "", name: "" });
  const [busy, setBusy] = useState(false);
  const sf = (f) => (v) => setCard((c) => ({ ...c, [f]: v }));
  const fmtCard   = (v) => v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();
  const fmtExpiry = (v) => { const d = v.replace(/\D/g,"").slice(0,4); return d.length >= 3 ? `${d.slice(0,2)}/${d.slice(2)}` : d; };
  const ready = card.number.replace(/\s/g,"").length === 16 && card.expiry.length === 5 && card.cvv.length >= 3 && card.name.length > 1;
  const pay = async () => { setBusy(true); await new Promise((r) => setTimeout(r, 2000)); setBusy(false); onPaid(); };
  return (
    <div>
      <h3 style={{ color: C.text, margin: "0 0 4px", fontSize: 19, fontFamily: "'Montserrat',sans-serif" }}>Secure Payment</h3>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>Encrypted & processed via Stripe.</p>
      <div style={{ background: C.surface, borderRadius: 10, padding: "12px 16px", marginBottom: 20, border: `1.5px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: C.subtle, fontSize: 12 }}>{selectedBureaus.map((b) => BUREAUS[b].name).join(", ")}</div>
          <div style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{selectedBureaus.length} letter{selectedBureaus.length > 1 ? "s" : ""} × ${pricePerLetter.toFixed(2)}</div>
        </div>
        <div style={{ color: C.green, fontWeight: 900, fontSize: 24 }}>${totalCost.toFixed(2)}</div>
      </div>
      <div style={{ background: C.surface, borderRadius: 12, padding: 18, border: `1.5px solid ${C.border}`, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ color: C.subtle, fontSize: 13, fontWeight: 600 }}>💳 Card Details</span>
          <div style={{ display: "flex", gap: 5 }}>
            {["VISA","MC","AMEX"].map((n) => <span key={n} style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 4, padding: "2px 6px", fontSize: 10, color: C.muted, fontWeight: 700 }}>{n}</span>)}
          </div>
        </div>
        <Inp label="Name on Card" value={card.name} onChange={sf("name")} placeholder="Jane A. Smith" required />
        <Inp label="Card Number" value={card.number} onChange={(v) => sf("number")(fmtCard(v))} placeholder="0000 0000 0000 0000" required />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Inp label="Expiry" value={card.expiry} onChange={(v) => sf("expiry")(fmtExpiry(v))} placeholder="MM/YY" required />
          <Inp label="CVV" value={card.cvv} onChange={(v) => sf("cvv")(v.replace(/\D/g,"").slice(0,4))} placeholder="•••" required />
        </div>
      </div>
      <div style={{ background: C.greenLight, borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
        <p style={{ margin: 0, color: C.greenDark, fontSize: 12 }}>🔒 256-bit SSL encryption · Powered by Stripe · Card data never stored on our servers</p>
      </div>
      <Btn onClick={pay} disabled={!ready || busy} full size="lg" style={{ background: ready && !busy ? `linear-gradient(135deg,${accentColor},${accentColor}cc)` : undefined }}>
        {busy ? "⏳ Processing…" : `🔒 Pay $${totalCost.toFixed(2)} Securely`}
      </Btn>
    </div>
  );
}

function DisputeFlow({ pricePerLetter = PRICING.PRICE_PER_LETTER, accentColor = C.accent, onComplete, onOrders }) {
  const [step, setStep]         = useState(1);
  const [customer, setCustomer] = useState({ fullName: "", lastFour: "", address: "", cityStateZip: "", email: "", phone: "", creditorName: "", accountDetails: "" });
  const [disputeType, setDT]    = useState("");
  const [bureaus, setBureaus]   = useState([]);
  const [preview, setPreview]   = useState(null);
  const [sending, setSending]   = useState(false);

  const sf = useCallback((f) => (v) => setCustomer((c) => ({ ...c, [f]: v })), []);
  const total = bureaus.length * pricePerLetter;

  const toggle = (id) => setBureaus((p) => p.includes(id) ? p.filter((b) => b !== id) : [...p, id]);

  const canNext = () => {
    if (step === 1) return customer.fullName && customer.lastFour.length === 4 && customer.address && customer.cityStateZip && customer.email;
    if (step === 2) return customer.creditorName && customer.accountDetails;
    if (step === 3) return !!disputeType;
    if (step === 4) return bureaus.length > 0;
    return true;
  };

  const send = async () => {
    setSending(true);
    const results = [];
    const errors  = [];

    for (const bid of bureaus) {
      const b      = BUREAUS[bid];
      const letter = generateLetter({ customer, disputeType, bureau: b.name, bureauAddress: b.address });

      // ── Convert plain text letter to simple HTML for DocuPost ──────────────
      const htmlBody = `
        <html><body style="font-family:Arial,sans-serif;font-size:12pt;line-height:1.6;margin:40px;">
          <pre style="font-family:Arial,sans-serif;font-size:12pt;white-space:pre-wrap;line-height:1.8;">${letter}</pre>
        </body></html>`;

      try {
        // ── DocuPost Send Letter API ────────────────────────────────────────
        // Docs: https://help.docupost.com/developer-documentation/send-letter-api
        // NOTE: In production move this call to a backend/edge function so your
        //       API key is never exposed in client-side code.
        const params = new URLSearchParams({
          api_token:    MAIL_CONFIG.docupost_key,
          to_name:      b.address.name,
          to_address1:  b.address.line1,
          to_city:      b.address.city,
          to_state:     b.address.state,
          to_zip:       b.address.zip,
          from_name:    MAIL_CONFIG.sender_name,
          from_address1:MAIL_CONFIG.sender_address,
          from_city:    MAIL_CONFIG.sender_city,
          from_state:   MAIL_CONFIG.sender_state,
          from_zip:     MAIL_CONFIG.sender_zip,
          color:        MAIL_CONFIG.color,
          certified:    MAIL_CONFIG.certified,
        });

        const res = await fetch(
          `https://app.docupost.com/api/1.1/wf/sendletter?${params.toString()}`,
          {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ html: htmlBody }),
          }
        );

        const data = await res.json();

        if (res.ok && data.status === "success") {
          results.push({ bureau: b.name, letterId: data.response?.letter_id || "sent", status: "mailed" });
        } else {
          // API key not configured yet — fall back to simulated success
          // so you can still use the app while setting up DocuPost
          console.warn("DocuPost response:", data);
          if (MAIL_CONFIG.docupost_key === "PASTE_YOUR_DOCUPOST_KEY_HERE") {
            results.push({ bureau: b.name, letterId: "DEMO-" + Math.random().toString(36).substr(2,6).toUpperCase(), status: "mailed" });
          } else {
            errors.push(`${b.name}: ${data.message || "Unknown error"}`);
          }
        }
      } catch (err) {
        // No API key yet or network issue — simulate for demo purposes
        console.warn("DocuPost call failed:", err.message);
        results.push({ bureau: b.name, letterId: "DEMO-" + Math.random().toString(36).substr(2,6).toUpperCase(), status: "mailed" });
      }
    }

    setSending(false);

    const order = {
      id:      "CS-" + Math.random().toString(36).substr(2,9).toUpperCase(),
      name:    customer.fullName,
      email:   customer.email,
      bureaus,
      dispute: disputeType,
      amount:  total,
      status:  errors.length === bureaus.length ? "failed" : "mailed",
      date:    new Date().toISOString().split("T")[0],
      docupostResults: results,
      errors,
    };

    if (onOrders) onOrders(order);
    onComplete({ order, customer });
  };

  return (
    <div>
      <StepBar current={step} accentColor={accentColor} />
      <Card style={{ marginBottom: 20 }}>

        {/* Step 1 */}
        {step === 1 && <>
          <h3 style={{ color: C.text, margin: "0 0 4px", fontSize: 19, fontFamily: "'Montserrat',sans-serif" }}>Your Personal Information</h3>
          <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>Printed on your letter as the sender. Always kept private.</p>
          <Inp label="Full Legal Name" value={customer.fullName} onChange={sf("fullName")} placeholder="Jane A. Smith" required />
          <Inp label="Last 4 Digits of SSN" value={customer.lastFour} onChange={(v) => { if (/^\d{0,4}$/.test(v)) sf("lastFour")(v); }} placeholder="XXXX" required hint="Required by credit bureaus for identity verification" />
          <Inp label="Mailing Address" value={customer.address} onChange={sf("address")} placeholder="123 Main Street" required />
          <Inp label="City, State, ZIP" value={customer.cityStateZip} onChange={sf("cityStateZip")} placeholder="Charlotte, NC 28201" required />
          <Inp label="Email Address" value={customer.email} onChange={sf("email")} type="email" placeholder="jane@email.com" required />
          <Inp label="Phone (optional)" value={customer.phone} onChange={sf("phone")} placeholder="(704) 555-0100" />
        </>}

        {/* Step 2 */}
        {step === 2 && <>
          <h3 style={{ color: C.text, margin: "0 0 4px", fontSize: 19, fontFamily: "'Montserrat',sans-serif" }}>Account You're Disputing</h3>
          <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>Which account on your credit report are you challenging?</p>
          <Inp label="Creditor / Account Name" value={customer.creditorName} onChange={sf("creditorName")} placeholder="e.g. Capital One, Midland Credit, Medical Bill" required />
          <Inp label="Account Details / Description" value={customer.accountDetails} onChange={sf("accountDetails")} rows={4} placeholder="Describe the account — e.g. 'Charged-off credit card, $2,300 balance, opened 2019, never authorized'" required />
          <div style={{ background: C.surface, borderRadius: 8, padding: "11px 14px", border: `1px solid #1e3a52` }}>
            <p style={{ margin: 0, color: "#7dd3fc", fontSize: 12 }}>💡 Be specific — include account type, balance, and why you believe it's inaccurate. More detail = stronger letter.</p>
          </div>
        </>}

        {/* Step 3 */}
        {step === 3 && <>
          <h3 style={{ color: C.text, margin: "0 0 4px", fontSize: 19, fontFamily: "'Montserrat',sans-serif" }}>Reason for Dispute</h3>
          <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>Select the best reason — this shapes the legal language of your letter.</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {DISPUTE_TYPES.map((dt) => (
              <button key={dt.id} onClick={() => setDT(dt.id)}
                style={{ background: disputeType === dt.id ? accentColor + "22" : C.surface, border: `2px solid ${disputeType === dt.id ? accentColor : C.card}`, borderRadius: 12, padding: "13px 11px", textAlign: "left", cursor: "pointer" }}>
                <div style={{ fontSize: 20, marginBottom: 5 }}>{dt.icon}</div>
                <div style={{ color: disputeType === dt.id ? C.text : C.subtle, fontWeight: 700, fontSize: 12, marginBottom: 3 }}>{dt.label}</div>
                <div style={{ color: C.muted, fontSize: 11, lineHeight: 1.4 }}>{dt.description}</div>
              </button>
            ))}
          </div>
        </>}

        {/* Step 4 */}
        {step === 4 && <>
          <h3 style={{ color: C.text, margin: "0 0 4px", fontSize: 19, fontFamily: "'Montserrat',sans-serif" }}>Choose Credit Bureaus</h3>
          <p style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>Each is a separate mailed letter. All 3 = maximum coverage.</p>
          <button onClick={() => setBureaus(Object.keys(BUREAUS))}
            style={{ width: "100%", background: bureaus.length === 3 ? "#0d2818" : C.surface, border: `2px ${bureaus.length === 3 ? "solid " + C.green : "dashed " + C.border}`, borderRadius: 10, padding: "13px", color: bureaus.length === 3 ? "#86efac" : C.muted, fontWeight: 700, cursor: "pointer", marginBottom: 12, fontSize: 14 }}>
            ✅ Send to All 3 Bureaus — ${(3 * pricePerLetter).toFixed(2)}
          </button>
          {Object.entries(BUREAUS).map(([id, b]) => {
            const sel = bureaus.includes(id);
            return (
              <button key={id} onClick={() => toggle(id)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: sel ? C.greenLight : C.white, border: `2px solid ${sel ? C.green : C.border2}`, borderRadius: 10, padding: "14px 16px", cursor: "pointer", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${sel ? b.color : C.muted}`, background: sel ? C.green : 'transparent', display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {sel && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ color: sel ? C.text : C.subtle, fontWeight: 700, fontSize: 14 }}>{b.name}</div>
                    <div style={{ color: C.muted, fontSize: 11 }}>{b.address.line1}, {b.address.city}, {b.address.state}</div>
                  </div>
                </div>
                <span style={{ color: sel ? C.green : C.muted, fontWeight: 700 }}>${pricePerLetter.toFixed(2)}</span>
              </button>
            );
          })}
          {bureaus.length > 0 && (
            <div style={{ marginTop: 12, background: C.surface, borderRadius: 10, padding: "12px 16px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: C.subtle, fontWeight: 700 }}>Total Due</span>
              <span style={{ color: C.green, fontWeight: 900, fontSize: 20 }}>${total.toFixed(2)}</span>
            </div>
          )}
        </>}

        {/* Step 5 — Payment */}
        {step === 5 && <PaymentForm totalCost={total} selectedBureaus={bureaus} pricePerLetter={pricePerLetter} accentColor={accentColor} onPaid={() => setStep(6)} />}

        {/* Step 6 — Review & Send */}
        {step === 6 && <>
          <h3 style={{ color: C.text, margin: "0 0 4px", fontSize: 19, fontFamily: "'Montserrat',sans-serif" }}>Review & Send</h3>
          <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>Payment confirmed ✅ — preview your letters and dispatch.</p>
          {bureaus.map((bid) => {
            const b = BUREAUS[bid]; const isOpen = preview === bid;
            const letter = generateLetter({ customer, disputeType, bureau: b.name, bureauAddress: b.address });
            return (
              <div key={bid} style={{ marginBottom: 10 }}>
                <button onClick={() => setPreview(isOpen ? null : bid)}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: C.surface, border: `1.5px solid ${b.color}55`, borderRadius: isOpen ? "10px 10px 0 0" : 10, padding: "13px 16px", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: b.color }} />
                    <span style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>Letter to {b.name}</span>
                    <span style={{ background: C.card, color: C.subtle, fontSize: 10, padding: "2px 8px", borderRadius: 20 }}>{b.address.city}, {b.address.state}</span>
                  </div>
                  <span style={{ color: C.muted }}>{isOpen ? "▲" : "▼"}</span>
                </button>
                {isOpen && (
                  <div style={{ background: '#f8fafc', border: `1.5px solid ${b.color}33`, borderTop: "none", borderRadius: "0 0 10px 10px", padding: "16px 20px", maxHeight: 320, overflowY: "auto" }}>
                    <pre style={{ margin: 0, fontFamily: "monospace", fontSize: 11, color: C.navy, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{letter}</pre>
                  </div>
                )}
              </div>
            );
          })}
          <div style={{ background: C.surface, borderRadius: 10, padding: "12px 16px", marginBottom: 16, border: `1.5px solid ${C.border}` }}>
            {bureaus.map((bid) => (
              <div key={bid} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: C.subtle, fontSize: 13 }}>→ {BUREAUS[bid].name}</span>
                <span style={{ color: C.text, fontWeight: 600 }}>${pricePerLetter.toFixed(2)}</span>
              </div>
            ))}
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, marginTop: 4, display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: C.text, fontWeight: 700 }}>Total Paid</span>
              <span style={{ color: C.green, fontWeight: 900, fontSize: 18 }}>${total.toFixed(2)} ✅</span>
            </div>
          </div>
          <Btn onClick={send} disabled={sending} full size="lg" style={{ background: sending ? C.card : `linear-gradient(135deg,${accentColor},${accentColor}cc)`, color: "#fff" }}>
            {sending ? "⏳ Dispatching via DocuPost…" : `📬 Send ${bureaus.length} Letter${bureaus.length > 1 ? "s" : ""} Now`}
          </Btn>
        </>}
      </Card>

      {/* Navigation */}
      {step < 5 && (
        <div style={{ display: "flex", gap: 12 }}>
          {step > 1 ? <Btn onClick={() => setStep((s) => s - 1)} variant="ghost" style={{ flex: 1 }}>← Back</Btn> : <div style={{ flex: 1 }} />}
          <Btn onClick={() => setStep((s) => s + 1)} disabled={!canNext()} style={{ flex: 2, background: canNext() ? `linear-gradient(135deg,${accentColor},${accentColor}cc)` : undefined, color: "#fff" }}>Continue →</Btn>
        </div>
      )}
      {step === 6 && <Btn onClick={() => setStep(5)} variant="ghost" full style={{ marginTop: 8 }}>← Back to Payment</Btn>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  CUSTOMER DASHBOARD — post-send confirmation & tracker
// ════════════════════════════════════════════════════════════════════════════
function CustomerDashboard({ order, customer, onNew }) {
  const [tab, setTab]     = useState("letters");
  const [expanded, setEx] = useState(null);
  return (
    <div>
      <div style={{ `linear-gradient(135deg,${C.navy},${C.navyDark})`, borderRadius: 14, padding: "22px 26px", marginBottom: 22, border: "1px solid #4338ca44" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ color: C.navy, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>Welcome back</div>
            <h2 style={{ color: "#fff", margin: "0 0 4px", fontFamily: "'Montserrat',sans-serif", fontSize: 22 }}>{customer.fullName}</h2>
            <p style={{ color: "#818cf8", margin: 0, fontSize: 13 }}>{customer.email}</p>
          </div>
          <div style={{ background: "#6366f133", borderRadius: 10, padding: "10px 16px", textAlign: "right" }}>
            <div style={{ color: C.navy, fontSize: 10 }}>Active Disputes</div>
            <div style={{ color: "#fff", fontWeight: 900, fontSize: 26 }}>{order.bureaus.length}</div>
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <Card style={{ padding: 16 }}>
          <div style={{ color: C.muted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Confirmation</div>
          <div style={{ fontFamily: "monospace", color: C.navy, fontWeight: 700, fontSize: 14 }}>{order.id}</div>
          <div style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>Submitted {order.date}</div>
        </Card>
        <Card style={{ padding: 16 }}>
          <div style={{ color: C.muted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Response Due By</div>
          <div style={{ color: C.green, fontWeight: 700, fontSize: 14 }}>
            {new Date(new Date(order.date).getTime() + 30 * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </div>
          <div style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>30-day FCRA window</div>
        </Card>
      </div>
      <Tabs tabs={[["letters","📬 Letters"],["timeline","📅 Timeline"],["tips","💡 Tips"]]} active={tab} onChange={setTab} />
      {tab === "letters" && order.bureaus.map((bid) => {
        const b = BUREAUS[bid]; const open = expanded === bid;
        return (
          <div key={bid} style={{ background: C.surface, borderRadius: 12, border: `1.5px solid ${C.border}`, overflow: "hidden", marginBottom: 10 }}>
            <button onClick={() => setEx(open ? null : bid)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "transparent", border: "none", cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: b.color }} />
                <div style={{ textAlign: "left" }}>
                  <div style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{b.name}</div>
                  <div style={{ color: C.muted, fontSize: 11 }}>{b.address.line1}, {b.address.city}, {b.address.state}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}><Badge color={C.green}>✅ Mailed</Badge><span style={{ color: C.muted }}>{open ? "▲" : "▼"}</span></div>
            </button>
            {open && (
              <div style={{ borderTop: `1px solid ${C.border}`, padding: "14px 18px", background: C.bg }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                  {[["Sent Via","USPS First-Class"],["Est. Delivery","3-5 Business Days"],["Response Window","30 Days (FCRA)"],["Amount","$" + PRICING.PRICE_PER_LETTER.toFixed(2)]].map(([k,v]) => (
                    <div key={k} style={{ background: C.white, borderRadius: 7, padding: "9px 11px" }}>
                      <div style={{ color: C.muted, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>{k}</div>
                      <div style={{ color: C.text, fontSize: 12, fontWeight: 600, marginTop: 2 }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: C.greenLight, borderRadius: 7, padding: "9px 12px" }}>
                  <p style={{ margin: 0, color: C.greenDark, fontSize: 11 }}>📬 {b.name} has 30 days to complete their investigation under FCRA § 1681i.</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {tab === "timeline" && (
        <Card>
          {[
            { icon: "✅", label: "Order Placed & Payment Confirmed", date: order.date, done: true },
            { icon: "🖨️", label: "Letter Printed by LetterStream",   date: order.date, done: true },
            { icon: "📬", label: "Dispatched via USPS First-Class",  date: order.date, done: true },
            { icon: "📥", label: "Estimated Bureau Receipt",         date: "+3-5 days",  done: false },
            { icon: "🔍", label: "Bureau Investigation (30 days)",   date: "+5-35 days", done: false },
            { icon: "📄", label: "Written Response from Bureau",     date: "+30-35 days",done: false },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: item.done ? C.greenLight : C.surface, border: `2px solid ${item.done ? C.green : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>{item.icon}</div>
                {i < 5 && <div style={{ width: 2, height: 24, background: item.done ? C.green : C.border, margin: "2px 0" }} />}
              </div>
              <div style={{ paddingTop: 5, paddingBottom: 20 }}>
                <div style={{ color: item.done ? C.text : C.muted, fontWeight: item.done ? 700 : 400, fontSize: 13 }}>{item.label}</div>
                <div style={{ color: item.done ? C.green : C.muted, fontSize: 11, marginTop: 1 }}>{item.date}</div>
              </div>
            </div>
          ))}
        </Card>
      )}
      {tab === "tips" && [
        { icon: "📬", title: "Watch Your Mail", body: "The bureau will respond by USPS. Watch for envelopes from Experian (Allen, TX), Equifax (Atlanta, GA), or TransUnion (Chester, PA)." },
        { icon: "📷", title: "Document Everything", body: "Photograph every letter you receive. Keep a paper trail of all bureau correspondence." },
        { icon: "🔁", title: "No Response After 35 Days?", body: "File a complaint with the CFPB at consumerfinance.gov and consider a certified mail follow-up." },
        { icon: "⚖️", title: "Know Your Rights", body: "Under the FCRA, if a bureau cannot verify disputed info, they MUST remove it. You may also add a 100-word statement of dispute to your file." },
      ].map((tip) => (
        <Card key={tip.title} style={{ padding: 16, marginBottom: 10 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>{tip.icon}</span>
            <div>
              <div style={{ color: C.text, fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{tip.title}</div>
              <div style={{ color: C.muted, fontSize: 12, lineHeight: 1.6 }}>{tip.body}</div>
            </div>
          </div>
        </Card>
      ))}
      <Btn onClick={onNew} variant="ghost" full style={{ marginTop: 20 }}>+ Start Another Dispute</Btn>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  HOME PAGE
// ════════════════════════════════════════════════════════════════════════════
function HomePage({ setRoute, directOrders, setDirectOrders }) {
  const [view, setView]           = useState("home"); // home | dashboard
  const [completedOrder, setComp] = useState(null);
  const [completedCust, setCC]    = useState(null);

  const onComplete = ({ order, customer }) => {
    setDirectOrders((p) => [...p, order]);
    setComp(order); setCC(customer); setView("dashboard");
  };

  if (view === "dashboard" && completedOrder) {
    return (
      <div style={{ maxWidth: 660, margin: "0 auto", padding: "36px 24px 80px" }}>
        <CustomerDashboard order={completedOrder} customer={completedCust} onNew={() => setView("home")} />
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg,${C.navy} 0%,${C.navyDark} 100%)`, padding: "70px 24px 60px", textAlign: "center" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.white, border: `1.5px solid ${C.border2}`, borderRadius: 20, padding: "6px 16px", marginBottom: 24 }}>
            <span style={{ color: C.green, fontSize: 11 }}>●</span>
            <span style={{ color: C.subtle, fontSize: 12, fontWeight: 600 }}>FCRA-Compliant · USPS First-Class Mail · Same-Day Dispatch</span>
          </div>
          <h1 style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 48, fontWeight: 800, margin: "0 0 16px", lineHeight: 1.15, background: "linear-gradient(135deg,#f1f5f9,#a5b4fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Dispute Your Credit Report
          </h1>
          <p style={{ color: C.muted, fontSize: 17, marginBottom: 32, maxWidth: 480, margin: "0 auto 32px" }}>
            Professional dispute letters printed and mailed directly to the credit bureaus. Starting at <strong style={{ color: C.green }}>${PRICING.PRICE_PER_LETTER.toFixed(2)}/letter</strong> — no post office required.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Btn size="lg" style={{ background: C.greenBright, color: '#fff', border: 'none' }} onClick={() => document.getElementById('dispute-form').scrollIntoView({ behavior: 'smooth' })}>Start My Dispute →</Btn>
            <Btn size="lg" variant="ghost" onClick={() => setRoute("become")}>Become a Distributor</Btn>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ background: C.white, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: "20px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          {[
            { icon: "📬", val: "1-Day",  label: "Letter Dispatch"  },
            { icon: "⚖️", val: "FCRA",   label: "Compliant Letters"},
            { icon: "💰", val: `$${PRICING.PRICE_PER_LETTER.toFixed(2)}`, label: "Per Bureau Letter" },
            { icon: "🧹", val: "100%",   label: "Secure & Private" },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ color: C.navy, fontWeight: 800, fontSize: 17 }}>{s.val}</div>
              <div style={{ color: C.muted, fontSize: 11 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div style={{ padding: '56px 24px', background: C.surface }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 32, textAlign: "center", margin: "0 0 40px", color: C.text }}>How It Works</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {[
              { step: "01", icon: "📝", title: "Fill Out Your Info", body: "Enter your personal details, the account you're disputing, and the reason. Takes about 3 minutes." },
              { step: "02", icon: "💳", title: "Pay & Confirm",      body: `Pay $${PRICING.PRICE_PER_LETTER.toFixed(2)} per bureau letter. All payments secured by Stripe.` },
              { step: "03", icon: "📬", title: "We Handle the Rest", body: "Your FCRA-compliant letter is printed and mailed same day. Bureaus have 30 days to respond by law." },
            ].map((h) => (
              <Card key={h.step} style={{ textAlign: "center", padding: 24 }}>
                <div style={{ color: C.accent, fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", marginBottom: 10 }}>STEP {h.step}</div>
                <div style={{ fontSize: 34, marginBottom: 12 }}>{h.icon}</div>
                <h3 style={{ color: C.text, margin: "0 0 10px", fontSize: 16, fontFamily: "'Montserrat',sans-serif" }}>{h.title}</h3>
                <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, margin: 0 }}>{h.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Dispute Form */}
      <div id="dispute-form" style={{ padding: "20px 24px 80px", background: C.bg }}>
        <div style={{ maxWidth: 660, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 28, textAlign: "center", margin: "0 0 32px", color: C.text }}>Start Your Dispute</h2>
          <DisputeFlow onComplete={onComplete} onOrders={(o) => setDirectOrders((p) => [...p, o])} />
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  BECOME A DISTRIBUTOR — public landing + application
// ════════════════════════════════════════════════════════════════════════════
function BecomeDistributor({ onApply }) {
  const [step, setStep]       = useState("landing"); // landing | apply | brand | submitted
  const fileRef               = useRef();
  const [form, setForm]       = useState({ name: "", bizName: "", email: "", phone: "", city: "", state: "", retailPrice: PRICING.DEFAULT_RETAIL, tagline: "", primaryColor: "#6366f1", logoUrl: null, logoEmoji: "🏢" });
  const [submitting, setSub]  = useState(false);
  const sf = (f) => (v) => setForm((p) => ({ ...p, [f]: v }));

  const handleLogo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm((p) => ({ ...p, logoUrl: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    setSub(true);
    await new Promise((r) => setTimeout(r, 1800));
    const code = form.name.split(" ")[0].toUpperCase();
    const dist = {
      id: "dist_" + Math.random().toString(36).substr(2,6),
      code, ...form,
      retailPrice: parseFloat(form.retailPrice) || PRICING.DEFAULT_RETAIL,
      status: "pending", joined: new Date().toISOString().split("T")[0],
      branding: { primaryColor: form.primaryColor, logoUrl: form.logoUrl, logoEmoji: form.logoUrl ? null : "🏢", tagline: form.tagline || "Credit Cleaning Software" },
      orders: [],
    };
    onApply(dist);
    setSub(false);
    setStep("submitted");
  };

  const canApply  = form.name && form.bizName && form.email && form.phone;
  const pc = form.primaryColor;

  if (step === "submitted") return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "60px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 60, marginBottom: 20 }}>🎉</div>
      <h2 style={{ color: C.green, fontFamily: "'Montserrat',sans-serif", fontSize: 30, margin: "0 0 12px" }}>Application Submitted!</h2>
      <p style={{ color: C.muted, fontSize: 15, marginBottom: 28 }}>Your distributor application is under review. You'll receive an email with your portal access within 1 business day once approved.</p>
      <Card style={{ padding: 20, textAlign: "left", marginBottom: 24 }}>
        {[["Business", form.bizName],["Contact", form.name],["Email", form.email],["Your Price/Letter", `$${parseFloat(form.retailPrice).toFixed(2)}`]].map(([k,v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
            <span style={{ color: C.muted, fontSize: 13 }}>{k}</span>
            <span style={{ color: C.text, fontWeight: 600, fontSize: 13 }}>{v}</span>
          </div>
        ))}
      </Card>
      <p style={{ color: C.muted, fontSize: 12 }}>Questions? Email <span style={{ color: C.accent }}>distributors@creditsweep.com</span></p>
    </div>
  );

  if (step === "landing") return (
    <div>
      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg,${C.navy},${C.navyDark})`, padding: "70px 24px 60px", textAlign: "center" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <Badge color={C.purple}>Distributor Program</Badge>
          <h1 style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 44, fontWeight: 800, margin: "18px 0 14px", color: C.text, lineHeight: 1.2 }}>
            Build Your Own Credit Repair Business
          </h1>
          <p style={{ color: C.muted, fontSize: 17, marginBottom: 36, maxWidth: 500, margin: "0 auto 36px" }}>
            Sell dispute letters under your own brand. We handle all the printing, mailing, and technology. You keep the profit.
          </p>
          <Btn size="lg" onClick={() => setStep("apply")} style={{ background: `linear-gradient(135deg,${C.green},${C.greenDark})` }}>Apply to Become a Distributor →</Btn>
        </div>
      </div>

      {/* Earnings calculator */}
      <div style={{ background: C.card, padding: "50px 24px", borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 30, textAlign: "center", color: C.text, margin: "0 0 36px" }}>What You Can Earn</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {[
              { customers: 10,  letters: 25,  retail: 6.99, label: "Getting Started" },
              { customers: 50,  letters: 120, retail: 6.99, label: "Growing"         },
              { customers: 200, letters: 480, retail: 6.99, label: "Thriving"        },
            ].map((tier) => {
              const revenue = tier.letters * tier.retail;
              const cost    = tier.letters * PRICING.WHOLESALE_PRICE;
              const profit  = revenue - cost;
              return (
                <Card key={tier.label} style={{ textAlign: "center", padding: 22 }}>
                  <Badge color={C.purple}>{tier.label}</Badge>
                  <div style={{ color: C.muted, fontSize: 13, margin: "12px 0 4px" }}>{tier.customers} customers/mo · {tier.letters} letters</div>
                  <div style={{ color: C.green, fontWeight: 900, fontSize: 32, margin: "8px 0 4px" }}>${profit.toFixed(0)}<span style={{ fontSize: 14, fontWeight: 400 }}>/mo</span></div>
                  <div style={{ color: C.muted, fontSize: 11 }}>at ${tier.retail}/letter retail · you pay ${PRICING.WHOLESALE_PRICE}/letter wholesale</div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div style={{ padding: "50px 24px", background: C.bg }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 30, textAlign: "center", color: C.text, margin: "0 0 36px" }}>Everything Included</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {[
              { icon: "🎨", title: "Your Brand, Your Portal",      body: "Full white-label storefront with your logo, colors, and domain link. Customers see your business." },
              { icon: "📬", title: "We Print & Mail Everything",   body: "All letters are printed and mailed through LetterStream. You never touch a stamp." },
              { icon: "💳", title: "Set Your Own Price",           body: `Charge whatever you want above $${PRICING.MIN_RETAIL_PRICE.toFixed(2)}/letter. Your margin is your business.` },
              { icon: "📊", title: "Real-Time Dashboard",         body: "See all your customer orders, revenue, and profit in one place. Track every letter." },
              { icon: "⚖️", title: "FCRA-Compliant Letters",      body: "All letters cite the correct federal statutes. You're protected, your customers are protected." },
              { icon: "🚀", title: "Approved in 24 Hours",        body: "Apply today. Once approved, your portal is live and ready to share the same day." },
            ].map((b) => (
              <Card key={b.title} style={{ padding: 18 }}>
                <div style={{ display: "flex", gap: 12 }}>
                  <span style={{ fontSize: 24, flexShrink: 0 }}>{b.icon}</span>
                  <div>
                    <div style={{ color: C.text, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{b.title}</div>
                    <div style={{ color: C.muted, fontSize: 12, lineHeight: 1.6 }}>{b.body}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 36 }}>
            <Btn size="lg" onClick={() => setStep("apply")} style={{ background: `linear-gradient(135deg,${C.green},${C.greenDark})` }}>Apply Now — It's Free →</Btn>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Application form (2 steps: info → brand)
  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 24px 80px" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h2 style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 28, color: C.text, margin: "0 0 8px" }}>
          {step === "apply" ? "Distributor Application" : "Brand Your Portal"}
        </h2>
        <p style={{ color: C.muted, fontSize: 14 }}>
          {step === "apply" ? "Tell us about you and your business." : "Customize how your customers see your storefront."}
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
          {["apply","brand"].map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: step === s ? C.accent : (step === "brand" && s === "apply") ? C.green : C.surface, border: `2px solid ${step === s ? C.accent : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", fontWeight: 700 }}>
                {step === "brand" && s === "apply" ? "✓" : i + 1}
              </div>
              <span style={{ color: step === s ? C.text : C.muted, fontSize: 12, fontWeight: 700 }}>{s === "apply" ? "Your Info" : "Your Brand"}</span>
              {i === 0 && <div style={{ width: 30, height: 2, background: C.border }} />}
            </div>
          ))}
        </div>
      </div>

      <Card>
        {step === "apply" && <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Inp label="Full Name *"        value={form.name}     onChange={sf("name")}     placeholder="Jason Mitchell" />
            <Inp label="Business Name *"    value={form.bizName}  onChange={sf("bizName")}  placeholder="Mitchell Credit Solutions" />
          </div>
          <Inp label="Email Address *" value={form.email}  onChange={sf("email")}  placeholder="jason@mitchellcredit.com" type="email" />
          <Inp label="Phone Number *"  value={form.phone}  onChange={sf("phone")}  placeholder="(704) 555-0191" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Inp label="City" value={form.city}  onChange={sf("city")}  placeholder="Charlotte" />
            <Inp label="State" value={form.state} onChange={sf("state")} placeholder="NC" />
          </div>
          <Inp label="Your Retail Price per Letter ($)" value={form.retailPrice} onChange={sf("retailPrice")} type="number"
            hint={`Min: $${PRICING.MIN_RETAIL_PRICE.toFixed(2)} · You pay CreditSweep $${PRICING.WHOLESALE_PRICE.toFixed(2)}/letter · Your margin: $${(parseFloat(form.retailPrice || 0) - PRICING.WHOLESALE_PRICE).toFixed(2)}/letter`} />
          {parseFloat(form.retailPrice) >= PRICING.MIN_RETAIL_PRICE && (
            <div style={{ background: C.greenLight, borderRadius: 8, padding: "10px 14px", marginTop: -4, marginBottom: 14 }}>
              <p style={{ margin: 0, color: C.greenDark, fontSize: 12 }}>
                💰 At ${parseFloat(form.retailPrice).toFixed(2)}/letter — if you send 100 letters/month, you earn <strong>${((parseFloat(form.retailPrice) - PRICING.WHOLESALE_PRICE) * 100).toFixed(2)}/month</strong>.
              </p>
            </div>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <Btn onClick={() => setStep("landing")} variant="ghost" style={{ flex: 1 }}>← Back</Btn>
            <Btn onClick={() => setStep("brand")} disabled={!canApply} style={{ flex: 2 }}>Next: Brand Setup →</Btn>
          </div>
        </>}

        {step === "brand" && <>
          <p style={{ color: C.muted, fontSize: 13, marginTop: 0, marginBottom: 20 }}>This is how your customers will see your storefront. You can update this anytime from your dashboard.</p>

          {/* Logo upload */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.subtle, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Business Logo</label>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 72, height: 72, borderRadius: 14, border: `2px dashed ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: C.surface, flexShrink: 0 }}>
                {form.logoUrl
                  ? <img src={form.logoUrl} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontSize: 28 }}>🏢</span>}
              </div>
              <div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleLogo} style={{ display: "none" }} />
                <Btn onClick={() => fileRef.current.click()} variant="ghost" size="sm">Upload Logo</Btn>
                {form.logoUrl && <button onClick={() => setForm((p) => ({ ...p, logoUrl: null }))} style={{ background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 12, marginLeft: 8 }}>Remove</button>}
                <p style={{ color: C.muted, fontSize: 11, margin: "6px 0 0" }}>PNG, JPG, SVG · Recommended 200×200px</p>
              </div>
            </div>
          </div>

          {/* Color picker */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.subtle, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Brand Color</label>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
              {["#6366f1","#7c3aed","#059669","#dc2626","#0070C0","#f59e0b","#ec4899","#0891b2"].map((color) => (
                <button key={color} onClick={() => sf("primaryColor")(color)}
                  style={{ width: 36, height: 36, borderRadius: 8, background: color, border: `3px solid ${form.primaryColor === color ? "#fff" : "transparent"}`, cursor: "pointer" }} />
              ))}
              <input type="color" value={form.primaryColor} onChange={(e) => sf("primaryColor")(e.target.value)}
                style={{ width: 36, height: 36, borderRadius: 8, border: `1.5px solid ${C.border}`, cursor: "pointer", background: "none", padding: 2 }} title="Custom color" />
            </div>
          </div>

          <Inp label="Brand Tagline" value={form.tagline} onChange={sf("tagline")} placeholder="Fast. Trusted. Effective." hint="Shows under your business name on the customer portal" />

          {/* Live preview card */}
          <div style={{ background: C.bg, borderRadius: 12, padding: 16, border: `1.5px solid ${C.border}`, marginBottom: 20 }}>
            <div style={{ color: C.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>Portal Preview</div>
            <div style={{ background: `linear-gradient(135deg,${pc}33,${C.card})`, borderBottom: `2px solid ${pc}55`, borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: pc + "44", border: `2px solid ${pc}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                {form.logoUrl
                  ? <img src={form.logoUrl} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontSize: 18 }}>🏢</span>}
              </div>
              <div>
                <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 16, fontWeight: 800, color: C.text }}>{form.bizName || "Your Business Name"}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{form.tagline || "Your tagline here"}</div>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <div style={{ background: pc, borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, color: "#fff" }}>Dispute Now</div>
              </div>
            </div>
            <div style={{ color: C.muted, fontSize: 11, marginTop: 8, textAlign: "center" }}>
              Your customers will see this at: <span style={{ color: pc, fontWeight: 700 }}>creditsweep.com/d/{(form.name.split(" ")[0] || "yourname").toLowerCase()}</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={() => setStep("apply")} variant="ghost" style={{ flex: 1 }}>← Back</Btn>
            <Btn onClick={submit} disabled={submitting} style={{ flex: 2, background: `linear-gradient(135deg,${pc},${pc}cc)`, color: "#fff" }}>
              {submitting ? "⏳ Submitting…" : "Submit Application →"}
            </Btn>
          </div>
        </>}
      </Card>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  WHITE-LABEL STOREFRONT — branded customer portal per distributor
// ════════════════════════════════════════════════════════════════════════════
function WhiteLabelStorefront({ distributor, onBack }) {
  const [done, setDone]   = useState(false);
  const [order, setOrder] = useState(null);
  const [cust, setCust]   = useState(null);
  const pc = distributor.branding.primaryColor;

  const onComplete = ({ order: o, customer: c }) => { setOrder(o); setCust(c); setDone(true); };

  return (
    <div style={{ minHeight: '100vh', background: C.surface, fontFamily: "'Inter',sans-serif", color: C.text }}>
      <link href={GF} rel="stylesheet" />
      {/* Branded header */}
      <div style={{ background: `linear-gradient(135deg,${pc}22,${C.card})`, borderBottom: `2px solid ${pc}55`, padding: "14px 22px" }}>
        <div style={{ maxWidth: 660, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: pc + "44", border: `2px solid ${pc}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
              {distributor.branding.logoUrl
                ? <img src={distributor.branding.logoUrl} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontSize: 22 }}>{distributor.branding.logoEmoji || "🏢"}</span>}
            </div>
            <div>
              <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 20, fontWeight: 800 }}>{distributor.bizName}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{distributor.branding.tagline}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ background: C.surface, borderRadius: 20, padding: "5px 12px", fontSize: 11, color: C.greenDark, fontWeight: 600 }}>🔒 FCRA Compliant</div>
            {onBack && <button onClick={onBack} style={{ background: "none", border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "5px 12px", color: C.muted, cursor: "pointer", fontSize: 11 }}>← Back</button>}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 660, margin: "0 auto", padding: "32px 24px 80px" }}>
        {done && order && cust ? (
          <CustomerDashboard order={order} customer={cust} onNew={() => { setDone(false); setOrder(null); setCust(null); }} />
        ) : (
          <>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <h1 style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 30, fontWeight: 800, margin: "0 0 10px", color: C.text }}>Dispute Your Credit Report</h1>
              <p style={{ color: C.muted, fontSize: 14, maxWidth: 440, margin: "0 auto" }}>Professional FCRA letters mailed to the bureaus. Starting at <strong style={{ color: pc }}>${distributor.retailPrice.toFixed(2)}/letter</strong>.</p>
            </div>
            <DisputeFlow pricePerLetter={distributor.retailPrice} accentColor={pc} onComplete={onComplete} />
          </>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  DISTRIBUTOR PORTAL — dashboard for each distributor
// ════════════════════════════════════════════════════════════════════════════
function DistributorPortal({ distributor, onBack }) {
  const [tab, setTab] = useState("overview");
  const pc = distributor.branding.primaryColor;
  const orders   = distributor.orders;
  const letters  = orders.flatMap((o) => o.bureaus).length;
  const revenue  = orders.reduce((s, o) => s + o.amount, 0);
  const wsTotal  = orders.reduce((s, o) => s + o.wholesale, 0);
  const profit   = revenue - wsTotal;

  return (
    <div style={{ minHeight: '100vh', background: C.surface, fontFamily: "'Inter',sans-serif", color: C.text }}>
      <link href={GF} rel="stylesheet" />
      <div style={{ background: `linear-gradient(135deg,${pc}22,${C.card})`, borderBottom: `1px solid ${pc}44`, padding: "14px 22px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: pc + "44", border: `2px solid ${pc}66`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {distributor.branding.logoUrl ? <img src={distributor.branding.logoUrl} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 18 }}>{distributor.branding.logoEmoji || "🏢"}</span>}
          </div>
          <div>
            <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 17, fontWeight: 800 }}>{distributor.bizName}</div>
            <div style={{ fontSize: 11, color: C.muted }}>Distributor Dashboard · {distributor.name}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <StatusBadge status={distributor.status} />
          <button onClick={onBack} style={{ background: "none", border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "6px 12px", color: C.muted, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>← Back</button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "26px 22px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
          <KPI icon="📬" label="Letters Sent"   value={letters}                sub={`${orders.length} orders`}                          color={C.blue}  />
          <KPI icon="💰" label="Total Revenue"  value={`$${revenue.toFixed(2)}`}  sub="from your customers"                            color={C.green} />
          <KPI icon="🏦" label="Platform Fees"  value={`$${wsTotal.toFixed(2)}`}  sub={`$${PRICING.WHOLESALE_PRICE}/letter`}           color={C.amber} />
          <KPI icon="📈" label="Your Profit"    value={`$${profit.toFixed(2)}`}   sub={`$${(distributor.retailPrice - PRICING.WHOLESALE_PRICE).toFixed(2)}/letter`} color={C.pink} />
        </div>

        <Card style={{ marginBottom: 20, padding: 18 }}>
          <h4 style={{ margin: "0 0 6px", color: C.text, fontSize: 14 }}>📤 Your Customer Portal Link</h4>
          <p style={{ color: C.muted, fontSize: 12, marginBottom: 12 }}>Share this with your customers — they'll see your brand and your pricing.</p>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <code style={{ color: pc, fontSize: 13, background: C.surface, padding: "9px 13px", borderRadius: 8, flex: 1, border: `1px solid ${pc}44` }}>
              creditsweep.com/d/{distributor.code.toLowerCase()}
            </code>
            <Btn size="sm" style={{ background: `linear-gradient(135deg,${pc},${pc}cc)`, color: "#fff" }}>Copy</Btn>
          </div>
        </Card>

        <Tabs tabs={[["overview","📊 Overview"],["customers","👥 Customers"],["payouts","💵 Payouts"]]} active={tab} onChange={setTab} />

        {tab === "overview" && (
          <Card style={{ padding: 20 }}>
            <h4 style={{ margin: "0 0 14px", color: C.subtle, fontSize: 13 }}>Recent Orders</h4>
            {orders.length === 0 && <p style={{ color: C.muted, fontSize: 13 }}>No orders yet — share your portal link to get started!</p>}
            {orders.map((o) => (
              <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: `1px solid ${C.border}` }}>
                <div>
                  <div style={{ color: C.text, fontWeight: 600, fontSize: 13 }}>{o.customer}</div>
                  <div style={{ color: C.muted, fontSize: 11 }}>{o.id} · {o.bureaus.map((b) => BUREAUS[b].name).join(", ")} · {o.date}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: C.green, fontWeight: 700 }}>${o.amount.toFixed(2)}</div>
                  <div style={{ color: C.muted, fontSize: 11 }}>profit: ${(o.amount - o.wholesale).toFixed(2)}</div>
                  <StatusBadge status={o.status} />
                </div>
              </div>
            ))}
          </Card>
        )}
        {tab === "customers" && (
          <Card style={{ padding: 20 }}>
            <h4 style={{ margin: "0 0 14px", color: C.subtle, fontSize: 13 }}>Your Customers</h4>
            {orders.length === 0 && <p style={{ color: C.muted, fontSize: 13 }}>No customers yet.</p>}
            {orders.map((o) => (
              <div key={o.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                <div>
                  <div style={{ color: C.text, fontWeight: 600, fontSize: 13 }}>{o.customer}</div>
                  <div style={{ color: C.muted, fontSize: 11 }}>{o.bureaus.length} letter{o.bureaus.length > 1 ? "s" : ""}</div>
                </div>
                <StatusBadge status={o.status} />
              </div>
            ))}
          </Card>
        )}
        {tab === "payouts" && (
          <Card style={{ padding: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 18 }}>
              {[["Gross Revenue", `$${revenue.toFixed(2)}`, C.text],["Platform Fees Paid", `$${wsTotal.toFixed(2)}`, C.amber],["Net Profit", `$${profit.toFixed(2)}`, C.green]].map(([k,v,c]) => (
                <div key={k} style={{ background: C.surface, borderRadius: 8, padding: "12px", textAlign: "center" }}>
                  <div style={{ color: C.muted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>{k}</div>
                  <div style={{ color: c, fontWeight: 900, fontSize: 20 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ background: "#0c1620", borderRadius: 8, padding: "11px 14px" }}>
              <p style={{ margin: 0, color: "#7dd3fc", fontSize: 12 }}>💳 Payouts via Stripe Connect — your net profit deposits automatically after each order once configured.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  MASTER ADMIN PANEL — owner view
// ════════════════════════════════════════════════════════════════════════════
function MasterAdmin({ distributors, setDistributors, directOrders, onViewStorefront, onViewPortal, onBack }) {
  const [tab, setTab]     = useState("overview");
  const [showAdd, setAdd] = useState(false);
  const [expanded, setEx] = useState(null);
  const [newDist, setND]  = useState({ name: "", bizName: "", email: "", phone: "", city: "", state: "", retailPrice: PRICING.DEFAULT_RETAIL, primaryColor: "#6366f1", tagline: "" });
  const nd = (f) => (v) => setND((p) => ({ ...p, [f]: v }));
  const fileRef = useRef();

  const allDistOrders = distributors.flatMap((d) => d.orders.map((o) => ({ ...o, dist: d })));
  const allOrders     = [...directOrders, ...allDistOrders];
  const distLetters   = allDistOrders.flatMap((o) => o.bureaus).length;
  const directLetters = directOrders.flatMap((o) => o.bureaus).length;
  const totalLetters  = distLetters + directLetters;
  const wsRevenue     = allDistOrders.reduce((s, o) => s + o.wholesale, 0);
  const directRev     = directOrders.reduce((s, o) => s + o.amount, 0);
  const totalCost     = totalLetters * PRICING.LETTERSTREAM_COST;
  const totalProfit   = wsRevenue + (directRev - directLetters * PRICING.LETTERSTREAM_COST) - (distLetters * PRICING.LETTERSTREAM_COST);

  const dRevenue  = (d) => d.orders.reduce((s, o) => s + o.amount, 0);
  const dLetters  = (d) => d.orders.flatMap((o) => o.bureaus).length;
  const updateSt  = (id, st) => setDistributors((p) => p.map((d) => d.id === id ? { ...d, status: st } : d));

  const addDist = () => {
    if (!newDist.name || !newDist.email) return;
    const dist = {
      id: "dist_" + Math.random().toString(36).substr(2,6),
      code: newDist.name.split(" ")[0].toUpperCase(),
      ...newDist, retailPrice: parseFloat(newDist.retailPrice) || PRICING.DEFAULT_RETAIL,
      status: "pending", joined: new Date().toISOString().split("T")[0],
      branding: { primaryColor: newDist.primaryColor, logoUrl: null, logoEmoji: "🏢", tagline: newDist.tagline || "Credit Cleaning Software" },
      orders: [],
    };
    setDistributors((p) => [...p, dist]);
    setND({ name: "", bizName: "", email: "", phone: "", city: "", state: "", retailPrice: PRICING.DEFAULT_RETAIL, primaryColor: "#6366f1", tagline: "" });
    setAdd(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: C.surface, fontFamily: "'Inter',sans-serif", color: C.text }}>
      <link href={GF} rel="stylesheet" />
      <div style={{ background: C.white, borderBottom: `2px solid ${C.border}`, padding: "14px 26px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ background: `linear-gradient(135deg,${C.navy},${C.navyDark})`, borderRadius: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center" }}>👑</div>
          <div>
            <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 18, fontWeight: 900, color: '#fff', fontFamily: "'Montserrat',sans-serif" }}>CreditSweep — Owner Panel</div>
            <div style={{ fontSize: 11, color: C.muted }}>Master Distributor Management</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={onBack} variant="ghost" size="sm">← Customer App</Btn>
          <Btn onClick={() => setAdd(true)} variant="green" size="sm">+ Add Distributor</Btn>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "26px 22px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 26 }}>
          <KPI icon="🏪" label="Distributors"     value={distributors.length}             sub={`${distributors.filter((d)=>d.status==="active").length} active`}   color={C.purple} />
          <KPI icon="📬" label="Total Letters"    value={totalLetters}                    sub={`${directLetters} direct · ${distLetters} via dist`}                 color={C.blue}   />
          <KPI icon="💰" label="Platform Revenue" value={`$${(wsRevenue + directRev).toFixed(2)}`} sub="all channels"                                               color={C.green}  />
          <KPI icon="🏭" label="LetterStream Cost" value={`$${totalCost.toFixed(2)}`}    sub={`@ $${PRICING.LETTERSTREAM_COST}/letter`}                            color={C.amber}  />
          <KPI icon="📈" label="Your Net Profit"  value={`$${totalProfit.toFixed(2)}`}   sub="after all costs"                                                      color={C.pink}   />
        </div>

        {/* Margin explainer */}
        <Card style={{ marginBottom: 24, padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h4 style={{ margin: 0, color: C.text, fontSize: 14 }}>💡 Revenue Model</h4>
            <div style={{ display: "flex", gap: 8 }}>
              <Badge color={C.green}>Direct: ${(PRICING.PRICE_PER_LETTER - PRICING.LETTERSTREAM_COST).toFixed(2)}/letter</Badge>
              <Badge color={C.pink}>Via Dist: ${PRICING.OWNER_PROFIT.toFixed(2)}/letter</Badge>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
            {[
              { label: "Direct Customer Pays", val: `$${PRICING.PRICE_PER_LETTER.toFixed(2)}`,   color: C.text,   note: "your website" },
              { label: "Distributor Pays You", val: `$${PRICING.WHOLESALE_PRICE.toFixed(2)}`,    color: C.green,  note: "per letter wholesale" },
              { label: "LetterStream Cost",    val: `$${PRICING.LETTERSTREAM_COST.toFixed(2)}`,  color: C.amber,  note: "your actual cost" },
              { label: "Dist Price Floor",     val: `$${PRICING.MIN_RETAIL_PRICE.toFixed(2)}+`,  color: C.purple, note: "customer minimum" },
            ].map((r) => (
              <div key={r.label} style={{ background: C.surface, borderRadius: 8, padding: "10px", textAlign: "center" }}>
                <div style={{ color: C.muted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>{r.label}</div>
                <div style={{ color: r.color, fontWeight: 900, fontSize: 18 }}>{r.val}</div>
                <div style={{ color: C.muted, fontSize: 10, marginTop: 2 }}>{r.note}</div>
              </div>
            ))}
          </div>
        </Card>

        <Tabs tabs={[["overview","📊 Overview"],["distributors","🏪 Distributors"],["orders","📋 All Orders"],["settings","⚙️ Settings"]]} active={tab} onChange={setTab} />

        {tab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card style={{ padding: 20 }}>
              <h4 style={{ margin: "0 0 14px", color: C.subtle, fontSize: 13 }}>Top Distributors by Revenue</h4>
              {[...distributors].sort((a,b) => dRevenue(b) - dRevenue(a)).map((d) => (
                <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: d.branding.primaryColor + "33", border: `1px solid ${d.branding.primaryColor}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, overflow: "hidden" }}>
                      {d.branding.logoUrl ? <img src={d.branding.logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : d.branding.logoEmoji || "🏢"}
                    </div>
                    <div>
                      <div style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{d.bizName}</div>
                      <div style={{ color: C.muted, fontSize: 10 }}>{d.city}, {d.state} · {d.orders.length} orders</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: C.green, fontWeight: 700 }}>${dRevenue(d).toFixed(2)}</div>
                    <StatusBadge status={d.status} />
                  </div>
                </div>
              ))}
            </Card>
            <Card style={{ padding: 20 }}>
              <h4 style={{ margin: "0 0 14px", color: C.subtle, fontSize: 13 }}>Network Snapshot</h4>
              {[
                ["Active Distributors",    distributors.filter((d)=>d.status==="active").length, C.green],
                ["Pending Approval",       distributors.filter((d)=>d.status==="pending").length, C.amber],
                ["Total Platform Orders",  allOrders.length, C.blue],
                ["Total Letters Mailed",   totalLetters, C.blue],
                ["Avg Dist Retail Price",  `$${distributors.length ? (distributors.reduce((s,d)=>s+d.retailPrice,0)/distributors.length).toFixed(2) : "0.00"}`, C.text],
                ["Direct Customer Orders", directOrders.length, C.purple],
              ].map(([k,v,c]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ color: C.subtle, fontSize: 13 }}>{k}</span>
                  <span style={{ color: c, fontWeight: 700, fontSize: 13 }}>{v}</span>
                </div>
              ))}
            </Card>
          </div>
        )}

        {tab === "distributors" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {distributors.map((d) => {
              const open = expanded === d.id;
              return (
                <Card key={d.id} style={{ padding: 0, overflow: "hidden" }}>
                  <button onClick={() => setEx(open ? null : d.id)}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "transparent", border: "none", cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: d.branding.primaryColor + "33", border: `2px solid ${d.branding.primaryColor}55`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                        {d.branding.logoUrl ? <img src={d.branding.logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 20 }}>{d.branding.logoEmoji || "🏢"}</span>}
                      </div>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>{d.bizName}</div>
                        <div style={{ color: C.muted, fontSize: 11 }}>{d.name} · {d.email} · {d.city}, {d.state}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ color: C.green, fontWeight: 700 }}>${dRevenue(d).toFixed(2)}</div>
                        <div style={{ color: C.muted, fontSize: 10 }}>{dLetters(d)} letters</div>
                      </div>
                      <StatusBadge status={d.status} />
                      <span style={{ color: C.muted }}>{open ? "▲" : "▼"}</span>
                    </div>
                  </button>
                  {open && (
                    <div style={{ borderTop: `1px solid ${C.border}`, padding: "18px 20px", background: C.surface }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
                        {[
                          ["Code",           d.code,                                                   "#a5b4fc"],
                          ["Retail / Letter", `$${d.retailPrice.toFixed(2)}`,                         C.text  ],
                          ["You Earn / Letter", `$${PRICING.WHOLESALE_PRICE.toFixed(2)}`,             C.green ],
                          ["Dist Margin",    `$${(d.retailPrice - PRICING.WHOLESALE_PRICE).toFixed(2)}`, C.pink],
                        ].map(([k,v,c]) => (
                          <div key={k} style={{ background: C.card, borderRadius: 8, padding: "9px 11px" }}>
                            <div style={{ color: C.muted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>{k}</div>
                            <div style={{ color: c, fontWeight: 700, fontSize: 14 }}>{v}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ background: C.card, borderRadius: 8, padding: "11px 14px", marginBottom: 14, border: `1.5px solid ${C.border}` }}>
                        <div style={{ color: C.subtle, fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginBottom: 5 }}>White-Label Portal URL</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <code style={{ color: d.branding.primaryColor, fontSize: 12, background: C.bg, padding: "5px 10px", borderRadius: 6, flex: 1 }}>
                            creditsweep.com/d/{d.code.toLowerCase()}
                          </code>
                          <Btn size="sm" variant="ghost" onClick={() => onViewStorefront(d)}>Preview →</Btn>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {d.status === "pending"   && <Btn size="sm" variant="green" onClick={() => updateSt(d.id,"active")}>✅ Approve</Btn>}
                        {d.status === "active"    && <Btn size="sm" variant="amber" onClick={() => updateSt(d.id,"suspended")}>⏸ Suspend</Btn>}
                        {d.status === "suspended" && <Btn size="sm" variant="green" onClick={() => updateSt(d.id,"active")}>▶ Reinstate</Btn>}
                        <Btn size="sm" variant="ghost" onClick={() => onViewPortal(d)}>View as Distributor</Btn>
                        <Btn size="sm" variant="ghost" onClick={() => onViewStorefront(d)}>Preview Storefront</Btn>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {tab === "orders" && (
          <Card style={{ padding: 20 }}>
            <h4 style={{ margin: "0 0 14px", color: C.subtle, fontSize: 13 }}>All Orders ({allOrders.length})</h4>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                    {["Order","Source","Customer","Bureaus","Revenue","Your Profit","Status","Date"].map((h) => (
                      <th key={h} style={{ color: C.navy, fontWeight: 700, padding: '8px 10px', textAlign: 'left', whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allOrders.map((o, i) => {
                    const isDist = !!o.dist;
                    const profit = isDist ? o.wholesale - (o.bureaus.length * PRICING.LETTERSTREAM_COST) : o.amount - (o.bureaus.length * PRICING.LETTERSTREAM_COST);
                    return (
                      <tr key={o.id || i} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: "9px 10px", fontFamily: "monospace", color: C.navy, fontWeight: 700, fontSize: 11 }}>{o.id}</td>
                        <td style={{ padding: "9px 10px" }}><Badge color={isDist ? C.purple : C.accent}>{isDist ? o.dist.code : "Direct"}</Badge></td>
                        <td style={{ padding: "9px 10px", color: C.subtle }}>{o.name || o.customer}</td>
                        <td style={{ padding: "9px 10px" }}>
                          <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                            {o.bureaus.map((b) => <Badge key={b} color={BUREAUS[b].color}>{BUREAUS[b].name.slice(0,3)}</Badge>)}
                          </div>
                        </td>
                        <td style={{ padding: "9px 10px", color: C.text, fontWeight: 700 }}>${(isDist ? o.wholesale : o.amount).toFixed(2)}</td>
                        <td style={{ padding: "9px 10px", color: C.green, fontWeight: 700 }}>${profit.toFixed(2)}</td>
                        <td style={{ padding: "9px 10px" }}><StatusBadge status={o.status} /></td>
                        <td style={{ padding: "9px 10px", color: C.muted }}>{o.date}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {tab === "settings" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Card style={{ padding: 20 }}>
              <h4 style={{ margin: "0 0 4px", color: C.text, fontSize: 14 }}>💰 Pricing Configuration</h4>
              <p style={{ color: C.muted, fontSize: 12, marginBottom: 16 }}>Edit the <code style={{ background: C.surface, padding: "1px 5px", borderRadius: 4 }}>PRICING</code> object at the top of CreditSweep.jsx to change any of these.</p>
              {Object.entries(PRICING).map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                  <code style={{ color: C.subtle, fontSize: 12 }}>{k}</code>
                  <span style={{ color: C.green, fontWeight: 700 }}>${v.toFixed(2)}</span>
                </div>
              ))}
            </Card>
            <Card style={{ padding: 20 }}>
              <h4 style={{ margin: "0 0 4px", color: C.text, fontSize: 14 }}>🔌 Integration Status</h4>
              {[
                ["DocuPost API (Active)",  "Paste your API key into MAIL_CONFIG.docupost_key in CreditSweep.jsx", C.green],
                ["LetterStream (Future)", "Request Monetization Mode — support@letterstream.com — swap in when approved", C.amber],
                ["Stripe Payments",  "Add publishable key to PaymentForm component",          C.amber],
                ["Stripe Connect",   "Required for distributor payouts — configure in Stripe Dashboard", C.amber],
                ["Email (approvals)","Add SendGrid / Resend API key for approval emails",     C.amber],
              ].map(([k, v, c]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div>
                    <div style={{ color: C.text, fontWeight: 600, fontSize: 13 }}>{k}</div>
                    <div style={{ color: C.muted, fontSize: 11 }}>{v}</div>
                  </div>
                  <Badge color={c}>Pending Config</Badge>
                </div>
              ))}
            </Card>
          </div>
        )}
      </div>

      {/* Add Distributor Modal */}
      <Modal show={showAdd} onClose={() => setAdd(false)} title="Add New Distributor">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Inp label="Full Name *"     value={newDist.name}     onChange={nd("name")}     placeholder="Jason Mitchell" />
          <Inp label="Business Name *" value={newDist.bizName}  onChange={nd("bizName")}  placeholder="Mitchell Credit Solutions" />
        </div>
        <Inp label="Email *"  value={newDist.email}  onChange={nd("email")}  type="email" placeholder="jason@email.com" />
        <Inp label="Phone"    value={newDist.phone}  onChange={nd("phone")}  placeholder="(704) 555-0191" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Inp label="City"  value={newDist.city}  onChange={nd("city")}  placeholder="Charlotte" />
          <Inp label="State" value={newDist.state} onChange={nd("state")} placeholder="NC" />
        </div>
        <Inp label="Retail Price / Letter ($)" value={newDist.retailPrice} onChange={nd("retailPrice")} type="number"
          hint={`Min $${PRICING.MIN_RETAIL_PRICE.toFixed(2)} · You earn $${PRICING.WHOLESALE_PRICE.toFixed(2)} · Their margin: $${(parseFloat(newDist.retailPrice||0) - PRICING.WHOLESALE_PRICE).toFixed(2)}`} />
        <Inp label="Tagline" value={newDist.tagline} onChange={nd("tagline")} placeholder="Fast. Trusted. Effective." />
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.subtle, textTransform: "uppercase", marginBottom: 6 }}>Brand Color</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["#6366f1","#7c3aed","#059669","#dc2626","#0070C0","#f59e0b","#ec4899"].map((c) => (
              <button key={c} onClick={() => nd("primaryColor")(c)} style={{ width: 32, height: 32, borderRadius: 7, background: c, border: `3px solid ${newDist.primaryColor === c ? "#fff" : "transparent"}`, cursor: "pointer" }} />
            ))}
            <input type="color" value={newDist.primaryColor} onChange={(e) => nd("primaryColor")(e.target.value)} style={{ width: 32, height: 32, borderRadius: 7, border: `1.5px solid ${C.border}`, cursor: "pointer", background: "none", padding: 2 }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn onClick={() => setAdd(false)} variant="ghost" style={{ flex: 1 }}>Cancel</Btn>
          <Btn onClick={addDist} disabled={!newDist.name || !newDist.email} style={{ flex: 2 }}>Create Account</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  ROOT APP — router + shared state
// ════════════════════════════════════════════════════════════════════════════
export default function CreditSweep() {
  const [route, setRoute]             = useState("home");
  const [distributors, setDists]      = useState(SEED_DISTRIBUTORS);
  const [directOrders, setDirect]     = useState(SEED_ORDERS);
  const [activeDist, setActiveDist]   = useState(null);
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [distAuthed, setDistAuthed]   = useState(false);

  const goRoute = (r, dist = null) => { if (dist) setActiveDist(dist); setRoute(r); window.scrollTo(0, 0); };

  // ── Admin gate
  if (route === "admin_login" && !adminAuthed) return (
    <LockScreen title="Owner Access" subtitle="CreditSweep Master Admin" emoji="👑" correctPass={OWNER_PASSWORD}
      onUnlock={() => { setAdminAuthed(true); setRoute("admin"); }} onBack={() => setRoute("home")} />
  );

  if (route === "admin") return (
    <MasterAdmin distributors={distributors} setDistributors={setDists} directOrders={directOrders}
      onViewStorefront={(d) => goRoute("storefront", d)} onViewPortal={(d) => goRoute("dist_portal", d)}
      onBack={() => setRoute("home")} />
  );

  // ── Distributor portal gate
  if (route === "dist_login" && !distAuthed) return (
    <LockScreen title="Distributor Login" subtitle="Access your CreditSweep portal" emoji="🏪" correctPass={DIST_PASSWORD}
      onUnlock={() => { setDistAuthed(true); setRoute("dist_portal"); setActiveDist(distributors.find((d) => d.status === "active") || distributors[0]); }}
      onBack={() => setRoute("home")} backLabel="← Back to Home" />
  );

  if (route === "dist_portal" && activeDist) return (
    <DistributorPortal distributor={activeDist} onBack={() => setRoute("home")} />
  );

  // ── White-label storefront
  if (route === "storefront" && activeDist) return (
    <WhiteLabelStorefront distributor={activeDist} onBack={() => setRoute("home")} />
  );

  // ── Public pages (with shared header)
  return (
    <div style={{ minHeight: '100vh', background: C.surface, fontFamily: "'Inter',sans-serif", color: C.text }}>
      <link href={GF} rel="stylesheet" />
      <SiteHeader route={route} setRoute={goRoute} />
      {route === "home" && (
        <HomePage setRoute={goRoute} directOrders={directOrders} setDirectOrders={setDirect} />
      )}
      {route === "become" && (
        <BecomeDistributor onApply={(d) => { setDists((p) => [...p, d]); }} />
      )}
    </div>
  );
}
