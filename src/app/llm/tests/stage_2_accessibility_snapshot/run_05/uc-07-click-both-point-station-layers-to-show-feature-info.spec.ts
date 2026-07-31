// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('UC7: Click both point station layers to show feature info', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure no measurement tool is active (reset state if necessary)
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  const isMeasurementActive = await measurementToggle.getAttribute('aria-pressed');
  if (isMeasurementActive === 'true') {
    await measurementToggle.click({ force: true });
  }

  // Ensure UV-Index Stations layer is checked
  const uviCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations' });
  if (!(await uviCheckbox.isChecked())) {
    await uviCheckbox.click({ force: true });
  }

  // Ensure EUCOS Ground Stations layer is checked
  const eucosCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations' });
  if (!(await eucosCheckbox.isChecked())) {
    await eucosCheckbox.click({ force: true });
  });

  // Click on the map at the specific coordinates where both stations are located
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({
    position: { x: 1188692.84, y: 6767643.28 }
  });

  // Wait for the info panel to load feature information for both layers
  // The info panel is identified by data-testid 'info-panel'
  const infoPanel = page.getByTestId('info-panel');

  // Assert that the UV-Index Station section is visible
  await expect(infoPanel.getByRole('heading', { name: 'UV-Index Station', exact: true })).toBeVisible();

  // Assert that the EUCOS Ground Station section is visible
  await expect(infoPanel.getByRole('heading', { name: 'EUCOS Ground Station', exact: true })).toBeVisible();
});
