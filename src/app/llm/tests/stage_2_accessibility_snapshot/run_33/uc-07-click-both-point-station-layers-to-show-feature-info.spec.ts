// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Preconditions: Ensure Info Panel is visible and both station layers are active.
  // The accessibility tree indicates the Info Panel, UV-Index Stations, and EUCOS Ground Stations
  // are already in the desired state (pressed/checked). We just need to ensure they are visible.

  // Wait for the info panel toggle to be in the pressed state (visible panel)
  const infoPanelToggle = page.getByRole('button', { name: 'Info Panel Switcher' });
  await expect(infoPanelToggle).toBeChecked();

  // Ensure the info panel itself is visible
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Ensure UV-Index Stations layer is checked
  const uviLayerCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations' });
  await expect(uviLayerCheckbox).toBeChecked();

  // Ensure EUCOS Ground Stations layer is checked
  const eucosLayerCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations' });
  await expect(eucosLayerCheckbox).toBeChecked();

  // Ensure no measurement tool is active
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  await expect(measurementToggle).not.toBeChecked();

  // Step 1: Click at the specific map coordinates [1188692.84, 6767643.28]
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({
    position: {
      x: 1188692.84,
      y: 6767643.28
    }
  });

  // Step 2: Wait for the info panel to load the station info for both layers.
  // We poll the info panel content to ensure both sections are present.

  // Wait for UV-Index Station section to appear
  await expect.poll(async () => {
    const uviSection = infoPanel.getByRole('heading', { name: 'UV-Index Station', exact: true });
    return uviSection.isVisible();
  }).toBeTruthy();

  // Wait for EUCOS Ground Station section to appear
  await expect.poll(async () => {
    const eucosSection = infoPanel.getByRole('heading', { name: 'EUCOS Ground Station', exact: true });
    return eucosSection.isVisible();
  }).toBeTruthy();
});
