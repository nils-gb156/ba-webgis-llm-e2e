// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const uvIndexRequestUrls: string[] = [];
  page.on('request', request => {
    const url = decodeURIComponent(request.url());
    const resourceType = request.resourceType();

    if (/uv[-_ ]?index|uvi/i.test(url) && ['image', 'fetch', 'xhr'].includes(resourceType)) {
      uvIndexRequestUrls.push(url);
    }
  });

  const mapViewport = page.locator('.ol-viewport');
  await expect(mapViewport).toBeVisible();

  const uvIndexToggle = page.getByRole('checkbox', { name: /UV-Index/i });
  await expect(uvIndexToggle).toBeVisible();
  await expect(uvIndexToggle).not.toBeChecked();

  const beforeMapImage = await mapViewport.screenshot();

  await uvIndexToggle.click({ force: true });
  await expect(uvIndexToggle).toBeChecked();

  await expect.poll(() => uvIndexRequestUrls.length, { timeout: 15000 }).toBeGreaterThan(0);

  await expect
    .poll(async () => {
      const afterMapImage = await mapViewport.screenshot();
      return afterMapImage.equals(beforeMapImage);
    }, { timeout: 15000 })
    .toBe(false);
});
