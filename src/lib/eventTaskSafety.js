// Pure, additive helpers for future durable task storage. No network or database writes.
const validId = (value) => typeof value === "string" && value.trim() === value && value.length > 0 && value.length <= 128;
const assertId = (value, label) => {
  if (!validId(value)) throw new TypeError(`Invalid ${label}`);
};
const assertTasks = (tasks) => {
  if (!Array.isArray(tasks)) throw new TypeError("Tasks must be an array");
  const ids = new Set();
  for (const task of tasks) {
    if (!task || typeof task !== "object" || Array.isArray(task)) throw new TypeError("Invalid task");
    assertId(task.id, "task id");
    assertId(task.manifestationId, "manifestation id");
    if (ids.has(task.id)) throw new RangeError("Duplicate task id");
    ids.add(task.id);
  }
};
export function tasksForManifestation(tasks, manifestationId) {
  assertId(manifestationId, "manifestation id");
  assertTasks(tasks);
  return tasks.filter((task) => task.manifestationId === manifestationId).map((task) => ({ ...task }));
}
export function setTaskCompleted(tasks, manifestationId, taskId, completed) {
  assertId(manifestationId, "manifestation id");
  assertId(taskId, "task id");
  if (typeof completed !== "boolean") throw new TypeError("Completed must be boolean");
  assertTasks(tasks);
  const index = tasks.findIndex((task) => task.id === taskId);
  if (index === -1) throw new RangeError("Unknown task");
  if (tasks[index].manifestationId !== manifestationId) throw new RangeError("Task belongs to another manifestation");
  return tasks.map((task, i) => i === index ? { ...task, completed } : { ...task });
}
