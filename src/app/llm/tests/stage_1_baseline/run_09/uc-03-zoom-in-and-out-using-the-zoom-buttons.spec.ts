// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const zoomInButton = page.getByRole('button', { name: 'Zoom in', exact: true });
  const zoomOutButton = page.getByRole('button', { name: 'Zoom out', exact: true });
  const mapCanvas = page.locator('canvas:visible').first();

  await expect(zoomInButton).toBeVisible();
  await expect(zoomOutButton).toBeVisible();
  await expect(mapCanvas).toBeVisible();

  await page.waitForLoadState('networkidle');

  const initialMapImage = (await mapCanvas.screenshot()).toString('base64');

  await zoomInButton.click();

  await expect
    .poll(async () => (await mapCanvas.screenshot()).toString('base64'), { timeout: 15000 })
    .not.toBe(initialMapImage);

  const zoomedInMapImage = (await mapCanvas.screenshot()).toString('base64');

  await zoomOutButton.click();

  await expect
    .poll(async () => (await mapCanvas.screenshot()).toString('base64'), { timeout: 15000 })
    .not.toBe(zoomedInMapImage);

  await expect
    .poll(async () => (await mapCanvas.screenshot()).toString('base64'), { timeout: 15000 })
    .toBe(initialMapImage);
});
