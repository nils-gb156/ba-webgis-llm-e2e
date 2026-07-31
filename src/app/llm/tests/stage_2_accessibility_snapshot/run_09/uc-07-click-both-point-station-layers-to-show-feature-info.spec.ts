// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Preconditions: Ensure measurement tool is inactive (reset state if needed)
  const measurementToggle = page.getByTestId('measurement-toggle');
  const measurementState = await measurementToggle.getAttribute('aria-pressed');
  if (measurementState === 'true') {
    await measurementToggle.click();
  }

  // Ensure UV-Index layer is checked (it is checked by default per context, but verify)
  const uviLayerCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations' });
  if (!(await uviLayerCheckbox.isChecked())) {
    await uviLayerCheckbox.click({ force: true });
  }

  // Ensure EUCOS layer is checked (it is checked by default per context, but verify)
  const eucosLayerCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations' });
  if (!(await eucosLayerCheckbox.isChecked())) {
    await eucosLayerCheckbox.click({ force: true });
  }

  // Ensure Info Panel is visible
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const infoPanelState = await infoPanelToggle.getAttribute('aria-pressed');
  if (infoPanelState !== 'true') {
    await infoPanelToggle.click();
  }

  // Step 1: Click at specific map coordinates
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({
    position: { x: 1188692.84, y: 6767643.28 }
  });

  // Step 2: Wait for and verify feature info for both layers
  const infoPanel = page.getByTestId('info-panel');

  // Assert UV-Index Station section is present
  await expect(infoPanel.getByRole('heading', { name: 'UV-Index Station', exact: true })).toBeVisible();

  // Assert EUCOS Ground Station section is present
  await expect(infoPanel.getByRole('heading', { name: 'EUCOS Ground Station', exact: true })).toBeVisible();
});
