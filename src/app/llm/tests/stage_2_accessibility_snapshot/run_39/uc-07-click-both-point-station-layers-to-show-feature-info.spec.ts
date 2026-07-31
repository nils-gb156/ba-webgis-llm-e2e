// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Preconditions:
  // - Info panel is visible (it is open by default per the context).
  // - UV-Index Stations layer is active (checked by default).
  // - EUCOS Ground Stations layer is active (checked by default).
  // - No measurement tool is active (default state).

  // Step 1: Click on the map at the specific coordinates where both stations are located.
  // Coordinates: [1188692.84, 6767643.28] (EPSG:3857)
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({
    position: {
      x: 1188692.84,
      y: 6767643.28,
    },
  });

  // Step 2: Wait for the info panel to load the station info for both layers.
  // We expect to see sections for both 'UV-Index Station' and 'EUCOS Ground Station'.

  // Wait for the UV-Index Station info to appear
  await expect(
    page.getByRole('heading', { name: 'UV-Index Station', level: 2 }).or(
      page.getByText('UV-Index Station')
    )
  ).toBeVisible();

  // Wait for the EUCOS Ground Station info to appear
  await expect(
    page.getByRole('heading', { name: 'EUCOS Ground Station', level: 2 }).or(
      page.getByText('EUCOS Ground Station')
    )
  ).toBeVisible();

  // Verify that the info panel contains content for both layers.
  // We use expect.poll to wait for the content to settle as it loads asynchronously.
  await expect.poll(() =>
    page.getByTestId('info-panel').textContent()
  ).toMatch(/UV-Index Station/);

  await expect.poll(() =>
    page.getByTestId('info-panel').textContent()
  ).toMatch(/EUCOS Ground Station/);
});
