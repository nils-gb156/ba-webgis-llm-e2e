// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const uvIndexToggle = page.getByRole('checkbox', { name: /UV-Index/i });
  const mapViewport = page.locator('.ol-viewport').first();

  await expect(uvIndexToggle).toBeVisible();
  await expect(uvIndexToggle).toBeUnchecked();
  await expect(mapViewport).toBeVisible();

  await page.waitForLoadState('networkidle');

  const beforeMapScreenshot = await mapViewport.screenshot();

  const imageRequestsAfterToggle: string[] = [];
  const imageResponsesAfterToggle: Array<{ url: string; status: number }> = [];

  page.on('request', request => {
    if (request.resourceType() === 'image') {
      imageRequestsAfterToggle.push(request.url());
    }
  });

  page.on('response', response => {
    if (response.request().resourceType() === 'image') {
      imageResponsesAfterToggle.push({
        url: response.url(),
        status: response.status()
      });
    }
  });

  await uvIndexToggle.click({ force: true });
  await expect(uvIndexToggle).toBeChecked();

  await expect.poll(() => imageRequestsAfterToggle.length).toBeGreaterThan(0);
  await expect
    .poll(() => imageResponsesAfterToggle.some(response => response.status >= 200 && response.status < 400))
    .toBe(true);

  await expect
    .poll(async () => {
      const currentMapScreenshot = await mapViewport.screenshot();
      return currentMapScreenshot.equals(beforeMapScreenshot);
    })
    .toBe(false);
});
