import { useState } from "react";

// ─── Shared tokens ────────────────────────────────────────────────────────────
const FONTS = `https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=DM+Sans:wght@400;500;700&display=swap`;

// ════════════════════════════════════════════════════════════════════════════
//  DISTRIBUTOR / PARTNER FLOWCHART
// ════════════════════════════════════════════════════════════════════════════
function DistributorChart() {
  const [hovered, setHovered] = useState(null);

  const steps = [
    {
      id: "apply", phase: "ONBOARDING", icon: "📋",
      title: "Apply Online",
      desc: "Submit your application at creditsweep.com/become-distributor. Takes 5 minutes.",
      color: "#7c3aed", bg: "#1e1b4b",
      details: ["Name, business info, contact details", "Set your own retail price per letter", "Upload your logo & pick brand colors", "Preview your storefront live before submitting"],
    },
    {
      id: "approve", phase: "ONBOARDING", icon: "✅",
      title: "Get Approved",
      desc: "We review your application and activate your account within 1 business day.",
      color: "#059669", bg: "#022c22",
      details: ["Email confirmation with login credentials", "Your unique portal link goes live", "Access to your distributor dashboard", "Pricing & payout details confirmed"],
    },
    {
      id: "brand", phase: "SETUP", icon: "🎨",
      title: "Brand Your Portal",
      desc: "Your white-label storefront is live at creditsweep.com/d/yourname — your logo, your colors.",
      color: "#0284c7", bg: "#0c1a2e",
      details: ["Custom logo displayed on storefront", "Your brand colors throughout the UI", "Your tagline and business name", "Zero CreditSweep branding visible to customers"],
    },
    {
      id: "share", phase: "SALES", icon: "📤",
      title: "Share Your Link",
      desc: "Send your portal link to clients, post on social media, embed in your website.",
      color: "#d97706", bg: "#1c1400",
      details: ["Unique URL: creditsweep.com/d/yourcode", "Works on any device — mobile & desktop", "Customers see only your brand", "No technical setup required"],
    },
    {
      id: "customer", phase: "SALES", icon: "👥",
      title: "Customer Disputes",
      desc: "Customers fill out the 6-step form on your branded portal and pay your retail price.",
      color: "#ec4899", bg: "#1f0a18",
      details: ["Customer enters personal info securely", "Selects account & dispute reason", "Chooses which bureaus (1, 2, or all 3)", "Pays via Stripe — funds go to you"],
    },
    {
      id: "process", phase: "FULFILLMENT", icon: "⚙️",
      title: "We Handle Everything",
      desc: "CreditSweep generates the FCRA letter and sends it to LetterStream for printing & mailing.",
      color: "#6366f1", bg: "#1e1b4b",
      details: ["Letter auto-generated with correct legal language", "Addressed to correct bureau PO Box", "Printed & dispatched via USPS First-Class", "Same-day dispatch in most cases"],
    },
    {
      id: "payout", phase: "FULFILLMENT", icon: "💰",
      title: "You Get Paid",
      desc: "You collect retail price from customer. You pay CreditSweep $2.99/letter. Keep the rest.",
      color: "#22c55e", bg: "#0d2818",
      details: ["Customer pays you your retail price", "CreditSweep charges you $2.99/letter wholesale", "Your margin = retail − $2.99", "Payouts via Stripe Connect (automated)"],
    },
    {
      id: "track", phase: "MANAGEMENT", icon: "📊",
      title: "Track & Grow",
      desc: "Your dashboard shows all orders, revenue, profit, and customer activity in real time.",
      color: "#38bdf8", bg: "#0c1a2e",
      details: ["Real-time order & revenue dashboard", "See every customer & letter status", "Monitor your monthly profit margin", "Scale by referring more customers"],
    },
  ];

  const phases = ["ONBOARDING", "SETUP", "SALES", "FULFILLMENT", "MANAGEMENT"];
  const phaseColors = { ONBOARDING: "#7c3aed", SETUP: "#0284c7", SALES: "#d97706", FULFILLMENT: "#6366f1", MANAGEMENT: "#38bdf8" };

  return (
    <div style={{ background: "#030712", minHeight: "100vh", padding: "48px 24px 80px", fontFamily: "'DM Sans', sans-serif" }}>
      <link href={FONTS} rel="stylesheet" />

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 52 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#7c3aed22", border: "1px solid #7c3aed44", borderRadius: 20, padding: "6px 18px", marginBottom: 18 }}>
          <span style={{ color: "#a78bfa", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Distributor & Partner Program</span>
        </div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 52, fontWeight: 700, color: "#f1f5f9", margin: "0 0 14px", lineHeight: 1.1 }}>
          How the Distributor<br />Program Works
        </h1>
        <p style={{ color: "#64748b", fontSize: 16, maxWidth: 520, margin: "0 auto" }}>
          From application to automated payouts — everything you need to run a credit dispute business under your own brand.
        </p>
      </div>

      {/* Phase legend */}
      <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap", marginBottom: 44 }}>
        {phases.map((p) => (
          <div key={p} style={{ display: "flex", alignItems: "center", gap: 6, background: phaseColors[p] + "18", border: `1px solid ${phaseColors[p]}44`, borderRadius: 20, padding: "5px 14px" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: phaseColors[p] }} />
            <span style={{ color: phaseColors[p], fontSize: 11, fontWeight: 700, letterSpacing: "0.08em" }}>{p}</span>
          </div>
        ))}
      </div>

      {/* Flow steps */}
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {steps.map((step, i) => {
          const isHovered = hovered === step.id;
          const isLast    = i === steps.length - 1;
          return (
            <div key={step.id}>
              <div onMouseEnter={() => setHovered(step.id)} onMouseLeave={() => setHovered(null)}
                style={{ display: "flex", gap: 20, cursor: "pointer", transition: "transform 0.2s", transform: isHovered ? "translateX(6px)" : "none" }}>

                {/* Left: number + connector */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: isHovered ? step.color : step.bg, border: `2px solid ${step.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, transition: "background 0.3s", boxShadow: isHovered ? `0 0 24px ${step.color}66` : "none" }}>
                    {step.icon}
                  </div>
                  {!isLast && <div style={{ width: 2, flex: 1, minHeight: 32, background: `linear-gradient(to bottom,${step.color}88,${steps[i+1]?.color}44)`, margin: "6px 0" }} />}
                </div>

                {/* Right: content */}
                <div style={{ flex: 1, paddingBottom: isLast ? 0 : 28 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <span style={{ background: phaseColors[step.phase] + "22", color: phaseColors[step.phase], border: `1px solid ${phaseColors[step.phase]}44`, borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em" }}>{step.phase}</span>
                    <span style={{ color: "#334155", fontSize: 12, fontWeight: 700 }}>STEP {i + 1}</span>
                  </div>
                  <h3 style={{ color: isHovered ? step.color : "#f1f5f9", fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontWeight: 700, margin: "0 0 6px", transition: "color 0.2s" }}>{step.title}</h3>
                  <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 12px", lineHeight: 1.6 }}>{step.desc}</p>

                  {/* Detail bullets */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, maxWidth: 600, opacity: isHovered ? 1 : 0.5, transition: "opacity 0.3s" }}>
                    {step.details.map((d, di) => (
                      <div key={di} style={{ display: "flex", alignItems: "flex-start", gap: 8, background: step.bg, border: `1px solid ${step.color}33`, borderRadius: 8, padding: "8px 12px" }}>
                        <span style={{ color: step.color, fontSize: 12, marginTop: 1, flexShrink: 0 }}>→</span>
                        <span style={{ color: "#94a3b8", fontSize: 12, lineHeight: 1.5 }}>{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Money flow summary */}
      <div style={{ maxWidth: 900, margin: "48px auto 0", background: "linear-gradient(135deg,#1e1b4b,#0f172a)", border: "1px solid #4338ca44", borderRadius: 20, padding: "28px 32px" }}>
        <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, color: "#f1f5f9", margin: "0 0 20px", textAlign: "center" }}>Money Flow Per Letter</h3>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, flexWrap: "wrap" }}>
          {[
            { label: "Customer Pays You", amount: "Your Price", note: "e.g. $6.99", color: "#f1f5f9", bg: "#1e293b" },
            { arrow: true },
            { label: "You Pay CreditSweep", amount: "$2.99", note: "wholesale rate", color: "#22c55e", bg: "#0d2818" },
            { arrow: true },
            { label: "CreditSweep Pays LS", amount: "$1.18", note: "LetterStream cost", color: "#f59e0b", bg: "#1c1400" },
            { arrow: true },
            { label: "Your Profit/Letter", amount: "~$4.00", note: "at $6.99 retail", color: "#f472b6", bg: "#1f0a18" },
          ].map((item, i) =>
            item.arrow ? (
              <div key={i} style={{ color: "#334155", fontSize: 22, margin: "0 8px" }}>→</div>
            ) : (
              <div key={i} style={{ background: item.bg, borderRadius: 12, padding: "16px 20px", textAlign: "center", minWidth: 130, border: `1px solid ${item.color}33` }}>
                <div style={{ color: "#64748b", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{item.label}</div>
                <div style={{ color: item.color, fontWeight: 900, fontSize: 22 }}>{item.amount}</div>
                <div style={{ color: "#475569", fontSize: 10, marginTop: 4 }}>{item.note}</div>
              </div>
            )
          )}
        </div>
      </div>

      {/* CTA */}
      <div style={{ textAlign: "center", marginTop: 48 }}>
        <div style={{ color: "#64748b", fontSize: 13, marginBottom: 12 }}>Ready to start your credit dispute business?</div>
        <div style={{ display: "inline-block", background: "linear-gradient(135deg,#7c3aed,#6d28d9)", borderRadius: 12, padding: "14px 36px", color: "#fff", fontWeight: 800, fontSize: 16 }}>
          Apply at creditsweep.com/become-distributor
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  CUSTOMER FLOWCHART
// ════════════════════════════════════════════════════════════════════════════
function CustomerChart() {
  const [active, setActive] = useState(null);

  const steps = [
    {
      id: "visit", num: "01", icon: "🌐",
      title: "Visit CreditSweep",
      short: "Go to creditsweep.com or your distributor's link",
      color: "#6366f1",
      what: "Land on the dispute form — no account needed, no signup required.",
      why: "Fast and private. You're disputing your own credit — we make it simple.",
      time: "0 min",
    },
    {
      id: "info", num: "02", icon: "📝",
      title: "Enter Your Info",
      short: "Name, address, last 4 of SSN",
      color: "#0284c7",
      what: "Fill in your full legal name, mailing address, and last 4 digits of your SSN. This is printed on your letter.",
      why: "Credit bureaus require your identity to process a dispute. Your info stays private — never sold or shared.",
      time: "2 min",
    },
    {
      id: "account", num: "03", icon: "🏦",
      title: "Identify the Account",
      short: "Tell us which account you're disputing",
      color: "#0891b2",
      what: "Enter the creditor name and a description of the account — balance, type, why you believe it's wrong.",
      why: "The more specific you are, the stronger your dispute letter. Bureaus can't easily dismiss a detailed dispute.",
      time: "2 min",
    },
    {
      id: "reason", num: "04", icon: "⚖️",
      title: "Choose Your Dispute Reason",
      short: "Fraud, inaccurate, not mine, settled, and more",
      color: "#7c3aed",
      what: "Select from 8 dispute reasons — fraud, inaccurate info, account not mine, settled debt, incorrect balance, and more.",
      why: "Each reason triggers specific FCRA legal language in your letter. We cite the exact federal statute that applies.",
      time: "30 sec",
    },
    {
      id: "bureaus", num: "05", icon: "🎯",
      title: "Pick Your Bureaus",
      short: "Experian, Equifax, TransUnion — or all 3",
      color: "#d97706",
      what: "Choose which credit bureaus to send your dispute to. Each is a separate letter mailed to its official PO Box.",
      why: "An error may appear on one bureau's report but not others. Sending to all 3 gives maximum coverage.",
      time: "20 sec",
    },
    {
      id: "pay", num: "06", icon: "💳",
      title: "Pay Securely",
      short: "Starting at $4.99 per letter via Stripe",
      color: "#059669",
      what: "Pay by credit or debit card. Stripe handles all payment processing — your card info is never stored.",
      why: "Your fee covers letter generation, printing, postage, and USPS First-Class delivery. No hidden fees.",
      time: "1 min",
    },
    {
      id: "generate", num: "07", icon: "📄",
      title: "Letter Generated",
      short: "FCRA-compliant dispute letter created instantly",
      color: "#6366f1",
      what: "CreditSweep generates a professional dispute letter citing the correct FCRA federal statutes for your specific situation.",
      why: "Handwritten or poorly-worded disputes get dismissed. Our letters are formatted the way bureaus are required to respond to.",
      time: "Instant",
    },
    {
      id: "mail", num: "08", icon: "📬",
      title: "Letter Printed & Mailed",
      short: "LetterStream prints and dispatches via USPS",
      color: "#ec4899",
      what: "Your letter is sent to LetterStream, printed on real paper, and mailed via USPS First-Class to the bureau's official address.",
      why: "Physical mail is legally required for credit disputes. Emails and online forms don't carry the same FCRA weight.",
      time: "Same day",
    },
    {
      id: "wait", num: "09", icon: "⏳",
      title: "Bureau Investigates",
      short: "Credit bureau has 30 days by law to respond",
      color: "#f59e0b",
      what: "Under the FCRA, once a bureau receives your dispute they must investigate and respond within 30 days.",
      why: "If they can't verify the disputed information, they are legally required to remove or correct it from your report.",
      time: "Up to 30 days",
    },
    {
      id: "result", num: "10", icon: "🏆",
      title: "Receive Response",
      short: "Bureau mails you the investigation results",
      color: "#22c55e",
      what: "The bureau mails their investigation results to your address. If the dispute is successful, the item is updated or removed.",
      why: "You have the right to add a 100-word statement to your file if the dispute is denied. You can also escalate to the CFPB.",
      time: "30-35 days",
    },
  ];

  return (
    <div style={{ background: "#020817", minHeight: "100vh", padding: "48px 24px 80px", fontFamily: "'DM Sans', sans-serif" }}>
      <link href={FONTS} rel="stylesheet" />

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 52 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#22c55e18", border: "1px solid #22c55e44", borderRadius: 20, padding: "6px 18px", marginBottom: 18 }}>
          <span style={{ color: "#86efac", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Customer Journey</span>
        </div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 52, fontWeight: 700, color: "#f1f5f9", margin: "0 0 14px", lineHeight: 1.1 }}>
          How to Dispute Your<br />Credit Report
        </h1>
        <p style={{ color: "#64748b", fontSize: 16, maxWidth: 500, margin: "0 auto" }}>
          10 simple steps from visiting the site to getting inaccurate items removed from your credit report.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 20 }}>
          {[["⏱️","~6 min to complete"], ["📬","Same-day mailing"], ["⚖️","FCRA protected"]].map(([icon, label]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, color: "#64748b", fontSize: 13 }}>
              <span>{icon}</span><span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Steps grid */}
      <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {steps.map((step) => {
          const isActive = active === step.id;
          return (
            <div key={step.id} onClick={() => setActive(isActive ? null : step.id)}
              style={{ background: isActive ? step.color + "18" : "#0f172a", border: `1.5px solid ${isActive ? step.color : "#1e293b"}`, borderRadius: 14, padding: "18px 20px", cursor: "pointer", transition: "all 0.25s", transform: isActive ? "scale(1.01)" : "scale(1)" }}>

              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                {/* Step number + icon */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, background: isActive ? step.color : step.color + "22", border: `2px solid ${step.color}${isActive ? "ff" : "66"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, transition: "all 0.25s", boxShadow: isActive ? `0 0 20px ${step.color}55` : "none" }}>
                    {step.icon}
                  </div>
                  <span style={{ color: step.color, fontSize: 10, fontWeight: 800, letterSpacing: "0.06em" }}>{step.num}</span>
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <h3 style={{ color: isActive ? step.color : "#e2e8f0", fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 700, margin: 0, transition: "color 0.2s" }}>{step.title}</h3>
                    <span style={{ background: step.color + "22", color: step.color, border: `1px solid ${step.color}44`, borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 700, marginLeft: 8, flexShrink: 0 }}>{step.time}</span>
                  </div>
                  <p style={{ color: "#64748b", fontSize: 13, margin: "0 0 10px", lineHeight: 1.5 }}>{step.short}</p>

                  {/* Expanded detail */}
                  {isActive && (
                    <div style={{ marginTop: 12, borderTop: `1px solid ${step.color}33`, paddingTop: 12 }}>
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ color: step.color, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>What happens</div>
                        <p style={{ color: "#94a3b8", fontSize: 13, margin: 0, lineHeight: 1.6 }}>{step.what}</p>
                      </div>
                      <div>
                        <div style={{ color: step.color, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Why it matters</div>
                        <p style={{ color: "#94a3b8", fontSize: 13, margin: 0, lineHeight: 1.6 }}>{step.why}</p>
                      </div>
                    </div>
                  )}
                  {!isActive && <div style={{ color: "#334155", fontSize: 11 }}>Tap to learn more →</div>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Timeline summary */}
      <div style={{ maxWidth: 1000, margin: "48px auto 0" }}>
        <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, color: "#f1f5f9", textAlign: "center", margin: "0 0 24px" }}>Full Timeline at a Glance</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          {[
            { label: "You Fill Form", duration: "~6 min", color: "#6366f1" },
            { label: "We Generate Letter", duration: "Instant", color: "#7c3aed" },
            { label: "LetterStream Mails", duration: "Same Day", color: "#ec4899" },
            { label: "Bureau Receives", duration: "+3-5 days", color: "#d97706" },
            { label: "Investigation", duration: "Up to 30 days", color: "#f59e0b" },
            { label: "You Get Results", duration: "30-35 days", color: "#22c55e" },
          ].map((item, i, arr) => (
            <div key={item.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                <div style={{ flex: 1, height: 3, background: i === 0 ? "transparent" : arr[i-1]?.color + "66" }} />
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: item.color, flexShrink: 0, boxShadow: `0 0 10px ${item.color}88` }} />
                <div style={{ flex: 1, height: 3, background: i === arr.length - 1 ? "transparent" : item.color + "66" }} />
              </div>
              <div style={{ textAlign: "center", marginTop: 10 }}>
                <div style={{ color: "#f1f5f9", fontSize: 12, fontWeight: 700, marginBottom: 3 }}>{item.label}</div>
                <div style={{ color: item.color, fontSize: 11, fontWeight: 700 }}>{item.duration}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rights callout */}
      <div style={{ maxWidth: 1000, margin: "40px auto 0", background: "linear-gradient(135deg,#022c22,#020817)", border: "1px solid #22c55e33", borderRadius: 16, padding: "22px 28px" }}>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <span style={{ fontSize: 28, flexShrink: 0 }}>⚖️</span>
          <div>
            <h4 style={{ color: "#86efac", fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>Your Rights Under the FCRA</h4>
            <p style={{ color: "#64748b", fontSize: 13, margin: 0, lineHeight: 1.7 }}>
              The Fair Credit Reporting Act (15 U.S.C. § 1681) gives you the right to dispute any inaccurate, incomplete, or unverifiable information on your credit report. Credit bureaus have <strong style={{ color: "#86efac" }}>30 days</strong> to investigate and respond. If they cannot verify the disputed information, they are <strong style={{ color: "#86efac" }}>legally required</strong> to remove or correct it. CreditSweep letters cite the specific federal statutes that enforce these rights.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ textAlign: "center", marginTop: 48 }}>
        <div style={{ color: "#64748b", fontSize: 13, marginBottom: 12 }}>Ready to clean up your credit report?</div>
        <div style={{ display: "inline-block", background: "linear-gradient(135deg,#6366f1,#4f46e5)", borderRadius: 12, padding: "14px 36px", color: "#fff", fontWeight: 800, fontSize: 16 }}>
          Start your dispute at creditsweep.com
        </div>
        <div style={{ color: "#334155", fontSize: 12, marginTop: 10 }}>Starting at $4.99 per letter · FCRA Compliant · USPS First-Class Mail</div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  ROOT — toggle between the two charts
// ════════════════════════════════════════════════════════════════════════════
export default function CreditSweepFlowcharts() {
  const [view, setView] = useState("customer");

  return (
    <div>
      <link href={FONTS} rel="stylesheet" />
      {/* Toggle bar */}
      <div style={{ background: "#0f172a", borderBottom: "1px solid #1e293b", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🧹</div>
          <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 700, color: "#f1f5f9" }}>CreditSweep</span>
          <span style={{ color: "#334155", fontSize: 13 }}>· Flowcharts</span>
        </div>
        <div style={{ display: "flex", gap: 4, background: "#1e293b", borderRadius: 10, padding: 4 }}>
          {[["customer","👥 Customer Journey"], ["distributor","🏪 Distributor Program"]].map(([id, label]) => (
            <button key={id} onClick={() => setView(id)}
              style={{ border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: view === id ? "#334155" : "transparent", color: view === id ? "#f1f5f9" : "#64748b", transition: "all 0.2s" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === "customer"     && <CustomerChart />}
      {view === "distributor"  && <DistributorChart />}
    </div>
  );
}
