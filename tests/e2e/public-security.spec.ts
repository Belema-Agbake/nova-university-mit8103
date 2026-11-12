import { expect, test } from "@playwright/test";

test("homepage renders the secure Nova portal", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("NOVA UNIVERSITY")).toBeVisible();
  await expect(page.getByRole("button", { name: /open secure portal/i })).toBeVisible();
});

test("academic API rejects unauthenticated browser requests", async ({ request }) => {
  const response = await request.get("/api/v1/academic");
  expect(response.status()).toBe(401);
  expect(await response.text()).toContain("AUTHENTICATION_REQUIRED");
});

test("administrator result review APIs reject unauthenticated requests", async ({ request }) => {
  expect((await request.get("/api/v1/admin/results")).status()).toBe(401);
  expect((await request.post("/api/v1/admin/results/result_draft", { data: { action: "APPROVE" } })).status()).toBe(401);
});

test("sign-in form is available without exposing academic records", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(page.getByLabel("Email address")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByText("Firebase protects your sign-in")).toBeVisible();
});
