// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('networkidle');

  const uvIndexToggle = page.getByRole('checkbox', { name: 'UV-Index', exact: true });
  const mapViewport = page.locator('.ol-viewport').first();

  await expect(uvIndexToggle).toBeVisible();
  await expect(mapViewport).toBeVisible();
  await expect(uvIndexToggle).not.toBeChecked();

  const mapBefore = await mapViewport.screenshot();

  const imageRequests: string[] = [];
  page.on('request', (request) => {
    if (request.resourceType() === 'image') {
      imageRequests.push(request.url());
    }
  });

  const tileResponsePromise = page.waitForResponse(
    (response) => response.request().resourceType() === 'image' && response.ok(),
    { timeout: 15000 }
  );

  await uvIndexToggle.click({ force: true });
  await expect(uvIndexToggle).toBeChecked();

  await tileResponsePromise;

  await expect.poll(() => imageRequests.length).toBeGreaterThan(0);
  await expect.poll(async () => (await mapViewport.screenshot()).equals(mapBefore)).toBe(false);
});
