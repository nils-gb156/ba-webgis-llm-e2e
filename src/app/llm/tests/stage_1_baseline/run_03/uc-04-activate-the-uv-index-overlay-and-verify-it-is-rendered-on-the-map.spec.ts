// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const uvIndexToggle = page.getByRole('checkbox', { name: 'UV-Index', exact: true });
  const mapViewport = page.locator('.ol-viewport');

  await expect(uvIndexToggle).toBeAttached();
  await expect(uvIndexToggle).toBeEnabled();
  await expect(uvIndexToggle).not.toBeChecked();
  await expect(mapViewport).toBeVisible();

  const mapBeforeOverlay = (await mapViewport.screenshot()).toString('base64');

  const layerTileRequests: string[] = [];
  page.on('request', request => {
    const url = request.url();
    const isMapTileRequest =
      request.resourceType() === 'image' ||
      /[?&](request=GetMap|layers=|service=WMS)/i.test(url) ||
      /\/tiles?\//i.test(url);

    if (isMapTileRequest) {
      layerTileRequests.push(url);
    }
  });

  const tileResponsePromise = page.waitForResponse(
    response => {
      const url = response.url();
      return (
        response.ok() &&
        (response.request().resourceType() === 'image' ||
          /[?&](request=GetMap|layers=|service=WMS)/i.test(url) ||
          /\/tiles?\//i.test(url))
      );
    },
    { timeout: 15000 }
  );

  await uvIndexToggle.click({ force: true });

  await expect(uvIndexToggle).toBeChecked();
  await expect.poll(() => layerTileRequests.length, { timeout: 15000 }).toBeGreaterThan(0);
  await tileResponsePromise;

  await expect
    .poll(async () => (await mapViewport.screenshot()).toString('base64'), { timeout: 15000 })
    .not.toBe(mapBeforeOverlay);
});
