export const STATUSES = ["To Do", "In Progress", "Done"] as const;
export const PRIORITIES = ["Low", "Medium", "High"] as const;

export type Status = (typeof STATUSES)[number];
export type Priority = (typeof PRIORITIES)[number];

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS tasks (
  id          UUID PRIMARY KEY,
  title       VARCHAR(100) NOT NULL CHECK (title <> ''),
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'To Do' CHECK (status IN ('To Do', 'In Progress', 'Done')),
  priority    TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks (status);
`;
