import { useState, type FormEvent } from "react";
import { ApiError } from "../api";
import { PRIORITIES, STATUSES, type NewTask, type Priority, type Status } from "../types";

interface Props {
  onCreate: (task: NewTask) => Promise<void>;
}

const MAX_TITLE = 100;

export function TaskForm({ onCreate }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Status>("To Do");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError(null);
    setSubmitting(true);
    try {
      await onCreate({ title, description: description || undefined, status, priority });
      setTitle("");
      setDescription("");
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fieldErrors);
        if (Object.keys(err.fieldErrors).length === 0) setFormError(err.message);
      } else {
        setFormError("Something went wrong.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="card form" onSubmit={handleSubmit} noValidate>
      <h2>New task</h2>

      <label>
        Title
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={!!errors.title}
          placeholder="What needs doing?"
        />
        <span className="hint">{title.length}/{MAX_TITLE}</span>
        {errors.title && <span className="field-error">{errors.title}</span>}
      </label>

      <label>
        Description (optional)
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        {errors.description && <span className="field-error">{errors.description}</span>}
      </label>

      <div className="row">
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value as Status)}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label>
          Priority
          <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
          </select>
        </label>
      </div>

      {formError && <p className="banner error" role="alert">{formError}</p>}
      <button type="submit" disabled={submitting}>{submitting ? "Adding…" : "Add task"}</button>
    </form>
  );
}
