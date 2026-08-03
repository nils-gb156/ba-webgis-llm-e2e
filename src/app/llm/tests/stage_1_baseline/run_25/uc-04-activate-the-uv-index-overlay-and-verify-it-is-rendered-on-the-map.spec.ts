// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapViewport = page.locator('.ol-viewport').first();
  await expect(mapViewport).toBeVisible();

  let uvToggle = page.getByRole('checkbox', { name: 'UV-Index', exact: true });
  if ((await uvToggle.count()) === 0) {
    uvToggle = page.getByRole('switch', { name: 'UV-Index', exact: true });
  }

  await expect(uvToggle).toBeVisible();
  await expect(uvToggle).not.toBeChecked();

  const beforeMapImage = await mapViewport.screenshot();

  const uvTileRequests: string[] = [];
  const isUvTileRequest = (url: string) => {
    const normalizedUrl = url.toLowerCase();
    return normalizedUrl.includes('uv') && (
      normalizedUrl.includes('getmap') ||
      normalizedUrl.includes('tile') ||
      normalizedUrl.includes('wms') ||
      normalizedUrl.includes('wmts')
    );
  };

  page.on('request', request => {
    if (isUvTileRequest(request.url())) {
      uvTileRequests.push(request.url());
    }
  });

  const uvTileResponsePromise = page.waitForResponse(response => isUvTileRequest(response.url()) && response.ok());

  await uvToggle.click({ force: true });

  await expect(uvToggle).toBeChecked();
  await expect.poll(() => uvTileRequests.length).toBeGreaterThan(0);
  await uvTileResponsePromise;

  await expect.poll(async () => {
    const currentMapImage = await mapViewport.screenshot();
    return currentMapImage.equals(beforeMapImage);
  }).toBe(false);
});
