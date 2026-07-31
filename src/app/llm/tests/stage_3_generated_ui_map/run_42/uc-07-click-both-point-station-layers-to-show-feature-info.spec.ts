// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure map is ready and layers are rendered before interacting
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // Ensure measurement tool is not active
  const measurementToggle = page.getByTestId('measurement-toggle');
  const isMeasurementActive = await measurementToggle.getAttribute('aria-pressed');
  if (isMeasurementActive === 'true') {
    await measurementToggle.click();
  }

  // Click on the map at the specific coordinates where both stations are located
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({
    position: { x: 400, y: 300 }, // Approximate position relative to the viewport, adjusted for the specific EPSG coords
    force: true
  });

  // Wait for the feature info to load by checking for the presence of the station sections in the info panel
  // The info panel is expected to contain sections for 'UV-Index Station' and 'EUCOS Ground Station'
  // We look for text content or specific elements related to these stations within the info panel

  // Wait for the info panel to be visible (it should already be visible by default, but ensure it's updated)
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Wait for the UV-Index Station section to appear
  // Assuming the section has a heading or text containing 'UV-Index Station'
  await expect(page.getByText('UV-Index Station', { exact: false })).toBeVisible({ timeout: 10000 });

  // Wait for the EUCOS Ground Station section to appear
  // Assuming the section has a heading or text containing 'EUCOS Ground Station'
  await expect(page.getByText('EUCOS Ground Station', { exact: false })).toBeVisible({ timeout: 10000 });
});
