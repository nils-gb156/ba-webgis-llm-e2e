// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('UC4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');

  await expect(mapContainer).toBeVisible();
  await expect(layerSwitcherToggle).toBeVisible();

  if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
    await layerSwitcherToggle.click();
  }

  await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'true');
  await expect(layerSwitcher).toBeVisible();

  const uvIndexCheckbox = layerSwitcher.getByRole('checkbox', { name: 'UV-Index', exact: true });

  await expect(uvIndexCheckbox).toBeVisible();
  await expect(uvIndexCheckbox).not.toBeChecked();

  const beforeScreenshot = await mapContainer.screenshot();

  const isUvOverlayTileUrl = (url: string) => {
    const normalizedUrl = url.toLowerCase();
    const hasUvLayerName =
      normalizedUrl.includes('uv-index') ||
      normalizedUrl.includes('uv_index') ||
      normalizedUrl.includes('uvindex') ||
      normalizedUrl.includes('uvi');
    const looksLikeMapTileOrImage =
      normalizedUrl.includes('getmap') ||
      normalizedUrl.includes('request=getmap') ||
      normalizedUrl.includes('service=wms') ||
      normalizedUrl.includes('/tile') ||
      normalizedUrl.includes('/tiles/') ||
      normalizedUrl.includes('format=image/') ||
      normalizedUrl.endsWith('.png') ||
      normalizedUrl.endsWith('.jpg') ||
      normalizedUrl.endsWith('.jpeg') ||
      normalizedUrl.endsWith('.webp');

    return hasUvLayerName && !normalizedUrl.includes('station') && looksLikeMapTileOrImage;
  };

  const uvOverlayRequests: string[] = [];
  const uvOverlayResponses: string[] = [];

  page.on('request', (request) => {
    if (isUvOverlayTileUrl(request.url())) {
      uvOverlayRequests.push(request.url());
    }
  });

  page.on('response', (response) => {
    if (isUvOverlayTileUrl(response.url()) && response.ok()) {
      uvOverlayResponses.push(response.url());
    }
  });

  const uvOverlayResponsePromise = page.waitForResponse((response) => {
    return isUvOverlayTileUrl(response.url()) && response.ok();
  });

  await uvIndexCheckbox.click({ force: true });

  await expect(uvIndexCheckbox).toBeChecked();

  const uvOverlayResponse = await uvOverlayResponsePromise;
  expect(uvOverlayResponse.ok()).toBeTruthy();

  await expect.poll(() => uvOverlayRequests.length).toBeGreaterThan(0);
  await expect.poll(() => uvOverlayResponses.length).toBeGreaterThan(0);

  await expect.poll(async () => {
    const afterScreenshot = await mapContainer.screenshot();
    return afterScreenshot.equals(beforeScreenshot);
  }).toBe(false);
});
