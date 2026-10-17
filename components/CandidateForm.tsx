"use client";

import { useState } from "react";

type Props = {
  onClose: () => void;
  onCreated: () => void;
};

const FIELDS = [
  { name: "name", label: "Name *", type: "text" },
  { name: "email", label: "Email *", type: "email" },
  { name: "role", label: "Role applied for *", type: "text" },
  { name: "phone", label: "Phone", type: "text" },
  { name: "source", label: "Source (e.g. LinkedIn)", type: "text" },
  { name: "resumeUrl", label: "Resume link", type: "text" },
];

export default function CandidateForm({ onClose, onCreated }: Props) {
  const [form, setForm] = useState<Record<string, string>>({
    name: "",
    email: "",
    role: "",
    phone: "",
    source: "",
    resumeUrl: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setFormError("");

    const res = await fetch("/api/candidates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const body = await res.json().catch(() => ({}));
    setSaving(false);

    if (res.ok) {
      onCreated();
      return;
    }
    if (body.details) setErrors(body.details);
    setFormError(body.error ?? "Could not save candidate");
  }

  const inputClass =
    "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900";

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={submit}
        className="max-h-full w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
      >
        <h2 className="mb-4 text-lg font-semibold">Add candidate</h2>

        {formError && (
          <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </div>
        )}

        <div className="space-y-3">
          {FIELDS.map((f) => (
            <div key={f.name}>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {f.label}
              </label>
              <input
                type={f.type}
                value={form[f.name]}
                onChange={(e) => update(f.name, e.target.value)}
                className={inputClass}
              />
              {errors[f.name] && (
                <p className="mt-1 text-xs text-red-600">{errors[f.name][0]}</p>
              )}
            </div>
          ))}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save candidate"}
          </button>
        </div>
      </form>
    </div>
  );
}