import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { AcademicEventStatus } from '@prisma/client';
import { firebaseAdminFirestore } from '@/server/authentication/firebase-admin';
import { prisma } from '@/server/database/prisma';
import { processPendingAcademicEvents, retryDelayMilliseconds } from '@/server/notifications/academic-event-service';

const recipientUid = 'outbox-test-recipient';
const baseTime = new Date('2026-11-12T12:00:00.000Z');
let sequence = 0;

async function createEvent(overrides: Partial<{ status: AcademicEventStatus; attempts: number; availableAt: Date; processingLeaseUntil: Date | null }> = {}) {
  sequence += 1;
  return prisma.academicEventOutbox.create({
    data: {
      eventKey: `outbox-test-${sequence}`,
      eventType: 'RESULT_PUBLISHED',
      recipientFirebaseUid: recipientUid,
      title: 'Test result published',
      message: 'A test event for durable delivery evidence.',
      status: overrides.status ?? AcademicEventStatus.PENDING,
      attempts: overrides.attempts ?? 0,
      availableAt: overrides.availableAt ?? baseTime,
      processingLeaseUntil: overrides.processingLeaseUntil,
    },
  });
}

async function deleteFirestoreEvent(id: string) {
  await Promise.all([
    firebaseAdminFirestore().doc(`users/${recipientUid}/notifications/${id}`).delete().catch(() => undefined),
    firebaseAdminFirestore().doc(`users/${recipientUid}/activity/${id}`).delete().catch(() => undefined),
  ]);
}

beforeEach(async () => {
  sequence = 0;
  await prisma.academicEventOutbox.deleteMany({ where: { eventKey: { startsWith: 'outbox-test-' } } });
});

afterEach(async () => {
  const events = await prisma.academicEventOutbox.findMany({ where: { eventKey: { startsWith: 'outbox-test-' } }, select: { id: true } });
  await Promise.all(events.map((event) => deleteFirestoreEvent(event.id)));
  await prisma.academicEventOutbox.deleteMany({ where: { eventKey: { startsWith: 'outbox-test-' } } });
});

test('delivers an idempotent notification and activity projection through Firestore Emulator', async () => {
  const event = await createEvent();
  assert.equal(await processPendingAcademicEvents(1, recipientUid, { now: baseTime }), 1);
  const [notification, activity, stored] = await Promise.all([
    firebaseAdminFirestore().doc(`users/${recipientUid}/notifications/${event.id}`).get(),
    firebaseAdminFirestore().doc(`users/${recipientUid}/activity/${event.id}`).get(),
    prisma.academicEventOutbox.findUniqueOrThrow({ where: { id: event.id } }),
  ]);
  assert.equal(stored.status, AcademicEventStatus.PROCESSED, stored.lastError ?? 'outbox event was not processed');
  assert.equal(notification.exists, true, stored.lastError ?? 'notification projection was not created');
  assert.equal(activity.exists, true, stored.lastError ?? 'activity projection was not created');
});

test('records a retry with exponential backoff after a delivery failure', async () => {
  const event = await createEvent();
  await processPendingAcademicEvents(1, recipientUid, { now: baseTime, deliver: async () => { throw new Error('temporary Firestore outage'); } });
  const stored = await prisma.academicEventOutbox.findUniqueOrThrow({ where: { id: event.id } });
  assert.equal(stored.status, AcademicEventStatus.FAILED);
  assert.equal(stored.attempts, 1);
  assert.equal(stored.availableAt.getTime(), baseTime.getTime() + retryDelayMilliseconds(1));
  assert.match(stored.lastError ?? '', /temporary Firestore outage/);
});

test('moves an event to dead letter after the maximum failed delivery attempts', async () => {
  const event = await createEvent();
  let now = baseTime;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    await processPendingAcademicEvents(1, recipientUid, { now, deliver: async () => { throw new Error('persistent Firestore outage'); } });
    now = new Date(now.getTime() + retryDelayMilliseconds(attempt));
  }
  const stored = await prisma.academicEventOutbox.findUniqueOrThrow({ where: { id: event.id } });
  assert.equal(stored.status, AcademicEventStatus.DEAD_LETTER);
  assert.equal(stored.attempts, 5);
});

test('returns expired processing leases to the retry queue', async () => {
  const event = await createEvent({ status: AcademicEventStatus.PROCESSING, attempts: 1, processingLeaseUntil: new Date(baseTime.getTime() - 1) });
  await processPendingAcademicEvents(0, recipientUid, { now: baseTime });
  const stored = await prisma.academicEventOutbox.findUniqueOrThrow({ where: { id: event.id } });
  assert.equal(stored.status, AcademicEventStatus.FAILED);
  assert.equal(stored.processingLeaseUntil, null);
  assert.match(stored.lastError ?? '', /lease expired/i);
});

test('two workers claim a pending event at most once', async () => {
  const event = await createEvent();
  let deliveries = 0;
  const deliver = async () => { deliveries += 1; await new Promise((resolve) => setTimeout(resolve, 25)); };
  const [first, second] = await Promise.all([
    processPendingAcademicEvents(1, recipientUid, { now: baseTime, deliver }),
    processPendingAcademicEvents(1, recipientUid, { now: baseTime, deliver }),
  ]);
  const stored = await prisma.academicEventOutbox.findUniqueOrThrow({ where: { id: event.id } });
  assert.equal(first + second, 1);
  assert.equal(deliveries, 1);
  assert.equal(stored.status, AcademicEventStatus.PROCESSED);
});
