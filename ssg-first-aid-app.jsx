import { useState, useEffect, useCallback } from "react";

/* ─── PALETTE ─── */
const C = {
  navy:  "#0D1B2A",
  red:   "#C8102E",
  gold:  "#E8A020",
  slate: "#3A4A5C",
  ash:   "#8B9DB0",
  fog:   "#F0F3F6",
  line:  "#D1D9E0",
  white: "#FFFFFF",
  green: "#1A7A40",
  amber: "#C07800",
};

/* ─── STORAGE KEYS ─── */
const SUBMISSIONS_KEY = "ssg_fa_submissions";
const VIEW_KEY        = "ssg_fa_view";   // "form" | "admin"
const ADMIN_PIN       = "ssg2025";       // change as needed

/* ─── INITIAL FORM STATE ─── */
const blank = () => ({
  ref: "",
  priority: "",
  // S1
  date: "", time: "", reportedAt: "", site: "", location: "", w3w: "", conditions: "",
  // S2
  casualtyName: "", dob: "", gender: "", casualtyType: "", contact: "", nextOfKin: "",
  medicalHistory: "", consent: "",
  // S3
  injuryTypes: [], bodyLocation: "",
  // S4
  description: "", casualtyAccount: "",
  // S5
  treatments: [
    { time: "", treatment: "", givenBy: "", qualification: "" },
    { time: "", treatment: "", givenBy: "", qualification: "" },
    { time: "", treatment: "", givenBy: "", qualification: "" },
    { time: "", treatment: "", givenBy: "", qualification: "" },
  ],
  aedUsed: "", aedSerial: "", kitRef: "",
  // S6
  outcome: "", called999At: "", ambulanceAt: "", hospital: "", riddor: "",
  // S7
  wit1Name: "", wit1Role: "", wit1Contact: "",
  wit2Name: "", wit2Role: "", wit2Contact: "",
  // S8
  factors: [], corrective: "", followUp: "",
  // S9
  faName: "", faSiaNo: "", faDate: "",
  casualtySignDate: "", casualtyUnableReason: "",
  supervisorName: "", supervisorRole: "", supervisorDate: "",
  // MGR
  mgrName: "", mgrDate: "", hseReported: "", mgrNotes: "", caseRef: "",
  // meta
  submittedAt: "",
  status: "submitted",
});

/* ─── HELPERS ─── */
const genRef = () => {
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `SSG-FA-${n}`;
};

const priorityMeta = {
  minor:    { label: "Minor",           color: C.green, desc: "First aid only, no referral" },
  moderate: { label: "Moderate",        color: C.amber, desc: "Referred to hospital / GP" },
  serious:  { label: "Serious / RIDDOR",color: C.red,   desc: "999 called / reportable injury" },
};

const INJURY_TYPES = [
  "Laceration / Cut","Bruising / Contusion","Fracture / Suspected fracture",
  "Sprain / Strain","Burn / Scald","Head injury","Loss of consciousness",
  "Cardiac / Breathing","Allergic reaction","Diabetic episode",
  "Seizure / Epilepsy","Shock","Eye injury","Dental injury",
  "Aggression / Assault","Other",
];

const FACTORS = [
  "Wet / slippery surface","Poor lighting","Crowd / overcrowding",
  "Substance intoxication","Pre-existing medical condition","Environmental / weather",
  "Assault / aggression","Inadequate signage","Equipment failure",
  "Human error","Unknown",
];

const OUTCOMES = [
  "Treated on site, no referral","Advised to see GP",
  "Taken to A&E by self/family","Ambulance called (999)",
  "Ambulance attended, not conveyed","Conveyed to hospital by ambulance",
  "Declined treatment",
];

/* ════════════════════════════════════════════════════
   ATOMS
════════════════════════════════════════════════════ */

const styles = {
  page: {
    minHeight: "100vh",
    background: "#CBD5DF",
    fontFamily: "'Barlow', 'Segoe UI', sans-serif",
    padding: "0 0 40px",
  },
  /* header */
  hdrWrap: {
    background: C.navy,
    display: "flex",
    alignItems: "stretch",
    gap: 0,
  },
  hdrAccent: { width: 8, background: C.red, flexShrink: 0 },
  hdrText: { padding: "18px 20px", flex: 1 },
  hdrOrg: { fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: C.ash, marginBottom: 3, fontWeight: 600 },
  hdrTitle: { fontSize: 28, fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: C.white, lineHeight: 1 },
  hdrTitleSpan: { color: C.red },
  hdrSub: { fontSize: 11, color: C.ash, marginTop: 4, fontWeight: 300, letterSpacing: "0.04em" },
  hdrRight: { padding: "18px 22px", borderLeft: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: 4 },
  refLabel: { fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: C.ash },
  refBox: {
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)",
    padding: "5px 10px", width: 140, fontFamily: "inherit", fontSize: 14,
    fontWeight: 600, color: C.white, letterSpacing: "0.06em", outline: "none",
    textAlign: "center", borderRadius: 2,
  },
  /* priority band */
  priBand: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: `3px solid ${C.navy}` },
  priOpt: (active, color) => ({
    display: "flex", alignItems: "center", gap: 10, padding: "9px 16px",
    cursor: "pointer", borderRight: `1px solid ${C.line}`,
    background: active ? color + "18" : C.white,
    transition: "background 0.15s",
  }),
  priDot: (active, color) => ({
    width: 16, height: 16, borderRadius: "50%",
    border: `2px solid ${active ? color : C.line}`,
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, transition: "all 0.15s",
  }),
  priDotInner: (active, color) => ({
    width: 8, height: 8, borderRadius: "50%",
    background: active ? color : "transparent",
    transition: "background 0.15s",
  }),
  priLabel: (color) => ({
    fontSize: 13, fontWeight: 700, letterSpacing: "0.06em",
    textTransform: "uppercase", color,
  }),
  priDesc: { fontSize: 10, color: C.ash, fontWeight: 400 },
  /* body */
  body: { background: C.white, maxWidth: 820, margin: "0 auto", boxShadow: "0 4px 32px rgba(0,0,0,0.18)" },
  inner: { padding: "20px 24px 28px" },
  /* section */
  secHead: { display: "flex", alignItems: "center", gap: 8, marginBottom: 12, paddingBottom: 10, borderBottom: `2px solid ${C.fog}`, position: "relative" },
  secNum: { fontSize: 10, fontWeight: 700, color: C.white, background: C.red, padding: "1px 7px", borderRadius: 2, letterSpacing: "0.08em" },
  secNumMgr: { fontSize: 10, fontWeight: 700, color: C.white, background: C.navy, padding: "1px 7px", borderRadius: 2, letterSpacing: "0.08em" },
  secTitle: { fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.navy },
  secRule: { flex: 1, height: 1, background: C.line },
  secAccent: { position: "absolute", bottom: -2, left: 0, width: 48, height: 2, background: C.red },
  /* field */
  fieldGroup: (cols) => ({
    display: "grid",
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gap: 10,
    marginBottom: 0,
  }),
  field: { display: "flex", flexDirection: "column", gap: 4 },
  label: { fontSize: 9.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.ash },
  req: { color: C.red, marginLeft: 2 },
  input: {
    background: C.fog, border: `1px solid ${C.line}`, borderRadius: 3,
    padding: "6px 9px", fontFamily: "inherit", fontSize: 12, color: C.navy,
    width: "100%", outline: "none", transition: "border-color 0.15s, background 0.15s",
  },
  textarea: {
    background: C.fog, border: `1px solid ${C.line}`, borderRadius: 3,
    padding: "6px 9px", fontFamily: "inherit", fontSize: 12, color: C.navy,
    width: "100%", outline: "none", resize: "vertical", lineHeight: 1.5,
  },
  /* checkbox pill */
  pill: (active) => ({
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "5px 10px",
    background: active ? C.navy : C.fog,
    border: `1px solid ${active ? C.navy : C.line}`,
    borderRadius: 3, cursor: "pointer", fontSize: 11.5,
    fontWeight: active ? 600 : 500,
    color: active ? C.white : C.slate,
    transition: "all 0.12s", userSelect: "none",
  }),
  pillBox: (active) => ({
    width: 13, height: 13, borderRadius: 2,
    border: `1.5px solid ${active ? C.red : C.ash}`,
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, fontSize: 9,
    background: active ? C.red : "transparent",
    color: active ? C.white : "transparent",
    transition: "all 0.12s",
  }),
  /* radio pill */
  radioPill: (active, color) => ({
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "5px 12px",
    background: active ? (color || C.navy) : C.fog,
    border: `1px solid ${active ? (color || C.navy) : C.line}`,
    borderRadius: 3, cursor: "pointer", fontSize: 12,
    fontWeight: active ? 600 : 500,
    color: active ? C.white : C.slate,
    transition: "all 0.12s", userSelect: "none",
  }),
  /* treatment table */
  tbl: { width: "100%", borderCollapse: "collapse", fontSize: 12 },
  tblTh: { background: C.navy, color: C.white, fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", padding: "7px 10px", textAlign: "left" },
  tblTd: { padding: "3px 6px", borderBottom: `1px solid ${C.line}` },
  tblInput: { width: "100%", border: "none", background: "transparent", fontFamily: "inherit", fontSize: 11.5, color: C.navy, outline: "none", padding: "2px 3px" },
  /* notice */
  notice: { background: "#FFF4E5", border: `1px solid #F0C060`, borderLeft: `4px solid ${C.gold}`, borderRadius: 3, padding: "9px 14px", display: "flex", alignItems: "center", gap: 10, marginTop: 12 },
  noticeText: { fontSize: 11.5, fontWeight: 600, color: "#7A4800", flex: 1 },
  /* declaration */
  decl: { background: C.fog, border: `1px solid ${C.line}`, borderLeft: `4px solid ${C.navy}`, borderRadius: 3, padding: "12px 14px", fontSize: 11, color: C.slate, lineHeight: 1.6, marginBottom: 16 },
  /* sig */
  sigGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 },
  sigArea: { height: 56, background: C.white, border: `1px solid ${C.line}`, borderRadius: 3, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 6 },
  sigAreaText: { fontSize: 9, color: "#ccc", letterSpacing: "0.06em", textTransform: "uppercase" },
  /* footer */
  footer: { background: C.navy, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 24px", flexWrap: "wrap", gap: 12 },
  footerLeft: { fontSize: 10, letterSpacing: "0.08em", color: C.ash },
  /* divider */
  divider: { height: 1, background: C.line, margin: "18px 0" },
  /* submit btn */
  submitBtn: {
    background: C.red, color: C.white, border: "none",
    padding: "12px 32px", fontFamily: "inherit", fontSize: 14, fontWeight: 700,
    letterSpacing: "0.08em", textTransform: "uppercase", borderRadius: 4,
    cursor: "pointer", width: "100%", marginTop: 20, transition: "background 0.15s",
  },
  /* admin */
  adminBar: { background: C.navy, padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 },
  adminBarTitle: { fontSize: 14, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.white },
  adminBtn: (active) => ({
    background: active ? C.red : "rgba(255,255,255,0.1)",
    color: C.white, border: "none", padding: "6px 14px",
    fontFamily: "inherit", fontSize: 11, fontWeight: 600,
    letterSpacing: "0.08em", textTransform: "uppercase",
    borderRadius: 3, cursor: "pointer", transition: "all 0.15s",
  }),
  card: { background: C.white, border: `1px solid ${C.line}`, borderRadius: 6, padding: "14px 18px", marginBottom: 12, borderLeft: `4px solid ${C.line}` },
  cardRed: { background: C.white, border: `1px solid ${C.line}`, borderRadius: 6, padding: "14px 18px", marginBottom: 12, borderLeft: `4px solid ${C.red}` },
  cardAmber: { background: C.white, border: `1px solid ${C.line}`, borderRadius: 6, padding: "14px 18px", marginBottom: 12, borderLeft: `4px solid ${C.amber}` },
  cardGreen: { background: C.white, border: `1px solid ${C.line}`, borderRadius: 6, padding: "14px 18px", marginBottom: 12, borderLeft: `4px solid ${C.green}` },
};

/* ─── SUB-COMPONENTS ─── */

function SectionHead({ num, title, mgr }) {
  return (
    <div style={{ ...styles.secHead, marginTop: 20 }}>
      <span style={mgr ? styles.secNumMgr : styles.secNum}>{num}</span>
      <span style={styles.secTitle}>{title}</span>
      <div style={styles.secRule} />
      <div style={styles.secAccent} />
    </div>
  );
}

function Field({ label, req, children, span, style }) {
  return (
    <div style={{ ...styles.field, gridColumn: span ? `span ${span}` : undefined, ...style }}>
      <div style={styles.label}>{label}{req && <span style={styles.req}>*</span>}</div>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text" }) {
  return (
    <input
      style={styles.input}
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={e => { e.target.style.borderColor = C.navy; e.target.style.background = C.white; }}
      onBlur={e => { e.target.style.borderColor = C.line; e.target.style.background = C.fog; }}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      style={styles.textarea}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      onFocus={e => { e.target.style.borderColor = C.navy; e.target.style.background = C.white; }}
      onBlur={e => { e.target.style.borderColor = C.line; e.target.style.background = C.fog; }}
    />
  );
}

function CheckPill({ label, checked, onChange }) {
  return (
    <div style={styles.pill(checked)} onClick={() => onChange(!checked)}>
      <div style={styles.pillBox(checked)}>✓</div>
      <span>{label}</span>
    </div>
  );
}

function RadioPill({ label, checked, onChange, color }) {
  return (
    <div style={styles.radioPill(checked, color)} onClick={onChange}>
      <span>{label}</span>
    </div>
  );
}

function PillGroup({ items, value, onChange, multi }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
      {items.map(item => {
        const checked = multi ? value.includes(item) : value === item;
        return (
          <CheckPill
            key={item}
            label={item}
            checked={checked}
            onChange={multi
              ? (v) => onChange(v ? [...value, item] : value.filter(x => x !== item))
              : () => onChange(checked ? "" : item)
            }
          />
        );
      })}
    </div>
  );
}

function RadioGroup({ options, value, onChange, color }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
      {options.map(opt => (
        <RadioPill
          key={opt}
          label={opt}
          checked={value === opt}
          onChange={() => onChange(value === opt ? "" : opt)}
          color={color}
        />
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────
   FORM PAGE
──────────────────────────────────────────────── */

function FormPage({ onSubmit }) {
  const [f, setF] = useState({ ...blank(), ref: genRef() });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState([]);

  const set = (key) => (val) => setF(prev => ({ ...prev, [key]: val }));
  const setTreat = (i, key) => (val) => {
    setF(prev => {
      const t = [...prev.treatments];
      t[i] = { ...t[i], [key]: val };
      return { ...prev, treatments: t };
    });
  };

  const validate = () => {
    const e = [];
    if (!f.priority) e.push("Severity priority must be selected");
    if (!f.date) e.push("Incident date is required");
    if (!f.site) e.push("Site / contract is required");
    if (!f.location) e.push("Exact location is required");
    if (!f.casualtyName) e.push("Casualty name is required");
    if (!f.casualtyType) e.push("Casualty type is required");
    if (f.injuryTypes.length === 0) e.push("At least one injury type must be selected");
    if (!f.bodyLocation) e.push("Body location is required");
    if (!f.description) e.push("Incident description is required");
    if (!f.outcome) e.push("Outcome must be selected");
    if (!f.faName) e.push("First aider name (Section 9) is required");
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (e.length > 0) { setErrors(e); window.scrollTo(0, 0); return; }
    const record = { ...f, submittedAt: new Date().toISOString() };
    onSubmit(record);
    setSubmitted(true);
    window.scrollTo(0, 0);
  };

  if (submitted) {
    return (
      <div style={styles.page}>
        <div style={{ ...styles.body, padding: "60px 40px", textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: C.navy, marginBottom: 8 }}>Report Submitted</div>
          <div style={{ fontSize: 14, color: C.slate, marginBottom: 4 }}>Reference: <strong>{f.ref}</strong></div>
          <div style={{ fontSize: 13, color: C.ash, marginBottom: 32 }}>
            Submitted at {new Date().toLocaleString("en-GB")}.<br/>
            This report has been saved and is visible to SSG management.
          </div>
          <button style={{ ...styles.submitBtn, width: "auto", padding: "10px 28px" }}
            onClick={() => { setF({ ...blank(), ref: genRef() }); setSubmitted(false); setErrors([]); }}>
            Submit Another Report
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.body}>

        {/* HEADER */}
        <div style={styles.hdrWrap}>
          <div style={styles.hdrAccent} />
          <div style={styles.hdrText}>
            <div style={styles.hdrOrg}>SSG Support Services Group Ltd</div>
            <div style={styles.hdrTitle}>First Aid <span style={styles.hdrTitleSpan}>Incident</span> Report</div>
            <div style={styles.hdrSub}>Confidential · Retain minimum 3 years · RIDDOR may apply</div>
          </div>
          <div style={styles.hdrRight}>
            <div style={styles.refLabel}>Report Ref No.</div>
            <input style={styles.refBox} value={f.ref} onChange={e => set("ref")(e.target.value)} />
          </div>
        </div>

        {/* PRIORITY BAND */}
        <div style={styles.priBand}>
          {Object.entries(priorityMeta).map(([key, meta], i) => {
            const active = f.priority === key;
            return (
              <div key={key}
                style={{ ...styles.priOpt(active, meta.color), borderRight: i < 2 ? `1px solid ${C.line}` : "none" }}
                onClick={() => set("priority")(key)}>
                <div style={styles.priDot(active, meta.color)}>
                  <div style={styles.priDotInner(active, meta.color)} />
                </div>
                <div>
                  <div style={styles.priLabel(meta.color)}>{meta.label}</div>
                  <div style={styles.priDesc}>{meta.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={styles.inner}>

          {/* ERRORS */}
          {errors.length > 0 && (
            <div style={{ background: "#FFF0F0", border: `1px solid ${C.red}`, borderLeft: `4px solid ${C.red}`, borderRadius: 4, padding: "12px 16px", marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.red, marginBottom: 8 }}>Please correct the following before submitting:</div>
              {errors.map((e, i) => <div key={i} style={{ fontSize: 12, color: "#8B0000", marginBottom: 3 }}>• {e}</div>)}
            </div>
          )}

          {/* S1 – INCIDENT DETAILS */}
          <SectionHead num="01" title="Incident Details" />
          <div style={styles.fieldGroup(4)}>
            <Field label="Date of Incident" req><Input value={f.date} onChange={set("date")} type="date" /></Field>
            <Field label="Time of Incident" req><Input value={f.time} onChange={set("time")} type="time" /></Field>
            <Field label="Report Completed"><Input value={f.reportedAt} onChange={set("reportedAt")} type="datetime-local" /></Field>
            <Field label="Contract / Site" req><Input value={f.site} onChange={set("site")} placeholder="e.g. Gala Theatre" /></Field>
          </div>
          <div style={{ ...styles.fieldGroup(4), marginTop: 10 }}>
            <Field label="Exact Location on Site" req span={2}><Input value={f.location} onChange={set("location")} placeholder="e.g. Main entrance foyer, Stage Door steps..." /></Field>
            <Field label="What3Words"><Input value={f.w3w} onChange={set("w3w")} placeholder="///word.word.word" /></Field>
            <Field label="Conditions / Environment"><Input value={f.conditions} onChange={set("conditions")} placeholder="e.g. Wet floor, poor lighting" /></Field>
          </div>

          {/* S2 – CASUALTY */}
          <SectionHead num="02" title="Casualty Details" />
          <div style={styles.fieldGroup(3)}>
            <Field label="Full Name" req span={2}><Input value={f.casualtyName} onChange={set("casualtyName")} placeholder="Surname, First name" /></Field>
            <Field label="Date of Birth / Age"><Input value={f.dob} onChange={set("dob")} placeholder="DD/MM/YYYY or approx. age" /></Field>
          </div>
          <div style={{ ...styles.fieldGroup(2), marginTop: 10 }}>
            <Field label="Gender">
              <RadioGroup options={["Male","Female","Other","Unknown"]} value={f.gender} onChange={set("gender")} />
            </Field>
            <Field label="Casualty Type" req>
              <RadioGroup options={["SSG Staff","Client Staff","Member of Public","Contractor"]} value={f.casualtyType} onChange={set("casualtyType")} />
            </Field>
          </div>
          <div style={{ ...styles.fieldGroup(3), marginTop: 10 }}>
            <Field label="Contact Number"><Input value={f.contact} onChange={set("contact")} placeholder="Mobile or home number" /></Field>
            <Field label="Next of Kin / Address" span={2}><Input value={f.nextOfKin} onChange={set("nextOfKin")} placeholder="Name and contact or address if required" /></Field>
          </div>
          <div style={{ ...styles.fieldGroup(2), marginTop: 10 }}>
            <Field label="Known Medical Conditions / Allergies"><Input value={f.medicalHistory} onChange={set("medicalHistory")} placeholder="e.g. diabetic, penicillin allergy — or 'None known'" /></Field>
            <Field label="Consent to Treatment Given?">
              <RadioGroup options={["Yes","No","Unable to consent"]} value={f.consent} onChange={set("consent")} />
            </Field>
          </div>

          {/* S3 – INJURY */}
          <SectionHead num="03" title="Nature of Injury / Illness" />
          <Field label="Injury Type (select all that apply)" req>
            <PillGroup items={INJURY_TYPES} value={f.injuryTypes} onChange={set("injuryTypes")} multi />
          </Field>
          <div style={{ ...styles.fieldGroup(1), marginTop: 10 }}>
            <Field label="Body Location — describe precisely" req>
              <Input value={f.bodyLocation} onChange={set("bodyLocation")} placeholder="e.g. Left forearm, right knee, lower back, top of head..." />
            </Field>
          </div>

          {/* S4 – DESCRIPTION */}
          <SectionHead num="04" title="Incident Description" />
          <Field label="How did the incident occur? — factual account" req>
            <Textarea value={f.description} onChange={set("description")} rows={4}
              placeholder="Clear, factual description — who, what, where, when, how. Include the sequence of events leading up to the incident..." />
          </Field>
          <div style={{ marginTop: 10 }}>
            <Field label="Casualty's own account (if given)">
              <Textarea value={f.casualtyAccount} onChange={set("casualtyAccount")} rows={2}
                placeholder="Record the casualty's own words where possible..." />
            </Field>
          </div>

          {/* S5 – TREATMENT */}
          <SectionHead num="05" title="Treatment Given" />
          <table style={styles.tbl}>
            <thead>
              <tr>
                <th style={{ ...styles.tblTh, width: 90 }}>Time</th>
                <th style={styles.tblTh}>Treatment / Action Taken</th>
                <th style={{ ...styles.tblTh, width: 140 }}>Given By</th>
                <th style={{ ...styles.tblTh, width: 110 }}>Qualification</th>
              </tr>
            </thead>
            <tbody>
              {f.treatments.map((t, i) => (
                <tr key={i} style={{ background: i % 2 === 1 ? C.fog : C.white }}>
                  <td style={styles.tblTd}><input style={styles.tblInput} type="time" value={t.time} onChange={e => setTreat(i, "time")(e.target.value)} /></td>
                  <td style={styles.tblTd}><input style={styles.tblInput} type="text" value={t.treatment} onChange={e => setTreat(i, "treatment")(e.target.value)} placeholder="e.g. Wound cleaned and dressed..." /></td>
                  <td style={styles.tblTd}><input style={styles.tblInput} type="text" value={t.givenBy} onChange={e => setTreat(i, "givenBy")(e.target.value)} placeholder="Full name" /></td>
                  <td style={styles.tblTd}><input style={styles.tblInput} type="text" value={t.qualification} onChange={e => setTreat(i, "qualification")(e.target.value)} placeholder="e.g. EFAW, FAW" /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ ...styles.fieldGroup(3), marginTop: 10 }}>
            <Field label="AED Used?">
              <RadioGroup options={["Yes","No"]} value={f.aedUsed} onChange={set("aedUsed")} />
            </Field>
            <Field label="AED Serial / Location"><Input value={f.aedSerial} onChange={set("aedSerial")} placeholder="Serial no. or cabinet location" /></Field>
            <Field label="First Aid Kit Ref"><Input value={f.kitRef} onChange={set("kitRef")} placeholder="Kit ID / location" /></Field>
          </div>

          {/* S6 – OUTCOME */}
          <SectionHead num="06" title="Outcome & Referral" />
          <div style={styles.fieldGroup(2)}>
            <Field label="Outcome" req>
              <PillGroup items={OUTCOMES} value={f.outcome} onChange={set("outcome")} multi={false} />
            </Field>
            <div>
              <Field label="999 Called at"><Input value={f.called999At} onChange={set("called999At")} type="time" /></Field>
              <div style={{ marginTop: 8 }}>
                <Field label="Ambulance Arrived at"><Input value={f.ambulanceAt} onChange={set("ambulanceAt")} type="time" /></Field>
              </div>
              <div style={{ marginTop: 8 }}>
                <Field label="Hospital / Destination"><Input value={f.hospital} onChange={set("hospital")} placeholder="Hospital name and department" /></Field>
              </div>
            </div>
          </div>
          <div style={styles.notice}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div style={styles.noticeText}>
              RIDDOR Check — does this incident meet a reportable threshold?
              <div style={{ fontWeight: 400, fontSize: 11, marginTop: 3 }}>Death, specified injury, 7+ day incapacitation, dangerous occurrence, occupational disease (employee / self-employed only)</div>
            </div>
            <RadioGroup options={["Yes – report to HSE","No","Under review"]} value={f.riddor} onChange={set("riddor")} color={C.gold} />
          </div>

          {/* S7 – WITNESSES */}
          <SectionHead num="07" title="Witnesses" />
          <div style={styles.fieldGroup(3)}>
            <Field label="Witness 1 — Name"><Input value={f.wit1Name} onChange={set("wit1Name")} placeholder="Full name" /></Field>
            <Field label="Role / Relation"><Input value={f.wit1Role} onChange={set("wit1Role")} placeholder="e.g. SSG Officer, member of public" /></Field>
            <Field label="Contact"><Input value={f.wit1Contact} onChange={set("wit1Contact")} placeholder="Phone / email" /></Field>
            <Field label="Witness 2 — Name"><Input value={f.wit2Name} onChange={set("wit2Name")} placeholder="Full name" /></Field>
            <Field label="Role / Relation"><Input value={f.wit2Role} onChange={set("wit2Role")} placeholder="e.g. SSG Officer, member of public" /></Field>
            <Field label="Contact"><Input value={f.wit2Contact} onChange={set("wit2Contact")} placeholder="Phone / email" /></Field>
          </div>

          {/* S8 – FACTORS */}
          <SectionHead num="08" title="Contributing Factors & Preventive Actions" />
          <div style={styles.fieldGroup(2)}>
            <Field label="Contributing Factors (select all that apply)">
              <PillGroup items={FACTORS} value={f.factors} onChange={set("factors")} multi />
            </Field>
            <Field label="Immediate Preventive / Corrective Action Taken">
              <Textarea value={f.corrective} onChange={set("corrective")} rows={5}
                placeholder="Actions to prevent recurrence or make area safe — e.g. hazard coned, management notified, area closed..." />
            </Field>
          </div>
          <div style={{ marginTop: 10 }}>
            <Field label="Recommended Follow-Up / Further Investigation Required">
              <Textarea value={f.followUp} onChange={set("followUp")} rows={2}
                placeholder="e.g. First aid kit restock, CCTV review, risk assessment update required..." />
            </Field>
          </div>

          {/* DECLARATION */}
          <div style={styles.divider} />
          <div style={styles.decl}>
            I declare that the information recorded on this form is accurate and complete to the best of my knowledge. I understand that this report may be used in legal proceedings, insurance claims, or regulatory investigations. This form must be submitted to the SSG Northern Contracts Manager within 24 hours of the incident.
          </div>

          {/* S9 – SIGNATURES */}
          <SectionHead num="09" title="Signatures & Certification" />
          <div style={styles.sigGrid}>
            <div>
              <div style={{ ...styles.label, marginBottom: 4 }}>First Aider / Reporting Officer</div>
              <div style={styles.sigArea}><span style={styles.sigAreaText}>Sign on printed copy</span></div>
              <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 6 }}>
                <Input value={f.faName} onChange={set("faName")} placeholder="Print full name" />
                <Input value={f.faSiaNo} onChange={set("faSiaNo")} placeholder="SIA / FA qualification no." />
                <Input value={f.faDate} onChange={set("faDate")} type="date" />
              </div>
            </div>
            <div>
              <div style={{ ...styles.label, marginBottom: 4 }}>Casualty (where possible)</div>
              <div style={styles.sigArea}><span style={styles.sigAreaText}>Sign on printed copy</span></div>
              <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 6 }}>
                <Input value={f.casualtySignDate} onChange={set("casualtySignDate")} type="date" />
                <Input value={f.casualtyUnableReason} onChange={set("casualtyUnableReason")} placeholder="Reason if unable to sign" />
              </div>
            </div>
            <div>
              <div style={{ ...styles.label, marginBottom: 4 }}>Site / Shift Supervisor</div>
              <div style={styles.sigArea}><span style={styles.sigAreaText}>Sign on printed copy</span></div>
              <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 6 }}>
                <Input value={f.supervisorName} onChange={set("supervisorName")} placeholder="Print full name" />
                <Input value={f.supervisorRole} onChange={set("supervisorRole")} placeholder="Role" />
                <Input value={f.supervisorDate} onChange={set("supervisorDate")} type="date" />
              </div>
            </div>
          </div>

          {/* SUBMIT */}
          <button style={styles.submitBtn}
            onMouseEnter={e => e.target.style.background = "#a00d24"}
            onMouseLeave={e => e.target.style.background = C.red}
            onClick={handleSubmit}>
            Submit Incident Report
          </button>
        </div>

        {/* FOOTER */}
        <div style={styles.footer}>
          <div style={styles.footerLeft}>
            <span style={{ color: C.white }}>SSG Support Services Group Ltd</span> · First Aid Incident Report · FA-001 Rev.3<br />
            Complete in full · Submit within 24 hours · Retain 3 years minimum
          </div>
          <div style={{ fontSize: 10, color: C.ash }}>FA-001 Rev.3 · Page 1 of 1</div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────
   ADMIN PAGE
──────────────────────────────────────────────── */

function AdminPage({ submissions, onBack, onClear }) {
  const [selected, setSelected] = useState(null);
  const [pin, setPin] = useState("");
  const [authed, setAuthed] = useState(false);
  const [pinError, setPinError] = useState(false);

  if (!authed) {
    return (
      <div style={{ ...styles.page, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ background: C.white, borderRadius: 8, padding: "40px 48px", boxShadow: "0 4px 24px rgba(0,0,0,0.15)", textAlign: "center", minWidth: 300 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.navy, marginBottom: 4 }}>Admin Access</div>
          <div style={{ fontSize: 12, color: C.ash, marginBottom: 24 }}>SSG Management only</div>
          <input
            style={{ ...styles.input, textAlign: "center", fontSize: 18, letterSpacing: "0.3em", marginBottom: 8 }}
            type="password"
            placeholder="Enter PIN"
            value={pin}
            onChange={e => { setPin(e.target.value); setPinError(false); }}
            onKeyDown={e => { if (e.key === "Enter") { if (pin === ADMIN_PIN) setAuthed(true); else setPinError(true); } }}
          />
          {pinError && <div style={{ fontSize: 11, color: C.red, marginBottom: 8 }}>Incorrect PIN</div>}
          <button style={{ ...styles.submitBtn, width: "auto", padding: "10px 28px", marginTop: 8 }}
            onClick={() => { if (pin === ADMIN_PIN) setAuthed(true); else setPinError(true); }}>
            Unlock
          </button>
          <div style={{ marginTop: 16 }}>
            <span style={{ fontSize: 11, color: C.ash, cursor: "pointer", textDecoration: "underline" }} onClick={onBack}>← Back to form</span>
          </div>
        </div>
      </div>
    );
  }

  if (selected !== null) {
    const s = submissions[selected];
    const priMeta = priorityMeta[s.priority] || {};
    return (
      <div style={styles.page}>
        <div style={styles.adminBar}>
          <div style={styles.adminBarTitle}>Viewing Report: {s.ref}</div>
          <button style={styles.adminBtn(false)} onClick={() => setSelected(null)}>← Back to list</button>
        </div>
        <div style={{ ...styles.body, padding: "24px" }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
            <div style={{ background: priMeta.color + "22", border: `1px solid ${priMeta.color}`, borderRadius: 4, padding: "4px 12px", fontSize: 12, fontWeight: 700, color: priMeta.color }}>{priMeta.label || s.priority}</div>
            <div style={{ fontSize: 12, color: C.ash }}>Submitted: {new Date(s.submittedAt).toLocaleString("en-GB")}</div>
          </div>
          {[
            ["Incident", [["Date", s.date], ["Time", s.time], ["Site", s.site], ["Location", s.location], ["W3W", s.w3w], ["Conditions", s.conditions]]],
            ["Casualty", [["Name", s.casualtyName], ["DOB", s.dob], ["Gender", s.gender], ["Type", s.casualtyType], ["Contact", s.contact], ["Medical History", s.medicalHistory], ["Consent", s.consent]]],
            ["Injury", [["Types", (s.injuryTypes || []).join(", ")], ["Body Location", s.bodyLocation]]],
            ["Description", [["Account", s.description], ["Casualty's Account", s.casualtyAccount]]],
            ["Outcome", [["Outcome", s.outcome], ["RIDDOR", s.riddor], ["999 At", s.called999At], ["Ambulance At", s.ambulanceAt], ["Hospital", s.hospital]]],
            ["Witnesses", [["Witness 1", `${s.wit1Name} — ${s.wit1Role} — ${s.wit1Contact}`], ["Witness 2", `${s.wit2Name} — ${s.wit2Role} — ${s.wit2Contact}`]]],
            ["Factors", [["Factors", (s.factors || []).join(", ")], ["Corrective Action", s.corrective], ["Follow-Up", s.followUp]]],
            ["Signatures", [["First Aider", s.faName], ["SIA / FA No.", s.faSiaNo], ["Supervisor", s.supervisorName]]],
          ].map(([heading, rows]) => (
            <div key={heading} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.navy, borderBottom: `2px solid ${C.fog}`, paddingBottom: 6, marginBottom: 10 }}>{heading}</div>
              <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: "6px 12px" }}>
                {rows.filter(([, v]) => v).map(([k, v]) => (
                  <>
                    <div key={k+"k"} style={{ fontSize: 11, color: C.ash, fontWeight: 600 }}>{k}</div>
                    <div key={k+"v"} style={{ fontSize: 12, color: C.navy }}>{v}</div>
                  </>
                ))}
              </div>
            </div>
          ))}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.navy, borderBottom: `2px solid ${C.fog}`, paddingBottom: 6, marginBottom: 10 }}>Treatment Log</div>
            <table style={styles.tbl}>
              <thead><tr><th style={{ ...styles.tblTh, width: 80 }}>Time</th><th style={styles.tblTh}>Treatment</th><th style={{ ...styles.tblTh, width: 140 }}>Given By</th><th style={{ ...styles.tblTh, width: 110 }}>Qualification</th></tr></thead>
              <tbody>
                {(s.treatments || []).filter(t => t.treatment).map((t, i) => (
                  <tr key={i} style={{ background: i % 2 === 1 ? C.fog : C.white }}>
                    <td style={styles.tblTd}>{t.time}</td>
                    <td style={styles.tblTd}>{t.treatment}</td>
                    <td style={styles.tblTd}>{t.givenBy}</td>
                    <td style={styles.tblTd}>{t.qualification}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  const counts = { minor: 0, moderate: 0, serious: 0 };
  submissions.forEach(s => { if (counts[s.priority] !== undefined) counts[s.priority]++; });

  return (
    <div style={styles.page}>
      <div style={styles.adminBar}>
        <div style={styles.adminBarTitle}>SSG — First Aid Submissions Dashboard</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={styles.adminBtn(false)} onClick={onBack}>← New Report</button>
          <button style={{ ...styles.adminBtn(false), background: "rgba(200,16,46,0.3)" }}
            onClick={() => { if (window.confirm("Clear ALL submissions? This cannot be undone.")) onClear(); }}>
            Clear All
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "24px 0" }}>
        {/* STATS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total Reports", value: submissions.length, color: C.navy },
            { label: "Minor", value: counts.minor, color: C.green },
            { label: "Moderate", value: counts.moderate, color: C.amber },
            { label: "Serious / RIDDOR", value: counts.serious, color: C.red },
          ].map(stat => (
            <div key={stat.label} style={{ background: C.white, border: `1px solid ${C.line}`, borderTop: `3px solid ${stat.color}`, borderRadius: 6, padding: "16px", textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: C.ash, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* LIST */}
        {submissions.length === 0 ? (
          <div style={{ background: C.white, borderRadius: 6, padding: "40px", textAlign: "center", color: C.ash, fontSize: 14 }}>
            No submissions yet
          </div>
        ) : (
          [...submissions].reverse().map((s, ri) => {
            const i = submissions.length - 1 - ri;
            const pm = priorityMeta[s.priority] || {};
            const cardStyle = s.priority === "serious" ? styles.cardRed : s.priority === "moderate" ? styles.cardAmber : styles.cardGreen;
            return (
              <div key={s.ref + i} style={cardStyle}
                onClick={() => setSelected(i)}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.1)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
                style={{ ...cardStyle, cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: C.navy }}>{s.ref}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: pm.color, background: pm.color + "18", padding: "2px 8px", borderRadius: 3 }}>{pm.label}</span>
                      <span style={{ fontSize: 11, color: C.ash }}>{s.date} · {s.time}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.slate, marginBottom: 3 }}>{s.casualtyName || "—"} <span style={{ fontWeight: 400, color: C.ash }}>({s.casualtyType})</span></div>
                    <div style={{ fontSize: 12, color: C.ash }}>{s.site} — {s.location}</div>
                    {s.injuryTypes && s.injuryTypes.length > 0 && (
                      <div style={{ fontSize: 11, color: C.ash, marginTop: 4 }}>{s.injuryTypes.slice(0, 3).join(", ")}{s.injuryTypes.length > 3 ? ` +${s.injuryTypes.length - 3} more` : ""}</div>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: C.ash, textAlign: "right", flexShrink: 0 }}>
                    <div>{new Date(s.submittedAt).toLocaleDateString("en-GB")}</div>
                    <div>{new Date(s.submittedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</div>
                    <div style={{ marginTop: 8, color: C.navy, fontWeight: 600, fontSize: 12 }}>View →</div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────
   ROOT APP
──────────────────────────────────────────────── */

export default function App() {
  const [view, setView] = useState("form");
  const [submissions, setSubmissions] = useState([]);

  // Load from storage on mount
  useEffect(() => {
    (async () => {
      try {
        const result = await window.storage.get(SUBMISSIONS_KEY);
        if (result) setSubmissions(JSON.parse(result.value));
      } catch (_) { /* first run */ }
    })();
  }, []);

  const saveSubmissions = async (data) => {
    try { await window.storage.set(SUBMISSIONS_KEY, JSON.stringify(data)); } catch (_) {}
  };

  const handleSubmit = (record) => {
    const updated = [...submissions, record];
    setSubmissions(updated);
    saveSubmissions(updated);
  };

  const handleClear = () => {
    setSubmissions([]);
    saveSubmissions([]);
  };

  if (view === "admin") {
    return <AdminPage submissions={submissions} onBack={() => setView("form")} onClear={handleClear} />;
  }

  return (
    <div>
      {/* Top nav strip */}
      <div style={{ background: "#060F18", padding: "6px 24px", display: "flex", justifyContent: "flex-end" }}>
        <button style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: C.ash, padding: "4px 12px", fontFamily: "inherit", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", borderRadius: 3, cursor: "pointer" }}
          onClick={() => setView("admin")}>
          🔒 SSG Management
        </button>
      </div>
      <FormPage onSubmit={handleSubmit} />
    </div>
  );
}
