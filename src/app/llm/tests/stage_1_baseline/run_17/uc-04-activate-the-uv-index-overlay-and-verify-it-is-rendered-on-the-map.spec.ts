// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const uvIndexLabel = page.getByText('UV-Index', { exact: true });
  const uvIndexToggle = page.getByRole('checkbox', { name: 'UV-Index', exact: true });
  const mapViewport = page.locator('.ol-viewport').first();

  await expect(uvIndexLabel).toBeVisible();
  await expect(mapViewport).toBeVisible();
  await expect(uvIndexToggle).not.toBeChecked();

  const beforeToggleScreenshot = await mapViewport.screenshot();

  const uvLayerTileRequests: string[] = [];
  page.on('request', request => {
    const rawUrl = request.url();
    let decodedUrl = rawUrl;
    try {
      decodedUrl = decodeURIComponent(rawUrl);
    } catch {
      decodedUrl = rawUrl;
    }

    const urlText = `${rawUrl} ${decodedUrl}`;
    const isUvLayerRequest = /(uv(?:[-_\s]?index)|\buvi\b)/i.test(urlText);
    const isTileRequest =
      request.resourceType() === 'image' || /GetMap|GetTile|\/tiles?\//i.test(urlText);

    if (isUvLayerRequest && isTileRequest) {
      uvLayerTileRequests.push(rawUrl);
    }
  });

  await uvIndexToggle.click({ force: true });

  await expect(uvIndexToggle).toBeChecked();
  await expect.poll(() => uvLayerTileRequests.length).toBeGreaterThan(0);

  await expect.poll(async () => {
    const currentScreenshot = await mapViewport.screenshot();
    return currentScreenshot.equals(beforeToggleScreenshot);
  }).toBe(false);
});
