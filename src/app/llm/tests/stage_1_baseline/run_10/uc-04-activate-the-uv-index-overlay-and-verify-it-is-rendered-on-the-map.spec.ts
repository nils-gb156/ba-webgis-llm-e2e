// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const uvIndexToggle = page.getByRole('checkbox', { name: 'UV-Index', exact: true });
  await expect(uvIndexToggle).toBeVisible();
  await expect(uvIndexToggle).not.toBeChecked();

  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();

  const beforeOverlayScreenshot = await mapCanvas.screenshot();

  const uvIndexRequestUrls: string[] = [];
  const uvIndexResponseUrls: string[] = [];
  const uvIndexUrlPattern = /(uv[^/]*index|uvi)/i;

  page.on('request', request => {
    const url = decodeURIComponent(request.url());
    if (uvIndexUrlPattern.test(url)) {
      uvIndexRequestUrls.push(url);
    }
  });

  page.on('response', response => {
    const url = decodeURIComponent(response.url());
    if (response.ok() && uvIndexUrlPattern.test(url)) {
      uvIndexResponseUrls.push(url);
    }
  });

  await uvIndexToggle.click({ force: true });
  await expect(uvIndexToggle).toBeChecked();

  await expect.poll(() => uvIndexRequestUrls.length).toBeGreaterThan(0);
  await expect.poll(() => uvIndexResponseUrls.length).toBeGreaterThan(0);

  await expect.poll(async () => {
    const afterOverlayScreenshot = await mapCanvas.screenshot();
    return !afterOverlayScreenshot.equals(beforeOverlayScreenshot);
  }).toBe(true);
});
