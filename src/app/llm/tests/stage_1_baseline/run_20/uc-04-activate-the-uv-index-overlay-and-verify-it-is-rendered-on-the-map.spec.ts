// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({
  page
}) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const uvLayerName = 'UV-Index';
  const uvRequestPattern = /uv(?:[-_\s]|%20)?index/i;
  const uvTileRequests: string[] = [];

  page.on('request', request => {
    const url = decodeURIComponent(request.url());
    if (uvRequestPattern.test(url)) {
      uvTileRequests.push(url);
    }
  });

  const mapViewport = page.locator('.ol-viewport');
  await expect(mapViewport).toBeVisible();

  const uvLayerLabel = page.getByText(uvLayerName, { exact: true });
  await expect(uvLayerLabel).toBeVisible();

  const uvLayerToggle = page.getByRole('checkbox', { name: uvLayerName, exact: true });
  await expect(uvLayerToggle).not.toBeChecked();

  const beforeMapScreenshot = await mapViewport.screenshot();

  const uvTileResponsePromise = page.waitForResponse(response => {
    const url = decodeURIComponent(response.url());
    return uvRequestPattern.test(url) && response.ok();
  });

  await uvLayerToggle.click({ force: true });

  await expect(uvLayerToggle).toBeChecked();

  const uvTileResponse = await uvTileResponsePromise;
  expect(decodeURIComponent(uvTileResponse.url())).toMatch(uvRequestPattern);

  await expect.poll(() => uvTileRequests.length).toBeGreaterThan(0);

  await expect
    .poll(async () => (await mapViewport.screenshot()).equals(beforeMapScreenshot))
    .toBe(false);
});
