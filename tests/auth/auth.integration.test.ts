import assert from "node:assert/strict";
import { test } from "node:test";

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "demo-api-key";
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "nova-university-89019";
const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? "127.0.0.1:9099";
const baseUrl = `http://${authHost}/identitytoolkit.googleapis.com/v1`;
const accounts = [
  { email: "amina.student@nova.test", password: "NovaStudent!2026" },
  { email: "michael.lecturer@nova.test", password: "NovaLecturer!2026" },
  { email: "ada.administrator@nova.test", password: "NovaAdmin!2026" },
];

async function signIn(account: (typeof accounts)[number]) {
  const response = await fetch(`${baseUrl}/accounts:signInWithPassword?key=${apiKey}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...account, returnSecureToken: true }),
  });
  const body = await response.text();
  assert.equal(response.ok, true, body);
  return JSON.parse(body) as { idToken: string; refreshToken: string; localId: string; expiresIn: string };
}

test("fictional student, lecturer and administrator accounts can authenticate", async () => {
  const sessions = await Promise.all(accounts.map(signIn));
  assert.equal(new Set(sessions.map((session) => session.localId)).size, 3);
  for (const session of sessions) {
    assert.ok(session.idToken);
    assert.ok(session.refreshToken);
    assert.equal(session.expiresIn, "3600");
  }
});

test("refresh tokens issue a replacement ID token", async () => {
  const session = await signIn(accounts[0]);
  const response = await fetch(`http://${authHost}/securetoken.googleapis.com/v1/token?key=${apiKey}`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: session.refreshToken }),
  });
  const body = await response.text();
  assert.equal(response.ok, true, body);
  const refreshed = JSON.parse(body) as { id_token: string; refresh_token: string; user_id: string };
  assert.ok(refreshed.id_token);
  assert.ok(refreshed.refresh_token);
  assert.equal(refreshed.user_id, session.localId);
});

test("wrong credentials are rejected", async () => {
  const response = await fetch(`${baseUrl}/accounts:signInWithPassword?key=${apiKey}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: accounts[0].email, password: "wrong-password", returnSecureToken: true }),
  });
  assert.equal(response.ok, false);
  const body = await response.json() as { error?: { message?: string } };
  assert.match(body.error?.message ?? "", /INVALID_PASSWORD|INVALID_LOGIN_CREDENTIALS/);
});

console.log(`Auth emulator integration tests target project ${projectId}.`);
