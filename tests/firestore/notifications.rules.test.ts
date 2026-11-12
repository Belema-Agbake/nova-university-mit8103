import assert from "node:assert/strict";
import { after, test } from "node:test";
import { readFileSync } from "node:fs";
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { Timestamp, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

let environmentPromise: Promise<RulesTestEnvironment> | undefined;
function environment() {
  return environmentPromise ??= initializeTestEnvironment({
    projectId: "nova-university-89019",
    firestore: { host: "127.0.0.1", port: 8080, rules: readFileSync("firestore.rules", "utf8") },
  });
}

const notification = {
  eventId: "event-rules-1",
  eventType: "REGISTRATION_SUBMITTED",
  recipientUid: "emulator-student-amina",
  title: "Course registration submitted",
  message: "Your registration is awaiting approval.",
  payload: null,
  isRead: false,
  createdAt: Timestamp.now(),
  source: "server",
};

test("recipient can read and mark their server notification as read", async () => {
  const env = await environment();
  await env.withSecurityRulesDisabled(async (context) => setDoc(doc(context.firestore(), "users/emulator-student-amina/notifications/event-rules-1"), notification));
  const context = env.authenticatedContext("emulator-student-amina");
  const ref = doc(context.firestore(), "users/emulator-student-amina/notifications/event-rules-1");
  assert.equal((await assertSucceeds(getDoc(ref))).data()?.title, notification.title);
  await assertSucceeds(updateDoc(ref, { isRead: true, readAt: Timestamp.now() }));
  assert.equal((await assertSucceeds(getDoc(ref))).data()?.isRead, true);
});

test("clients cannot create or access another recipient's activity", async () => {
  const env = await environment();
  const context = env.authenticatedContext("emulator-student-amina");
  const ownActivity = doc(context.firestore(), "users/emulator-student-amina/activity/client-write");
  await assertFails(setDoc(ownActivity, notification));
  const otherActivity = doc(context.firestore(), "users/emulator-lecturer-michael/activity/hidden");
  await assertFails(getDoc(otherActivity));
});

after(async () => (await environmentPromise)?.cleanup());
