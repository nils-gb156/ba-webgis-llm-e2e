// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Preconditions:
  // - Info panel is visible (it is open by default according to context: "Info Panel Switcher [pressed]")
  // - UV-Index Stations layer is active (checked)
  // - EUCOS Ground Stations layer is active (checked)
  // - No measurement tool is active (button is not pressed)

  // Step 1: Click at map coordinates [1188692.84, 6767643.28] (EPSG:3857)
  // The map container is identified by data-testid "map-container"
  await page.getByTestId('map-container').click({
    position: { x: 1188692.84, y: 6767643.28 }
  });

  // Step 2: Wait for the info panel to load the station info for both layers.
  // We poll the info panel content to ensure both sections appear.

  // Wait for UV-Index Station section to appear
  await expect(page.getByTestId('info-panel')).toContainText('UV-Index Station');

  // Wait for EUCOS Ground Station section to appear
  await expect(page.getByTestId('info-panel')).toContainText('EUCOS Ground Station');

  // Verify both sections are visible
  await expect(page.getByText('UV-Index Station')).toBeVisible();
  await expect(page.getByText('EUCOS Ground Station')).toBeVisible();
});
