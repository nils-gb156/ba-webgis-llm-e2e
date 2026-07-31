// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible and the measurement tool is not active
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const isInfoPanelPressed = await infoPanelToggle.getAttribute('aria-pressed');
  if (isInfoPanelPressed !== 'true') {
    await infoPanelToggle.click();
  }

  // Ensure the measurement tool is not active
  const measurementToggle = page.getByTestId('measurement-toggle');
  const isMeasurementPressed = await measurementToggle.getAttribute('aria-pressed');
  if (isMeasurementPressed === 'true') {
    await measurementToggle.click();
  }

  // Ensure both station layers are checked
  const uvIndexCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations' });
  const eucosCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations' });

  if (!(await uvIndexCheckbox.isChecked())) {
    await uvIndexCheckbox.click();
  }
  if (!(await eucosCheckbox.isChecked())) {
    await eucosCheckbox.click();
  }

  // Wait for layers to load if necessary
  await page.waitForLoadState('networkidle');

  // Click on the map at the specific coordinates
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({
    position: { x: 1188692.84, y: 6767643.28 },
    button: 'left'
  });

  // Wait for the info panel to update with feature information
  const infoPanel = page.getByTestId('info-panel');
  
  // Assert that the UV-Index Station section is visible
  await expect(infoPanel.getByText('UV-Index Station')).toBeVisible();

  // Assert that the EUCOS Ground Station section is visible
  await expect(infoPanel.getByText('EUCOS Ground Station')).toBeVisible();
});
