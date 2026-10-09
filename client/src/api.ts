import type { NewTask, Status, Task } from "./types";

const BASE = "/api";

/** Error carrying the server's field-level validation messages. */
export class ApiError extends Error {
  constructor(
    message: string,
    public fieldErrors: Record<string, string> = {},
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(BASE + path, {
      ...init,
      headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    });
  } catch {
    throw new ApiError(
      "Cannot reach the server. Check your connection and try again.",
    );
  }

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const fieldErrors: Record<string, string> = {};
    for (const d of body?.details ?? []) fieldErrors[d.field] ??= d.message;
    throw new ApiError(body?.error ?? `Request failed (${res.status})`, fieldErrors);
  }
  return body as T;
}

export const api = {
  list: (status?: Status) =>
    request<Task[]>(
      status ? `/tasks?status=${encodeURIComponent(status)}` : "/tasks",
    ),
  create: (task: NewTask) =>
    request<Task>("/tasks", { method: "POST", body: JSON.stringify(task) }),
  updateStatus: (id: string, status: Status) =>
    request<Task>(`/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  remove: (id: string) => request<void>(`/tasks/${id}`, { method: "DELETE" }),
};
