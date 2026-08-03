// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('UC4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapViewport = page.locator('.ol-viewport').first();
  await expect(mapViewport).toBeVisible();

  let uvIndexToggle = page.getByRole('checkbox', { name: /^UV-Index$/ });
  if ((await uvIndexToggle.count()) === 0) {
    uvIndexToggle = page.getByRole('switch', { name: /^UV-Index$/ });
  }
  if ((await uvIndexToggle.count()) === 0) {
    uvIndexToggle = page.getByRole('checkbox', { name: /UV-Index/i });
  }
  if ((await uvIndexToggle.count()) === 0) {
    uvIndexToggle = page.getByRole('switch', { name: /UV-Index/i });
  }

  await expect(uvIndexToggle).toBeVisible();
  await expect(uvIndexToggle).not.toBeChecked();

  await page.waitForLoadState('networkidle');
  const mapImageBefore = (await mapViewport.screenshot()).toString('base64');

  const uvIndexRequests: string[] = [];
  page.on('request', request => {
    const normalizedUrl = decodeURIComponent(request.url()).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalizedUrl.includes('uvindex')) {
      uvIndexRequests.push(request.url());
    }
  });

  await uvIndexToggle.click({ force: true });
  await expect(uvIndexToggle).toBeChecked();

  await expect.poll(() => uvIndexRequests.length).toBeGreaterThan(0);

  await expect.poll(async () => {
    const currentMapImage = (await mapViewport.screenshot()).toString('base64');
    return currentMapImage === mapImageBefore;
  }).toBe(false);
});
