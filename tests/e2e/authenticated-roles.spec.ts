import { expect, test } from '@playwright/test';

const accounts = {
  student: { email: 'amina.student@nova.test', password: 'NovaStudent!2026', destination: /\/student\/dashboard/, heading: 'Student dashboard' },
  lecturer: { email: 'michael.lecturer@nova.test', password: 'NovaLecturer!2026', destination: /\/staff\/dashboard/, heading: 'Staff dashboard' },
  administrator: { email: 'ada.administrator@nova.test', password: 'NovaAdmin!2026', destination: /\/admin\/dashboard/, heading: 'Administrator dashboard' },
};

for (const [role, account] of Object.entries(accounts)) {
  test(`${role} can sign in and reach only the authorised dashboard`, async ({ page }) => {
    await page.goto('/sign-in');
    await page.getByLabel('Email address').fill(account.email);
    await page.getByLabel('Password').fill(account.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL(account.destination);
    await expect(page.getByRole('heading', { name: account.heading })).toBeVisible();
  });
}
