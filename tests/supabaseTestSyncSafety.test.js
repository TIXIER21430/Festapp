import test from "node:test";
import assert from "node:assert/strict";
import { saveTestSnapshot, sameTestSnapshotData } from "../src/lib/supabaseTestSync.js";
import { FESTAPP_TEST_URL } from "../src/lib/supabaseClient.js";

const testSpace = "d4dbe793-56bb-4dad-a76c-5ac322b1e5b1";

function guardedClient() {
  const calls = [];
  return {
    calls,
    supabaseUrl: FESTAPP_TEST_URL,
    auth: { getUser: async () => ({ data: { user: { id: "test-user" } } }) },
    from(table) { calls.push(table); throw new Error("Unexpected network operation"); }
  };
}

test("TEST persistence rejects missing explicit mode without querying Supabase", async () => {
  const client = guardedClient();
  await assert.rejects(saveTestSnapshot(client, {
    spaceId: testSpace, expectedRevision: 1, payload: { tasks: [] }
  }), /interdite/);
  assert.deepEqual(client.calls, []);
});

test("TEST persistence rejects malformed space IDs before any database write", async () => {
  const client = guardedClient();
  await assert.rejects(saveTestSnapshot(client, {
    spaceId: "production", expectedRevision: 1, payload: {}, testMode: true
  }), /Espace TEST invalide/);
  assert.deepEqual(client.calls, []);
});

test("TEST persistence rejects revisions exceeding safe integer range", async () => {
  const client = guardedClient();
  await assert.rejects(saveTestSnapshot(client, {
    spaceId: testSpace, expectedRevision: Number.MAX_SAFE_INTEGER,
    payload: {}, testMode: true
  }), /Révision invalide/);
  assert.deepEqual(client.calls, []);
});

test("snapshot comparison detects array reordering, additions and deletions", () => {
  const original = { tasks: [{ id: "a" }, { id: "b" }], volunteers: [] };
  assert.equal(sameTestSnapshotData(original, {
    volunteers: [], tasks: [{ id: "a" }, { id: "b" }]
  }), true);
  assert.equal(sameTestSnapshotData(original, {
    tasks: [{ id: "b" }, { id: "a" }], volunteers: []
  }), false);
  assert.equal(sameTestSnapshotData(original, {
    tasks: [{ id: "a" }], volunteers: []
  }), false);
});

test("TEST snapshot refuses JSON values that would be silently lost before writing", async () => {
  const badPayloads = [
    { sales: [{ amount: Number.NaN }] },
    { sales: [{ amount: Infinity }] },
    { sales: [{ amount: undefined }] },
    { sales: [undefined] },
    { sales: [1n] },
    { sales: new Date() },
    { sales: Array(1) }
  ];
  const circular = { sales: [] };
  circular.sales.push(circular);
  badPayloads.push(circular);
  for (const payload of badPayloads) {
    const client = guardedClient();
    await assert.rejects(saveTestSnapshot(client, {
      spaceId: testSpace, expectedRevision: 1, payload, testMode: true
    }), /JSON/);
    assert.deepEqual(client.calls, []);
  }
});

test("TEST snapshot accepts valid JSON and reaches the guarded write", async () => {
  const client = guardedClient();
  await assert.rejects(saveTestSnapshot(client, {
    spaceId: testSpace, expectedRevision: 1,
    payload: { sales: [{ amount: 12.5, label: "Crêpes" }], archived: null },
    testMode: true
  }), /Unexpected network operation/);
  assert.deepEqual(client.calls, ["festapp_snapshots"]);
});
