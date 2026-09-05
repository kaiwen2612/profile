"use client";
import { useRef, useState } from "react";
import { CONTACT_API_URL } from "@/lib/siteConfig";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
type Field = "name" | "email" | "message";
type Errors = Partial<Record<Field, string>>;
type Status = "idle" | "submitting" | "success" | "error";
const EMPTY = { name: "", email: "", message: "", website: "" };

export function ContactForm({ ownerEmail }: { ownerEmail: string }) {
  const renderedAt = useRef(Date.now());
  const [values, setValues] = useState({ ...EMPTY });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");

  function validate(v: typeof values): Errors {
    const e: Errors = {};
    if (!v.name.trim()) e.name = "Please enter your name.";
    else if (v.name.trim().length > 100) e.name = "Name is too long.";
    if (!v.email.trim()) e.email = "Please enter your email.";
    else if (v.email.trim().length > 200) e.email = "Email is too long.";
    else if (!EMAIL_RE.test(v.email.trim())) e.email = "Please enter a valid email address.";
    if (!v.message.trim()) e.message = "Please enter a message.";
    else if (v.message.trim().length > 5000) e.message = "Message is too long (5000 characters max).";
    return e;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate(values);
    setErrors(e);
    if (Object.keys(e).length) return;
    setStatus("submitting");
    try {
      const res = await fetch(CONTACT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, renderedAt: renderedAt.current }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setValues({ ...EMPTY });
        setStatus("success");
        return;
      }
      if (res.status === 400 && data.fields) {
        const mapped: Errors = {};
        for (const k of ["name", "email", "message"] as Field[]) {
          if (data.fields[k]) mapped[k] = "Please check this field.";
        }
        setErrors(mapped);
        setStatus("idle");
        return;
      }
      setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return <p role="status">Thanks — your message has been sent. I’ll be in touch soon.</p>;
  }

  const mailto =
    `mailto:${ownerEmail}?subject=${encodeURIComponent("Contact from profile site")}` +
    `&body=${encodeURIComponent(values.message)}`;

  const field = (name: Field, label: string, type: "input" | "textarea") => {
    const errId = `${name}-error`;
    const common = {
      id: name,
      name,
      value: values[name],
      "aria-invalid": !!errors[name],
      "aria-describedby": errors[name] ? errId : undefined,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setValues({ ...values, [name]: e.target.value }),
    };
    return (
      <p>
        <label htmlFor={name}>{label}</label>
        {type === "input" ? (
          <input {...common} type={name === "email" ? "email" : "text"} maxLength={name === "email" ? 200 : 100} />
        ) : (
          <textarea {...common} maxLength={5000} rows={6} />
        )}
        {errors[name] && <span id={errId}>{errors[name]}</span>}
      </p>
    );
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      {status === "error" && (
        <p role="alert">
          Something went wrong sending your message. Please email me directly at{" "}
          <a href={mailto}>{ownerEmail}</a>.
        </p>
      )}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px" }}>
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={(e) => setValues({ ...values, website: e.target.value })}
        />
      </div>
      {field("name", "Name", "input")}
      {field("email", "Email", "input")}
      {field("message", "Message", "textarea")}
      <p>
        What you send (name, email, message) is emailed to me and not stored by this site. Prefer
        email? Write to me directly at {ownerEmail}.
      </p>
      <button type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
