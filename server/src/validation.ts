import { z } from "zod";
import { PRIORITIES, STATUSES } from "./schema.js";

const status = z.enum(STATUSES, {
  errorMap: () => ({ message: `Status must be one of: ${STATUSES.join(", ")}` }),
});
const priority = z.enum(PRIORITIES, {
  errorMap: () => ({ message: `Priority must be one of: ${PRIORITIES.join(", ")}` }),
});

export const createTaskSchema = z
  .object({
    title: z
      .string({ required_error: "Title is required", invalid_type_error: "Title must be text" })
      .trim()
      .min(1, "Title is required")
      .max(100, "Title must be 100 characters or fewer"),
    description: z
      .string({ invalid_type_error: "Description must be text" })
      .trim()
      .max(2000, "Description must be 2000 characters or fewer")
      .optional(),
    status: status.default("To Do"),
    priority: priority.default("Medium"),
  })
  .strict();

export const updateStatusSchema = z
  .object({ status: status })
  .strict();

export const listQuerySchema = z.object({ status: status.optional() });

export const idSchema = z.string().uuid("Task id must be a valid UUID");
