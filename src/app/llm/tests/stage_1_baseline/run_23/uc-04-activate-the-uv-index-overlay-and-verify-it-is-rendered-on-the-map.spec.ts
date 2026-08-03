// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('networkidle');

  const uvIndexLabel = page.getByText('UV-Index', { exact: true });
  await expect(uvIndexLabel).toBeVisible();

  const uvIndexToggle = page.getByRole('checkbox', { name: /UV-Index/i });
  await expect(uvIndexToggle).not.toBeChecked();

  const mapViewport = page.locator('.ol-viewport').first();
  await expect(mapViewport).toBeVisible();

  const beforeScreenshot = await mapViewport.screenshot();

  const overlayTileRequestUrls: string[] = [];
  const overlayTileResponseUrls: string[] = [];

  page.on('request', request => {
    if (request.resourceType() === 'image') {
      overlayTileRequestUrls.push(request.url());
    }
  });

  page.on('response', response => {
    if (response.request().resourceType() === 'image' && response.ok()) {
      overlayTileResponseUrls.push(response.url());
    }
  });

  await uvIndexToggle.click({ force: true });
  await expect(uvIndexToggle).toBeChecked();

  await expect.poll(() => overlayTileRequestUrls.length > 0).toBe(true);
  await expect.poll(() => overlayTileResponseUrls.length > 0).toBe(true);

  await page.waitForLoadState('networkidle');

  await expect
    .poll(async () => (await mapViewport.screenshot()).equals(beforeScreenshot))
    .toBe(false);
});
