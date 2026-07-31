// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered, getHighlightedCoordinate } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: Ensure measurement tool is not active.
  // If the toggle is pressed, click it to deactivate.
  const measurementToggle = page.getByTestId('measurement-toggle');
  const isMeasurementActive = await measurementToggle.evaluate((el) => el.getAttribute('aria-pressed') === 'true');
  if (isMeasurementActive) {
    await measurementToggle.click({ force: true });
  }

  // Precondition: Ensure UV-Index Stations layer is active.
  // It is not visible by default, so we need to open the layer switcher and enable it.
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  const layerSwitcherPanel = page.getByTestId('layer-switcher');
  
  // Check if layer switcher is closed
  const isLayerSwitcherVisible = await layerSwitcherPanel.isVisible();
  if (!isLayerSwitcherVisible) {
    await layerSwitcherToggle.click({ force: true });
  }

  // Enable UV-Index Stations layer if not already enabled
  const uvIndexStationCheckbox = layerSwitcherPanel.getByRole('checkbox', { name: 'UV-Index Stations', exact: true });
  const isUvIndexChecked = await uvIndexStationCheckbox.isChecked();
  if (!isUvIndexChecked) {
    await uvIndexStationCheckbox.click({ force: true });
  }

  // Wait for the UV-Index Stations layer to be rendered on the map
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

  // Close layer switcher if it was open
  if (isLayerSwitcherVisible) {
    await layerSwitcherToggle.click({ force: true });
  }

  // Precondition: EUCOS Ground Stations layer is visible by default and active.
  // Wait for it to be rendered to ensure the map is ready.
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // Step 1: Click at map coordinates [1188692.84, 6767643.28]
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({
    position: { x: 1188692.84, y: 6767643.28 }
  });

  // Step 2: Wait for the info panel to load the station info for both layers.
  // The info panel is visible by default.
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Expected result: The info panel displays a 'UV-Index Station' section.
  // We look for a section or heading containing "UV-Index Station".
  const uvIndexSection = page.getByRole('region', { name: /UV-Index Station/i, exact: false }).first();
  await expect(uvIndexSection).toBeVisible();

  // Expected result: The info panel displays an 'EUCOS Ground Station' section.
  const eucosSection = page.getByRole('region', { name: /EUCOS Ground Station/i, exact: false }).first();
  await expect(eucosSection).toBeVisible();
});
