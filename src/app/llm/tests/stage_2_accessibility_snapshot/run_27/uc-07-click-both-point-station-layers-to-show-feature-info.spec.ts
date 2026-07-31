// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure no measurement tool is active
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  const measurementState = await measurementToggle.getAttribute('aria-pressed');
  if (measurementState === 'true') {
    await measurementToggle.click();
  }

  // Ensure UV-Index Stations layer is checked
  const uviCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations' });
  if (!(await uviCheckbox.isChecked())) {
    await uviCheckbox.click();
  }

  // Ensure EUCOS Ground Stations layer is checked
  const eucosCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations' });
  if (!(await eucosCheckbox.isChecked())) {
    await eucosCheckbox.click();
  }

  // Ensure info panel is visible
  const infoPanelToggle = page.getByRole('button', { name: 'Info Panel Switcher' });
  const infoPanelState = await infoPanelToggle.getAttribute('aria-pressed');
  if (infoPanelState !== 'true') {
    await infoPanelToggle.click();
  }

  // Click on the map at the specific coordinates where both stations are located
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({
    position: { x: 1188692.84, y: 6767643.28 }
  });

  // Wait for the info panel to load feature information for both layers
  const infoPanel = page.getByTestId('info-panel');

  await expect(infoPanel.getByRole('heading', { name: 'UV-Index Station', exact: true })).toBeVisible();
  await expect(infoPanel.getByRole('heading', { name: 'EUCOS Ground Station', exact: true })).toBeVisible();
});
