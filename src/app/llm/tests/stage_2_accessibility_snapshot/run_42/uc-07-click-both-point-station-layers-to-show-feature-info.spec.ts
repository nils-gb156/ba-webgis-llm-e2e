// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible and the measurement tool is not active
  const infoPanelToggle = page.getByRole('button', { name: 'Info Panel Switcher' });
  const isInfoPanelPressed = await infoPanelToggle.getAttribute('aria-pressed');
  if (isInfoPanelPressed !== 'true') {
    await infoPanelToggle.click({ force: true });
  }

  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  const isMeasurementPressed = await measurementToggle.getAttribute('aria-pressed');
  if (isMeasurementPressed === 'true') {
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
  }

  // Click on the map at the specified coordinates
  await page.locator('#map-container').click({
    position: { x: 1188692.84, y: 6767643.28 }
  });

  // Wait for the info panel to load feature information for both layers
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel.getByRole('heading', { name: 'UV-Index Station' })).toBeVisible();
  await expect(infoPanel.getByRole('heading', { name: 'EUCOS Ground Station' })).toBeVisible();
});
