import request from "supertest";
import { newDb } from "pg-mem";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { SCHEMA_SQL } from "../src/schema.js";
import { createTaskService } from "../src/taskService.js";

// pg-mem = in-memory Postgres, so no real DB needed
async function buildApp() {
  const db = newDb();
  const { Pool } = db.adapters.createPg();
  const pool = new Pool();
  await pool.query(SCHEMA_SQL);
  return createApp(createTaskService(pool));
}

let app: Awaited<ReturnType<typeof buildApp>>;
beforeEach(async () => {
  app = await buildApp();
});

describe("POST /tasks", () => {
  it("rejects invalid input with field-level errors", async () => {
    const res = await request(app)
      .post("/tasks")
      .send({ title: "x".repeat(101), status: "Blocked", priority: "Urgent" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
    const fields = res.body.details.map(
      (d: { field: string }) => d.field,
    );
    expect(fields).toEqual(
      expect.arrayContaining(["title", "status", "priority"]),
    );

    const empty = await request(app).post("/tasks").send({ title: "   " });
    expect(empty.status).toBe(400);
    expect(empty.body.details[0]).toMatchObject({
      field: "title",
      message: "Title is required",
    });

    expect((await request(app).get("/tasks")).body).toEqual([]);
  });

  it("creates a task with defaults", async () => {
    const res = await request(app)
      .post("/tasks")
      .send({ title: "  Write tests " });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      title: "Write tests",
      status: "To Do",
      priority: "Medium",
      description: null,
    });
    expect(new Date(res.body.createdAt).getTime()).not.toBeNaN();
  });
});

describe("PATCH /tasks/:id", () => {
  it("updates a task's status and persists it", async () => {
    const created = await request(app)
      .post("/tasks")
      .send({ title: "Ship it", priority: "High" });

    const res = await request(app)
      .patch(`/tasks/${created.body.id}`)
      .send({ status: "Done" });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: created.body.id,
      status: "Done",
      priority: "High",
    });

    const done = await request(app).get("/tasks").query({ status: "Done" });
    expect(done.body.map((t: { id: string }) => t.id)).toEqual([
      created.body.id,
    ]);
    expect(
      (await request(app).get("/tasks").query({ status: "To Do" })).body,
    ).toEqual([]);
  });

  it("returns 404 for an unknown id and 400 for a malformed one", async () => {
    const missing = await request(app)
      .patch("/tasks/11111111-1111-4111-8111-111111111111")
      .send({ status: "Done" });
    expect(missing.status).toBe(404);

    const bad = await request(app)
      .patch("/tasks/nope")
      .send({ status: "Done" });
    expect(bad.status).toBe(400);
  });
});

describe("DELETE /tasks/:id", () => {
  it("deletes a task, then 404s", async () => {
    const { body } = await request(app).post("/tasks").send({ title: "Temp" });
    expect((await request(app).delete(`/tasks/${body.id}`)).status).toBe(204);
    expect((await request(app).delete(`/tasks/${body.id}`)).status).toBe(404);
  });
});

describe("GET /tasks", () => {
  it("rejects an unknown status filter", async () => {
    const res = await request(app).get("/tasks").query({ status: "Nope" });
    expect(res.status).toBe(400);
  });
});
