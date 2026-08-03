// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');

  const uvIndexLabel = page.getByText('UV-Index', { exact: true });
  const uvIndexToggle = page.getByRole('checkbox', { name: 'UV-Index', exact: true });
  const mapViewport = page.locator('.ol-viewport').first();

  await expect(uvIndexLabel).toBeVisible();
  await expect(mapViewport).toBeVisible();
  await expect(uvIndexToggle).not.toBeChecked();

  const beforeMapScreenshot = await mapViewport.screenshot();

  const tileRequestUrls: string[] = [];
  page.on('request', request => {
    if (request.resourceType() === 'image') {
      tileRequestUrls.push(request.url());
    }
  });

  const tileResponsePromise = page.waitForResponse(
    response => response.request().resourceType() === 'image' && response.ok()
  );

  await uvIndexToggle.click({ force: true });

  await expect(uvIndexToggle).toBeChecked();
  await tileResponsePromise;
  await expect.poll(() => tileRequestUrls.length).toBeGreaterThan(0);

  await expect
    .poll(async () => {
      const afterMapScreenshot = await mapViewport.screenshot();
      return afterMapScreenshot.equals(beforeMapScreenshot);
    })
    .toBe(false);
});
