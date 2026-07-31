// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  // Navigate to the base URL
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure no measurement tool is active (reset state if necessary)
  const measurementToggle = page.getByTestId('measurement-toggle');
  const measurementState = await measurementToggle.getAttribute('aria-pressed');
  if (measurementState === 'true') {
    await measurementToggle.click({ force: true });
  }

  // Ensure the info panel is visible
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const infoPanelState = await infoPanelToggle.getAttribute('aria-pressed');
  if (infoPanelState !== 'true') {
    await infoPanelToggle.click({ force: true });
  }

  // Ensure UV-Index Stations layer is active
  const uviCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations' });
  if (!(await uviCheckbox.isChecked())) {
    await uviCheckbox.click({ force: true });
  }

  // Ensure EUCOS Ground Stations layer is active
  const eucosCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations' });
  if (!(await eucosCheckbox.isChecked())) {
    await eucosCheckbox.click({ force: true });
  }

  // Click on the map at the specified coordinates
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({
    position: { x: 1188692.84, y: 6767643.28 },
  });

  // Wait for and verify the info panel displays 'UV-Index Station' section
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel.getByRole('heading', { name: 'UV-Index Station', exact: true })).toBeVisible();

  // Wait for and verify the info panel displays 'EUCOS Ground Station' section
  await expect(infoPanel.getByRole('heading', { name: 'EUCOS Ground Station', exact: true })).toBeVisible();
});
