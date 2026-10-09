import { useState } from "react";
import { STATUSES, type Status, type Task } from "../types";

interface Props {
  task: Task;
  onStatusChange: (id: string, status: Status) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function TaskItem({ task, onStatusChange, onDelete }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    <li className="card task">
      <div className="task-head">
        <h3>{task.title}</h3>
        <span className={`badge priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
      </div>
      {task.description && <p className="desc">{task.description}</p>}
      <p className="meta">Created {new Date(task.createdAt).toLocaleString()}</p>

      <div className="task-actions">
        <select
          aria-label={`Status of ${task.title}`}
          value={task.status}
          disabled={busy}
          onChange={(e) => run(() => onStatusChange(task.id, e.target.value as Status))}
        >
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>

        {confirming ? (
          <span className="confirm" role="alertdialog" aria-label="Confirm delete">
            Delete this task?
            <button className="danger" disabled={busy} onClick={() => run(() => onDelete(task.id))}>
              Yes, delete
            </button>
            <button className="ghost" disabled={busy} onClick={() => setConfirming(false)}>
              Cancel
            </button>
          </span>
        ) : (
          <button className="ghost" onClick={() => setConfirming(true)}>Delete</button>
        )}
      </div>
    </li>
  );
}
