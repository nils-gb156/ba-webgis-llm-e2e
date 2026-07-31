// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  // Precondition: The app is loaded successfully.
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: No measurement tool is active.
  // The accessibility tree shows the Measurement button is not pressed.
  // We ensure it is not active by asserting its state, but no click needed if already inactive.
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  await expect(measurementToggle).not.toBeChecked();

  // Precondition: The info panel is visible.
  // The accessibility tree shows "Info Panel Switcher" is pressed, implying the panel is open.
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Precondition: The UV-Index Stations layer is active.
  // Precondition: The EUCOS Ground Stations layer is active.
  // The accessibility tree shows both checkboxes are checked.
  const uvIndexCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations' });
  const eucosCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations' });
  await expect(uvIndexCheckbox).toBeChecked();
  await expect(eucosCheckbox).toBeChecked();

  // Step 1: The user clicks at map coordinates [1188692.84, 6767643.28] (EPSG:3857) on the map canvas.
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({
    position: { x: 1188692.84, y: 6767643.28 },
  });

  // Step 2: The user waits for the info panel to load the station info for both layers.
  // Expected results:
  // - The info panel displays a 'UV-Index Station' section with feature information.
  // - The info panel displays an 'EUCOS Ground Station' section with feature information.

  // We poll the info panel content to wait for the asynchronous feature info to load.
  await expect
    .poll(async () => {
      const panelContent = await page.getByTestId('info-panel').textContent();
      return panelContent;
    })
    .toContain('UV-Index Station');

  await expect
    .poll(async () => {
      const panelContent = await page.getByTestId('info-panel').textContent();
      return panelContent;
    })
    .toContain('EUCOS Ground Station');
});
