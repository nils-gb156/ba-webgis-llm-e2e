// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure no measurement tool is active (precondition)
  const measurementToggle = page.getByTestId('measurement-toggle');
  const isMeasurementActive = await measurementToggle.getAttribute('aria-pressed');
  if (isMeasurementActive === 'true') {
    await measurementToggle.click();
  }

  // Ensure UV-Index Stations layer is active (precondition)
  const uviLayerCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations' });
  if (!(await uviLayerCheckbox.isChecked())) {
    await uviLayerCheckbox.click({ force: true });
  }

  // Ensure EUCOS Ground Stations layer is active (precondition)
  const eucosLayerCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations' });
  if (!(await eucosLayerCheckbox.isChecked())) {
    await eucosLayerCheckbox.click({ force: true });
  }

  // Ensure info panel is visible (precondition)
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const isInfoPanelPressed = await infoPanelToggle.getAttribute('aria-pressed');
  if (isInfoPanelPressed !== 'true') {
    await infoPanelToggle.click();
  }

  // Click on the map at the specified coordinates
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({
    position: { x: 1188692.84, y: 6767643.28 }
  });

  // Wait for the info panel to load feature information for both layers
  const infoPanel = page.getByTestId('info-panel');

  // Assert that UV-Index Station section is visible
  await expect(infoPanel.getByRole('heading', { name: 'UV-Index Station', exact: true })).toBeVisible();

  // Assert that EUCOS Ground Station section is visible
  await expect(infoPanel.getByRole('heading', { name: 'EUCOS Ground Station', exact: true })).toBeVisible();
});
