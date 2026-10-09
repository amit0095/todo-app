import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "./api";
import { TaskForm } from "./components/TaskForm";
import { TaskItem } from "./components/TaskItem";
import { STATUSES, type NewTask, type Status, type Task } from "./types";

type Filter = Status | "All";

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<Filter>("All");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true); // silent refreshes keep the list on screen
      setLoadError(null);
      try {
        setTasks(await api.list(filter === "All" ? undefined : filter));
      } catch (err) {
        setLoadError(
          err instanceof ApiError ? err.message : "Failed to load tasks.",
        );
      } finally {
        setLoading(false);
      }
    },
    [filter],
  );

  useEffect(() => {
    load();
  }, [load]);

  // re-fetch after every change so the list matches the server and the filter
  async function mutate(action: () => Promise<unknown>) {
    setActionError(null);
    try {
      await action();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Action failed.");
      throw err;
    }
    await load(true);
  }

  const createTask = (task: NewTask) => mutate(() => api.create(task));
  const changeStatus = (id: string, status: Status) =>
    mutate(() => api.updateStatus(id, status)).catch(() => {});
  const deleteTask = (id: string) =>
    mutate(() => api.remove(id)).catch(() => {});

  return (
    <main>
      <h1>Task Tracker</h1>
      <TaskForm onCreate={createTask} />

      <div className="filters" role="group" aria-label="Filter by status">
        {(["All", ...STATUSES] as Filter[]).map((f) => (
          <button
            key={f}
            className={f === filter ? "chip active" : "chip"}
            aria-pressed={f === filter}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {actionError && (
        <p className="banner error" role="alert">
          {actionError}
        </p>
      )}

      {loading ? (
        <p className="state" aria-busy="true">
          Loading tasks…
        </p>
      ) : loadError ? (
        <div className="state error" role="alert">
          <p>{loadError}</p>
          <button onClick={() => load()}>Retry</button>
        </div>
      ) : tasks.length === 0 ? (
        <p className="state">
          {filter === "All"
            ? "No tasks yet. Add your first one above."
            : `No tasks with status “${filter}”.`}
        </p>
      ) : (
        <ul className="list">
          {tasks.map((t) => (
            <TaskItem
              key={t.id}
              task={t}
              onStatusChange={changeStatus}
              onDelete={deleteTask}
            />
          ))}
        </ul>
      )}
    </main>
  );
}
