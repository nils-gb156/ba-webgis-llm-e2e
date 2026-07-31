// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Preconditions: Ensure info panel is visible.
  // The accessibility tree shows "Info Panel Switcher" is pressed, so it should be visible.
  // We assert visibility to ensure it's ready.
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Ensure no measurement tool is active.
  // The accessibility tree shows "Measurement" button is not pressed.
  // We assert it is not pressed to be sure.
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  await expect(measurementToggle).not.toBeChecked();

  // Ensure UV-Index Stations layer is active.
  const uviCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations' });
  await expect(uviCheckbox).toBeChecked();

  // Ensure EUCOS Ground Stations layer is active.
  const eucosCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations' });
  await expect(eucosCheckbox).toBeChecked();

  // Step 1: Click at map coordinates [1188692.84, 6767643.28] on the map canvas.
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({
    position: { x: 1188692.84, y: 6767643.28 },
  });

  // Step 2: Wait for the info panel to load the station info for both layers.
  // Expected results:
  // - The info panel displays a 'UV-Index Station' section with feature information.
  // - The info panel displays an 'EUCOS Ground Station' section with feature information.

  // We look for headings or text that indicate the presence of these sections.
  // The info panel content is dynamic. We use expect.poll to wait for the content to appear.
  const infoPanel = page.getByTestId('info-panel');

  // Wait for UV-Index Station section to appear
  await expect.poll(async () => {
    const content = await infoPanel.textContent();
    return content?.includes('UV-Index Station');
  }).toBeTruthy();

  // Wait for EUCOS Ground Station section to appear
  await expect.poll(async () => {
    const content = await infoPanel.textContent();
    return content?.includes('EUCOS Ground Station');
  }).toBeTruthy();
});
