import { test, expect } from '@playwright/test';

// This covers the parts of the user loop that don't depend on a live
// Databricks endpoint (onboarding + chrome). Once `vercel dev`/`netlify dev`
// is running alongside `npm run dev`, extend this with a real submission
// flow that asserts on Town Hall health changing.

test('Villager Guide onboards a first-time player, then dismisses', async ({ page }) => {
  await page.goto('/');

  const villager = page.locator('.cc-npc--villager');
  await expect(villager).toBeVisible();
  await expect(villager).toContainText('Villager Guide');

  await villager.getByRole('button', { name: 'Got it' }).click();
  await expect(villager).not.toBeVisible();
});

test('the Town Hall HUD and the action input are both visible on load', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('.cc-hud')).toContainText('Town Hall');
  await expect(page.getByLabel('Describe a real-world action')).toBeVisible();
});
