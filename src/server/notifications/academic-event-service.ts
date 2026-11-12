import { Prisma, AcademicEventStatus } from "@prisma/client";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { firebaseAdminFirestore } from "@/server/authentication/firebase-admin";
import { prisma } from "@/server/database/prisma";

export type AcademicEventInput = {
  eventKey: string;
  eventType: "REGISTRATION_SUBMITTED" | "RESULT_SUBMITTED" | "RESULT_APPROVED" | "RESULT_CHANGES_REQUESTED" | "RESULT_PUBLISHED";
  recipientFirebaseUid: string;
  title: string;
  message: string;
  payload?: Prisma.InputJsonValue;
};

const MAX_DELIVERY_ATTEMPTS = 5;
const PROCESSING_LEASE_MS = 5 * 60_000;

/**
 * PostgreSQL is the source of truth for academic events. This module writes
 * durable outbox rows in the caller's transaction, then delivers idempotent
 * Firestore projections. A lease prevents a crashed worker from blocking an
 * event forever; Firestore document IDs use the stable outbox event ID.
 */

export async function enqueueAcademicEvent(transaction: Prisma.TransactionClient, event: AcademicEventInput) {
  return transaction.academicEventOutbox.upsert({
    where: { eventKey: event.eventKey },
    create: event,
    update: {},
  });
}

function notificationRef(uid: string, id: string) {
  return firebaseAdminFirestore().doc(`users/${uid}/notifications/${id}`);
}

function activityRef(uid: string, id: string) {
  return firebaseAdminFirestore().doc(`users/${uid}/activity/${id}`);
}

type OutboxEvent = { id: string; eventType: string; recipientFirebaseUid: string; title: string; message: string; payload: Prisma.JsonValue | null; createdAt: Date };
export type OutboxDelivery = (event: OutboxEvent) => Promise<void>;

async function processEvent(event: OutboxEvent) {
  const data = {
    eventId: event.id,
    eventType: event.eventType,
    recipientUid: event.recipientFirebaseUid,
    title: event.title,
    message: event.message,
    payload: event.payload ?? null,
    isRead: false,
    createdAt: Timestamp.fromDate(event.createdAt),
    source: "server",
  };
  await Promise.all([
    notificationRef(event.recipientFirebaseUid, event.id).set(data, { merge: true }),
    activityRef(event.recipientFirebaseUid, event.id).set(data, { merge: true }),
  ]);
}

export function retryDelayMilliseconds(attempts: number) {
  // A capped exponential delay avoids hammering Firestore while preserving
  // prompt recovery for transient failures.
  return Math.min(60 * 60_000, 60_000 * 2 ** Math.max(0, attempts - 1));
}

async function releaseExpiredProcessingLeases(now: Date) {
  return prisma.academicEventOutbox.updateMany({
    where: { status: AcademicEventStatus.PROCESSING, processingLeaseUntil: { lt: now } },
    data: {
      status: AcademicEventStatus.FAILED,
      availableAt: now,
      processingLeaseUntil: null,
      lastError: "Processing lease expired before Firestore delivery was confirmed.",
    },
  });
}

async function claimNextEvent(now: Date, recipientFirebaseUid?: string) {
  const candidate = await prisma.academicEventOutbox.findFirst({
    where: {
      ...(recipientFirebaseUid ? { recipientFirebaseUid } : {}),
      status: { in: [AcademicEventStatus.PENDING, AcademicEventStatus.FAILED] },
      availableAt: { lte: now },
      attempts: { lt: MAX_DELIVERY_ATTEMPTS },
    },
    orderBy: [{ availableAt: "asc" }, { createdAt: "asc" }, { id: "asc" }],
  });
  if (!candidate) return null;

  const claimed = await prisma.academicEventOutbox.updateMany({
    where: {
      id: candidate.id,
      status: candidate.status,
      attempts: candidate.attempts,
    },
    data: {
      status: AcademicEventStatus.PROCESSING,
      attempts: { increment: 1 },
      lastAttemptAt: now,
      processingLeaseUntil: new Date(now.getTime() + PROCESSING_LEASE_MS),
    },
  });
  if (claimed.count !== 1) return null;
  return { ...candidate, attempts: candidate.attempts + 1 };
}

export async function processPendingAcademicEvents(
  limit = 25,
  recipientFirebaseUid?: string,
  options: { now?: Date; deliver?: OutboxDelivery } = {},
) {
  let processed = 0;
  const now = options.now ?? new Date();
  const deliver = options.deliver ?? processEvent;
  await releaseExpiredProcessingLeases(now);
  for (let attempt = 0; attempt < limit; attempt += 1) {
      const candidate = await claimNextEvent(now, recipientFirebaseUid);
      if (!candidate) break;
      try {
        await deliver(candidate);
        await prisma.academicEventOutbox.update({
          where: { id: candidate.id },
          data: { status: AcademicEventStatus.PROCESSED, processedAt: new Date(), processingLeaseUntil: null, lastError: null },
        });
        processed += 1;
      } catch (error) {
        const lastError = error instanceof Error ? error.message.slice(0, 500) : "Unknown notification error";
        const exhausted = candidate.attempts >= MAX_DELIVERY_ATTEMPTS;
        await prisma.academicEventOutbox.update({
          where: { id: candidate.id },
          data: exhausted
            ? { status: AcademicEventStatus.DEAD_LETTER, processingLeaseUntil: null, lastError }
            : {
                status: AcademicEventStatus.FAILED,
                availableAt: new Date(now.getTime() + retryDelayMilliseconds(candidate.attempts)),
                processingLeaseUntil: null,
                lastError,
              },
        });
      }
  }
  return processed;
}

export async function listNotificationPage(uid: string, cursor?: string, pageSize = 20) {
  const collection = firebaseAdminFirestore().collection(`users/${uid}/notifications`);
  let query = collection.orderBy("createdAt", "desc").limit(pageSize + 1);
  if (cursor) query = query.startAfter(await collection.doc(cursor).get());
  const snapshot = await query.get();
  const docs = snapshot.docs.slice(0, pageSize);
  return { items: docs.map((doc) => ({ id: doc.id, ...doc.data() })), nextCursor: snapshot.docs.length > pageSize ? docs.at(-1)?.id ?? null : null };
}

export async function listActivityPage(uid: string, cursor?: string, pageSize = 20) {
  const collection = firebaseAdminFirestore().collection(`users/${uid}/activity`);
  let query = collection.orderBy("createdAt", "desc").limit(pageSize + 1);
  if (cursor) query = query.startAfter(await collection.doc(cursor).get());
  const snapshot = await query.get();
  const docs = snapshot.docs.slice(0, pageSize);
  return { items: docs.map((doc) => ({ id: doc.id, ...doc.data() })), nextCursor: snapshot.docs.length > pageSize ? docs.at(-1)?.id ?? null : null };
}

export async function getUnreadNotificationCount(uid: string) {
  const aggregate = await firebaseAdminFirestore().collection(`users/${uid}/notifications`).where("isRead", "==", false).count().get();
  return aggregate.data().count;
}

export async function markNotificationRead(uid: string, notificationId: string) {
  await firebaseAdminFirestore().doc(`users/${uid}/notifications/${notificationId}`).update({ isRead: true, readAt: FieldValue.serverTimestamp() });
}
