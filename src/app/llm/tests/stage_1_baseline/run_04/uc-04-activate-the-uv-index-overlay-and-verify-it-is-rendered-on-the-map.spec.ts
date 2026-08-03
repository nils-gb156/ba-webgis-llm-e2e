// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const uvLayerLabel = page.getByText('UV-Index', { exact: true });
  await expect(uvLayerLabel).toBeVisible();

  const uvLayerToggle = page.getByRole('checkbox', { name: 'UV-Index', exact: true });
  await expect(uvLayerToggle).not.toBeChecked();

  const mapViewport = page.locator('.ol-viewport').first();
  await expect(mapViewport).toBeVisible();

  let previousMapImage = await mapViewport.screenshot();
  await expect
    .poll(async () => {
      const currentMapImage = await mapViewport.screenshot();
      const isStable = currentMapImage.equals(previousMapImage);
      previousMapImage = currentMapImage;
      return isStable;
    })
    .toBe(true);

  const baselineMapImage = previousMapImage;

  const tileRequests: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (!url.startsWith('data:') && /(?:GetMap|tiles?|wmts|wms)/i.test(url)) {
      tileRequests.push(url);
    }
  });

  await uvLayerToggle.click({ force: true });
  await expect(uvLayerToggle).toBeChecked();

  await expect.poll(() => tileRequests.length).toBeGreaterThan(0);

  await expect
    .poll(async () => {
      const currentMapImage = await mapViewport.screenshot();
      return currentMapImage.equals(baselineMapImage);
    })
    .toBe(false);
});
