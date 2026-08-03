// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('networkidle');

  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();

  const uvIndexToggle = page.getByRole('checkbox', { name: 'UV-Index', exact: true });
  await expect(uvIndexToggle).toBeVisible();
  await expect(uvIndexToggle).not.toBeChecked();

  const beforeMapScreenshot = await mapCanvas.screenshot();

  const uvTileRequests: string[] = [];
  page.on('request', request => {
    const url = request.url();
    if ((request.resourceType() === 'image' || /getmap/i.test(url)) && /uv/i.test(url)) {
      uvTileRequests.push(url);
    }
  });

  const uvTileResponsePromise = page.waitForResponse(response => {
    const url = response.url();
    const request = response.request();
    return response.ok() && (request.resourceType() === 'image' || /getmap/i.test(url)) && /uv/i.test(url);
  });

  await uvIndexToggle.click({ force: true });
  await expect(uvIndexToggle).toBeChecked();

  const uvTileResponse = await uvTileResponsePromise;
  expect(uvTileResponse.ok()).toBe(true);
  await expect.poll(() => uvTileRequests.length).toBeGreaterThan(0);

  await expect
    .poll(async () => !(await mapCanvas.screenshot()).equals(beforeMapScreenshot))
    .toBe(true);
});
