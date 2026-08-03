// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcher = page.getByTestId('layer-switcher');
  if (!(await layerSwitcher.isVisible())) {
    await page.getByTestId('layer-switcher-toggle').click();
  }
  await expect(layerSwitcher).toBeVisible();

  const mapContainer = page.getByTestId('map-container');
  await expect(mapContainer).toBeVisible();

  const uvIndexToggle = layerSwitcher.getByRole('checkbox', { name: 'UV-Index', exact: true });
  await expect(uvIndexToggle).not.toBeChecked();

  const beforeUvIndexOverlay = await mapContainer.screenshot();

  const imageTileRequests: Array<{ url: string; timestamp: number }> = [];
  page.on('request', (request) => {
    if (request.resourceType() === 'image') {
      imageTileRequests.push({ url: request.url(), timestamp: Date.now() });
    }
  });

  const imageTileResponsePromise = page.waitForResponse(
    (response) => response.request().resourceType() === 'image' && response.ok()
  );

  const toggleTimestamp = Date.now();
  await uvIndexToggle.click({ force: true });

  await expect(uvIndexToggle).toBeChecked();

  await expect
    .poll(() => imageTileRequests.filter((request) => request.timestamp >= toggleTimestamp).length)
    .toBeGreaterThan(0);

  await imageTileResponsePromise;

  await expect
    .poll(async () => {
      const afterUvIndexOverlay = await mapContainer.screenshot();
      return !afterUvIndexOverlay.equals(beforeUvIndexOverlay);
    })
    .toBe(true);
});
