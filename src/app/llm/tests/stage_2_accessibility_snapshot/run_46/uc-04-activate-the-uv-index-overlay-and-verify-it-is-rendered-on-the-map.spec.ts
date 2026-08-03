// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');

  await expect(mapContainer).toBeVisible();

  if (!(await layerSwitcher.isVisible())) {
    const pressed = await layerSwitcherToggle.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await layerSwitcherToggle.click();
    }
  }
  await expect(layerSwitcher).toBeVisible();

  const uvIndexCheckbox = layerSwitcher.getByRole('checkbox', { name: 'UV-Index', exact: true });
  await expect(uvIndexCheckbox).toBeVisible();
  await expect(uvIndexCheckbox).not.toBeChecked();

  await page.waitForLoadState('networkidle');
  const mapBefore = await mapContainer.screenshot();

  const uvIndexRequests: string[] = [];
  page.on('request', request => {
    if (/(?:uv[\W_]?index|uvi)/i.test(request.url())) {
      uvIndexRequests.push(request.url());
    }
  });

  const uvIndexTileResponsePromise = page.waitForResponse(response => {
    return response.request().method() === 'GET' &&
      response.ok() &&
      /(?:uv[\W_]?index|uvi)/i.test(response.url());
  });

  await uvIndexCheckbox.click({ force: true });
  await expect(uvIndexCheckbox).toBeChecked();

  await uvIndexTileResponsePromise;
  await expect.poll(() => uvIndexRequests.length).toBeGreaterThan(0);

  await expect.poll(async () => {
    const mapAfter = await mapContainer.screenshot();
    return mapAfter.equals(mapBefore);
  }).toBe(false);
});
