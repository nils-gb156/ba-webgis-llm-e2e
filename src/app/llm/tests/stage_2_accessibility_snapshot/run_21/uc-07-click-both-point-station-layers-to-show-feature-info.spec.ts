// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible.
  // The accessibility tree shows "Info Panel Switcher [pressed]", so it is already open.
  // We assert visibility to ensure it's ready.
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Ensure no measurement tool is active.
  // The accessibility tree shows "Measurement" button but does not indicate it is pressed.
  // We assert it is not pressed to be safe.
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  await expect(measurementToggle).not.toBeChecked();

  // Ensure both station layers are active.
  // The accessibility tree shows both checkboxes are [checked].
  await expect(page.getByRole('checkbox', { name: 'UV-Index Stations' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'EUCOS Ground Stations' })).toBeChecked();

  // Click on the map at the specified coordinates where both stations are located.
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({
    position: { x: 1188692.84, y: 6767643.28 },
  });

  // Wait for the info panel to load the station info for both layers.
  // We poll for the presence of the specific section headings in the info panel.
  await expect.poll(() => page.getByTestId('info-panel').innerText()).toContain('UV-Index Station');
  await expect.poll(() => page.getByTestId('info-panel').innerText()).toContain('EUCOS Ground Station');

  // Assert that the info panel displays a 'UV-Index Station' section with feature information.
  await expect(page.getByRole('heading', { name: 'UV-Index Station' })).toBeVisible();

  // Assert that the info panel displays an 'EUCOS Ground Station' section with feature information.
  await expect(page.getByRole('heading', { name: 'EUCOS Ground Station' })).toBeVisible();
});
