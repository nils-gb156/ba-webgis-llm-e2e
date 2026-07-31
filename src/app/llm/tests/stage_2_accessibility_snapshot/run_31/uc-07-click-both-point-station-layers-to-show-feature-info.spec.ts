// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Preconditions: Ensure info panel is visible
  // The accessibility tree shows "Info Panel Switcher" is pressed, so the panel should be open.
  // We assert visibility to ensure it's loaded.
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Preconditions: Ensure no measurement tool is active
  // The accessibility tree shows "Measurement" button is not pressed (no state indicated, default is off).
  // We double-check by ensuring it's not in a pressed state.
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  await expect(measurementToggle).not.toBeChecked();

  // Preconditions: Ensure UV-Index Stations and EUCOS Ground Stations layers are active
  // The accessibility tree shows both checkboxes are [checked].
  // We verify this state.
  await expect(page.getByRole('checkbox', { name: 'UV-Index Stations' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'EUCOS Ground Stations' })).toBeChecked();

  // Step 1: Click at map coordinates [1188692.84, 6767643.28] on the map canvas
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({
    position: {
      x: 1188692.84,
      y: 6767643.28
    }
  });

  // Step 2: Wait for the info panel to load the station info for both layers
  // Expected results:
  // - The info panel displays a 'UV-Index Station' section with feature information.
  // - The info panel displays an 'EUCOS Ground Station' section with feature information.

  // We use expect.poll to wait for the content to appear in the info panel.
  // We check for the presence of headings or text indicating the feature info for both layers.
  // Based on the use case description, we look for "UV-Index Station" and "EUCOS Ground Station"
  // within the info panel.

  await expect.poll(async () => {
    const infoPanel = page.getByTestId('info-panel');
    const uviText = await infoPanel.getByText('UV-Index Station').isVisible().catch(() => false);
    const eucosText = await infoPanel.getByText('EUCOS Ground Station').isVisible().catch(() => false);
    return { uvi: uviText, eucos: eucosText };
  }).toEqual({ uvi: true, eucos: true });

  // Additional assertion: Verify the sections are actually visible in the DOM
  await expect(page.getByTestId('info-panel').getByText('UV-Index Station')).toBeVisible();
  await expect(page.getByTestId('info-panel').getByText('EUCOS Ground Station')).toBeVisible();
});
