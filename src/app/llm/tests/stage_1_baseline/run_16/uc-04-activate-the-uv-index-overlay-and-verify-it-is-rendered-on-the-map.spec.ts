// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('networkidle');

  const uvIndexToggle = page.getByRole('checkbox', { name: 'UV-Index', exact: true });
  await expect(uvIndexToggle).toBeVisible();
  await expect(uvIndexToggle).not.toBeChecked();

  const mapViewport = page.locator('.ol-viewport').first();
  await expect(mapViewport).toBeVisible();
  const mapBefore = (await mapViewport.screenshot()).toString('base64');

  const tileRequests: string[] = [];
  page.on('request', request => {
    const url = request.url();
    if (
      request.resourceType() === 'image' ||
      /[?&]request=GetMap\b/i.test(url) ||
      /[?&]service=WMS\b/i.test(url) ||
      /\/tile\//i.test(url)
    ) {
      tileRequests.push(url);
    }
  });

  await uvIndexToggle.click({ force: true });
  await expect(uvIndexToggle).toBeChecked();

  await expect.poll(() => tileRequests.length, { timeout: 15000 }).toBeGreaterThan(0);

  await expect
    .poll(async () => (await mapViewport.screenshot()).toString('base64') !== mapBefore, { timeout: 15000 })
    .toBe(true);
});
