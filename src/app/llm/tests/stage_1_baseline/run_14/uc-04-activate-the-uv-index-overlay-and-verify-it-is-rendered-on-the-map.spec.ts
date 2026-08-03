// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('networkidle');

  const uvIndexToggle = page.getByRole('checkbox', { name: 'UV-Index', exact: true });
  await expect(uvIndexToggle).toBeVisible();
  await expect(uvIndexToggle).not.toBeChecked();

  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();
  const beforeToggleScreenshot = await mapCanvas.screenshot();

  const tileRequestUrls: string[] = [];
  const isMapTileRequest = (url: string, resourceType?: string) => {
    return (
      /request=getmap/i.test(url) ||
      /[?&](bbox|width|height)=/i.test(url) ||
      /\/tiles?\//i.test(url) ||
      /\/\d+\/\d+\/\d+(?:\.\w+)?(?:\?|$)/i.test(url) ||
      (resourceType === 'image' && /[?&](x|y|z)=/i.test(url))
    );
  };

  page.on('request', (request) => {
    const url = request.url();
    if (isMapTileRequest(url, request.resourceType())) {
      tileRequestUrls.push(url);
    }
  });

  const tileResponsePromise = page.waitForResponse((response) => {
    const request = response.request();
    return response.ok() && isMapTileRequest(request.url(), request.resourceType());
  });

  await uvIndexToggle.click({ force: true });
  await expect(uvIndexToggle).toBeChecked();

  await tileResponsePromise;
  await expect.poll(() => tileRequestUrls.length).toBeGreaterThan(0);

  await expect.poll(async () => {
    const afterToggleScreenshot = await mapCanvas.screenshot();
    return !afterToggleScreenshot.equals(beforeToggleScreenshot);
  }).toBe(true);
});
