// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcher = page.getByTestId('layer-switcher');
  const mapContainer = page.getByTestId('map-container');
  const uvIndexToggle = page.getByRole('checkbox', { name: 'UV-Index', exact: true });

  await expect(layerSwitcher).toBeVisible();
  await expect(mapContainer).toBeVisible();
  await expect(uvIndexToggle).not.toBeChecked();

  const mapBox = await mapContainer.boundingBox();
  expect(mapBox).not.toBeNull();
  if (!mapBox) {
    throw new Error('Map container has no bounding box.');
  }

  const patchWidth = Math.min(200, Math.floor(mapBox.width));
  const patchHeight = Math.min(200, Math.floor(mapBox.height));
  const mapClip = {
    x: Math.floor(mapBox.x + (mapBox.width - patchWidth) / 2),
    y: Math.floor(mapBox.y + (mapBox.height - patchHeight) / 2),
    width: patchWidth,
    height: patchHeight
  };

  const beforeMapPatch = await page.screenshot({ clip: mapClip });

  const uvIndexRequests: string[] = [];
  const isUvIndexLayerRequest = (url: string, resourceType: string): boolean => {
    const looksLikeMapTileOrWms =
      resourceType === 'image' ||
      /[?&](request=GetMap|service=WMS|service=WMTS|layers=)/i.test(url) ||
      /\.(png|jpe?g|webp)(\?|$)/i.test(url);
    const mentionsUvIndex = /(uv-?index|uvindex|uvi)(?:[^\w]|$)/i.test(url);
    return looksLikeMapTileOrWms && mentionsUvIndex;
  };

  page.on('request', (request) => {
    if (isUvIndexLayerRequest(request.url(), request.resourceType())) {
      uvIndexRequests.push(request.url());
    }
  });

  const uvIndexResponsePromise = page.waitForResponse((response) => {
    return isUvIndexLayerRequest(response.url(), response.request().resourceType()) && response.ok();
  });

  await uvIndexToggle.click({ force: true });

  await expect(uvIndexToggle).toBeChecked();
  await expect.poll(() => uvIndexRequests.length).toBeGreaterThan(0);

  const uvIndexResponse = await uvIndexResponsePromise;
  expect(uvIndexResponse.ok()).toBeTruthy();

  await expect
    .poll(async () => {
      const afterMapPatch = await page.screenshot({ clip: mapClip });
      return !beforeMapPatch.equals(afterMapPatch);
    })
    .toBe(true);
});
