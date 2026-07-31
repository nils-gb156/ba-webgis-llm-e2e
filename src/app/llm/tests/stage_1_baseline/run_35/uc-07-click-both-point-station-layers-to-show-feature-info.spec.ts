// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  // Navigate to the base URL
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and layers to be active
  // The preconditions state that the info panel is visible and both layers are active.
  // We assume the app loads with these defaults or we wait for the map container to appear.
  const mapContainer = page.locator('.ol-viewport');
  await expect(mapContainer).toBeVisible();

  // Coordinates to click [1188692.84, 6767643.28] (EPSG:3857)
  const x = 1188692.84;
  const y = 6767643.28;

  // Click on the map at the specified coordinates
  // We need to find the map canvas or viewport element to click on it with a position.
  // The prompt implies using the map container element.
  await page.locator('.ol-viewport').click({
    position: {
      x: x,
      y: y
    }
  });

  // Wait for the info panel to load feature info for both layers.
  // The expected results state that the info panel displays 'UV-Index Station' and 'EUCOS Ground Station' sections.
  // We will look for text indicating these sections.
  
  // Wait for UV-Index Station info
  await expect(page.getByText('UV-Index Station')).toBeVisible();
  
  // Wait for EUCOS Ground Station info
  await expect(page.getByText('EUCOS Ground Station')).toBeVisible();
});
