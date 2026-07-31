// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('UC7: Click both point station layers to show feature info', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the map to be ready
  // The map container is typically the main canvas or a div containing it.
  // We wait for the map to be visible and interactive.
  const mapContainer = page.locator('canvas');
  await expect(mapContainer).toBeVisible();

  // Ensure no measurement tool is active (reset state if necessary, though preconditions say it's not)
  // We assume the default state is correct per preconditions.

  // Ensure layers are active.
  // The preconditions state that UV-Index Stations (WMS) and EUCOS Ground Stations (WFS) are active.
  // We verify this by checking the layer list or assuming the preconditions hold after load.
  // Since we cannot easily toggle layers without specific test IDs for the layer tree,
  // we rely on the preconditions being met upon load or check the layer visibility if test IDs exist.
  // For this test, we proceed assuming layers are active as per preconditions.

  // Click on the map at the specified coordinates [1188692.84, 6767643.28] (EPSG:3857)
  // Playwright's click with position is relative to the element's bounding box.
  // We need to click on the map canvas.
  await mapContainer.click({
    position: {
      x: 1188692.84,
      y: 6767643.28
    }
  });

  // Wait for the info panel to load and display feature info for both layers.
  // The info panel usually appears when a feature is selected.
  // We look for sections titled 'UV-Index Station' and 'EUCOS Ground Station'.

  // Wait for the UV-Index Station info section to appear
  const uvInfoSection = page.getByRole('region', { name: /UV-Index Station/i });
  await expect(uvInfoSection).toBeVisible({ timeout: 10000 });

  // Wait for the EUCOS Ground Station info section to appear
  const eucosInfoSection = page.getByRole('region', { name: /EUCOS Ground Station/i });
  await expect(eucosInfoSection).toBeVisible({ timeout: 10000 });

  // Verify that the info panel is visible (it should be if sections are visible)
  const infoPanel = page.getByRole('complementary', { name: /Info Panel/i }).or(
    page.locator('[data-testid="info-panel"]')
  );
  await expect(infoPanel.first()).toBeVisible();
});
