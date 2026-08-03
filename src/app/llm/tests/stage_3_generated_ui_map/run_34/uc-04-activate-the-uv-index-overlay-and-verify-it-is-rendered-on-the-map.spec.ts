// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const layerSwitcher = page.getByTestId('layer-switcher');
  const uvIndexToggle = layerSwitcher.getByRole('checkbox', { name: 'UV-Index', exact: true });

  await expect(mapContainer).toBeVisible();
  await expect(layerSwitcher).toBeVisible();
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
  await expect(uvIndexToggle).not.toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(false);

  await page.waitForLoadState('networkidle');

  const layerTileRequestUrls: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (
      (request.resourceType() === 'image' || /GetMap/i.test(url)) &&
      !/GetLegendGraphic/i.test(url)
    ) {
      layerTileRequestUrls.push(url);
    }
  });

  const tileResponsePromise = page.waitForResponse((response) => {
    const url = response.url();
    return (
      response.ok() &&
      (response.request().resourceType() === 'image' || /GetMap/i.test(url)) &&
      !/GetLegendGraphic/i.test(url)
    );
  });

  await uvIndexToggle.click({ force: true });

  await expect(uvIndexToggle).toBeChecked();
  await tileResponsePromise;
  await expect.poll(() => layerTileRequestUrls.length).toBeGreaterThan(0);
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
