// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: Ensure measurement tool is NOT active.
  // The accessibility tree shows "Measurement" button. We need to ensure it's not pressed.
  // Since we don't know its initial state for sure, we check and toggle if needed.
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  const isMeasurementPressed = await measurementToggle.getAttribute('aria-pressed');
  if (isMeasurementPressed === 'true') {
    await measurementToggle.click({ force: true });
  }

  // Precondition: Ensure Info Panel is visible.
  // The accessibility tree shows "Info Panel Switcher" is [pressed], so it should be visible.
  // However, to be safe and explicit, we ensure the info panel is open.
  const infoPanelToggle = page.getByRole('button', { name: 'Info Panel Switcher' });
  const isInfoPanelPressed = await infoPanelToggle.getAttribute('aria-pressed');
  if (isInfoPanelPressed !== 'true') {
    await infoPanelToggle.click({ force: true });
  }
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Precondition: Ensure UV-Index Stations layer is active.
  // The accessibility tree shows "UV-Index Stations" checkbox is [checked].
  // If it were unchecked, we would click it. It is checked, so we proceed.

  // Precondition: Ensure EUCOS Ground Stations layer is active.
  // The accessibility tree shows "EUCOS Ground Stations" checkbox is [checked].
  // If it were unchecked, we would click it. It is checked, so we proceed.

  // Step 1: The user clicks at map coordinates [1188692.84, 6767643.28] (EPSG:3857) on the map canvas.
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({
    position: { x: 1188692.84, y: 6767643.28 }
  });

  // Step 2: The user waits for the info panel to load the station info for both layers.
  // Expected result: The info panel displays a 'UV-Index Station' section with feature information.
  // Expected result: The info panel displays an 'EUCOS Ground Station' section with feature information.

  // We use expect.poll to wait for the content to appear in the info panel.
  const infoPanel = page.getByTestId('info-panel');

  // Wait for UV-Index Station section to appear
  await expect.poll(async () => {
    const uvSection = infoPanel.getByRole('heading', { name: 'UV-Index Station', level: 2 });
    return uvSection.isVisible();
  }).toBeTruthy();

  // Wait for EUCOS Ground Station section to appear
  await expect.poll(async () => {
    const eucosSection = infoPanel.getByRole('heading', { name: 'EUCOS Ground Station', level: 2 });
    return eucosSection.isVisible();
  }).toBeTruthy();

  // Additional assertion to confirm both sections are visible simultaneously
  await expect(infoPanel.getByRole('heading', { name: 'UV-Index Station', level: 2 })).toBeVisible();
  await expect(infoPanel.getByRole('heading', { name: 'EUCOS Ground Station', level: 2 })).toBeVisible();
});
