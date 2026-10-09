import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import type { Priority, Status } from "./schema.js";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  priority: Priority;
  createdAt: Date;
}

interface NewTask {
  title: string;
  description?: string;
  status: Status;
  priority: Priority;
}

const COLUMNS = `id, title, description, status, priority, created_at AS "createdAt"`;

export function createTaskService(pool: Pool) {
  return {
    async create(task: NewTask) {
      const { rows } = await pool.query<Task>(
        `INSERT INTO tasks (id, title, description, status, priority)
         VALUES ($1, $2, $3, $4, $5) RETURNING ${COLUMNS}`,
        [randomUUID(), task.title, task.description || null, task.status, task.priority],
      );
      return rows[0];
    },

    async list(status?: Status) {
      const where = status ? "WHERE status = $1" : "";
      const params = status ? [status] : [];
      const { rows } = await pool.query<Task>(
        `SELECT ${COLUMNS} FROM tasks ${where} ORDER BY created_at DESC`,
        params,
      );
      return rows;
    },

    async updateStatus(id: string, status: Status) {
      const { rows } = await pool.query<Task>(
        `UPDATE tasks SET status = $2 WHERE id = $1 RETURNING ${COLUMNS}`,
        [id, status],
      );
      return rows[0] as Task | undefined;
    },

    async remove(id: string) {
      const { rowCount } = await pool.query("DELETE FROM tasks WHERE id = $1", [id]);
      return rowCount === 1;
    },
  };
}

export type TaskService = ReturnType<typeof createTaskService>;
