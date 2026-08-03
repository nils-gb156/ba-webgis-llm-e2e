// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({
  page
}) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcher = page.getByTestId('layer-switcher');
  const mapContainer = page.getByTestId('map-container');
  const uvIndexCheckbox = layerSwitcher.getByRole('checkbox', { name: 'UV-Index', exact: true });

  await expect(layerSwitcher).toBeVisible();
  await expect(mapContainer).toBeVisible();
  await expect(uvIndexCheckbox).toBeVisible();
  await expect(uvIndexCheckbox).not.toBeChecked();

  let previousMapImage = await mapContainer.screenshot();
  await expect
    .poll(async () => {
      const currentMapImage = await mapContainer.screenshot();
      const isStable = previousMapImage.equals(currentMapImage);
      previousMapImage = currentMapImage;
      return isStable;
    })
    .toBe(true);

  const beforeUvIndexImage = previousMapImage;

  const uvIndexTileRequests: string[] = [];
  const isUvIndexOverlayTileRequest = (url: string, resourceType?: string) => {
    const normalizedUrl = url.toLowerCase();
    const isImageRequest = resourceType === undefined || resourceType === 'image';
    const matchesUvIndexLayer =
      /uv[-_ ]?index/.test(normalizedUrl) ||
      /(?:^|[?&=:/._-])uvi(?:$|[?&=:/._-])/.test(normalizedUrl);

    return isImageRequest && matchesUvIndexLayer && !normalizedUrl.includes('stations');
  };

  page.on('request', request => {
    if (isUvIndexOverlayTileRequest(request.url(), request.resourceType())) {
      uvIndexTileRequests.push(request.url());
    }
  });

  const uvIndexTileResponsePromise = page.waitForResponse(response => {
    return (
      isUvIndexOverlayTileRequest(response.url(), response.request().resourceType()) &&
      response.ok()
    );
  });

  await uvIndexCheckbox.click({ force: true });

  await expect(uvIndexCheckbox).toBeChecked();

  await uvIndexTileResponsePromise;

  await expect.poll(() => uvIndexTileRequests.length).toBeGreaterThan(0);

  await expect
    .poll(async () => {
      const currentMapImage = await mapContainer.screenshot();
      return beforeUvIndexImage.equals(currentMapImage);
    })
    .toBe(false);
});
