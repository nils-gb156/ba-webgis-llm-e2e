// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Preconditions:
  // - The app is loaded successfully (handled by goto)
  // - The info panel is visible.
  // - The UV-Index Stations layer (WMS) is active.
  // - The EUCOS Ground Stations layer (WFS) is active.
  // - No measurement tool is active.

  // Verify initial state: Info panel visible, layers active, measurement tool not active.
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  const layerSwitcher = page.getByTestId('layer-switcher');
  await expect(layerSwitcher).toBeVisible();

  // Ensure UV-Index Stations layer is checked
  const uviLayerCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations' });
  await expect(uviLayerCheckbox).toBeChecked();

  // Ensure EUCOS Ground Stations layer is checked
  const eucosLayerCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations' });
  await expect(eucosLayerCheckbox).toBeChecked();

  // Ensure Temperature layer is checked (it is active by default in the context)
  const tempLayerCheckbox = page.getByRole('checkbox', { name: 'Temperature' });
  await expect(tempLayerCheckbox).toBeChecked();

  // Ensure Measurement tool is NOT active
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  const measurementIsPressed = await measurementToggle.getAttribute('aria-pressed');
  if (measurementIsPressed === 'true') {
    await measurementToggle.click({ force: true });
  }

  // Step 1: The user clicks at map coordinates [1188692.84, 6767643.28] (EPSG:3857) on the map canvas.
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({
    position: { x: 1188692.84, y: 6767643.28 },
  });

  // Step 2: The user waits for the info panel to load the station info for both layers.
  // Expected results:
  // - The info panel displays a 'UV-Index Station' section with feature information.
  // - The info panel displays an 'EUCOS Ground Station' section with feature information.

  // Wait for the info panel to contain content related to the clicked features.
  // We look for the specific headings that indicate feature info has loaded.
  await expect(page.getByText('UV-Index Station')).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('EUCOS Ground Station')).toBeVisible({ timeout: 10000 });

  // Verify that the info panel is still visible and contains the expected sections.
  await expect(infoPanel).toBeVisible();
});
