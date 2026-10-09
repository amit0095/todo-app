import cors from "cors";
import express from "express";
import type { ZodTypeAny, z } from "zod";
import { ZodError } from "zod";
import { errorHandler, fromZod, HttpError } from "./errors.js";
import type { TaskService } from "./taskService.js";
import {
  createTaskSchema,
  idSchema,
  listQuerySchema,
  updateStatusSchema,
} from "./validation.js";

function parse<T extends ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  try {
    return schema.parse(data);
  } catch (e) {
    if (e instanceof ZodError) throw fromZod(e);
    throw e;
  }
}

// Express 5 passes errors from async handlers to errorHandler for us
export function createApp(tasks: TaskService, corsOrigin?: string) {
  const app = express();
  app.use(cors(corsOrigin ? { origin: corsOrigin } : undefined));
  app.use(express.json({ limit: "10kb" }));

  app.post("/tasks", async (req, res) => {
    const input = parse(createTaskSchema, req.body ?? {});
    res.status(201).json(await tasks.create(input));
  });

  app.get("/tasks", async (req, res) => {
    const { status } = parse(listQuerySchema, req.query);
    res.json(await tasks.list(status));
  });

  app.patch("/tasks/:id", async (req, res) => {
    const id = parse(idSchema, req.params.id);
    const { status } = parse(updateStatusSchema, req.body ?? {});
    const task = await tasks.updateStatus(id, status);
    if (!task) throw new HttpError(404, "Task not found");
    res.json(task);
  });

  app.delete("/tasks/:id", async (req, res) => {
    const id = parse(idSchema, req.params.id);
    if (!(await tasks.remove(id)))
      throw new HttpError(404, "Task not found");
    res.status(204).end();
  });

  app.use((_req, _res, next) =>
    next(new HttpError(404, "Route not found")),
  );
  app.use(errorHandler);
  return app;
}
