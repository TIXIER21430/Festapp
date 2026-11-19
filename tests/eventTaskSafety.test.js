import test from "node:test";
import assert from "node:assert/strict";
import { tasksForManifestation, setTaskCompleted } from "../src/lib/eventTaskSafety.js";

const tasks = Object.freeze([
  Object.freeze({ id: "task-1", manifestationId: "fanfare-2027", title: "Préparer la buvette", completed: false }),
  Object.freeze({ id: "task-2", manifestationId: "noel-2027", title: "Installer les stands", completed: false }),
]);
test("tasks are isolated by stable manifestation id, not display name", () => {
  assert.deepEqual(tasksForManifestation(tasks, "fanfare-2027").map((t) => t.id), ["task-1"]);
  assert.deepEqual(tasksForManifestation(tasks, "noel-2027").map((t) => t.id), ["task-2"]);
});
test("completion changes only the selected task and leaves source immutable", () => {
  const result = setTaskCompleted(tasks, "fanfare-2027", "task-1", true);
  assert.equal(result[0].completed, true);
  assert.equal(result[1].completed, false);
  assert.equal(tasks[0].completed, false);
  assert.notStrictEqual(result[0], tasks[0]);
});
test("cross-manifestation updates and missing tasks fail closed", () => {
  assert.throws(() => setTaskCompleted(tasks, "noel-2027", "task-1", true), RangeError);
  assert.throws(() => setTaskCompleted(tasks, "fanfare-2027", "missing", true), RangeError);
});
test("invalid ids, duplicate task ids and nonboolean values are rejected", () => {
  assert.throws(() => tasksForManifestation(tasks, ""), TypeError);
  assert.throws(() => setTaskCompleted(tasks, "fanfare-2027", "task-1", "yes"), TypeError);
  assert.throws(() => tasksForManifestation([...tasks, tasks[0]], "fanfare-2027"), RangeError);
  assert.throws(() => tasksForManifestation([{ id: "t", manifestationId: "" }], "fanfare-2027"), TypeError);
});
