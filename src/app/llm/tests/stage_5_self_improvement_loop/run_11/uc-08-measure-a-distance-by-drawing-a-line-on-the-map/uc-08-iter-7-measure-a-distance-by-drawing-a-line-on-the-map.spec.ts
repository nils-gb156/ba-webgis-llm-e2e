// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Activate the measurement tool
  // The button is NOT in the pressed state in the initial state, so we can click it to open the panel.
  await page.getByTestId('measurement-toggle').click();

  // Verify the measurement panel is visible
  await expect(page.getByTestId('measurement-panel')).toBeVisible();

  // 2. Click several points on the map canvas to draw a line
  // The map container is a canvas element. We need to click on it using coordinates.
  const mapContainer = page.getByTestId('map-container');

  // Get the bounding box of the map container to ensure we click within it
  const box = await mapContainer.boundingBox();
  expect(box).toBeDefined();
  if (!box) {
    throw new Error('Map container bounding box is undefined');
  }

  // Calculate points relative to the map container
  // Clicking near the center, then slightly offset to create a line
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  // Point 1: Center of the map
  await page.mouse.click(centerX, centerY);

  // Point 2: Slightly to the right and down
  await page.mouse.click(centerX + 100, centerY + 100);

  // Point 3: Further to the right and down
  await page.mouse.click(centerX + 200, centerY + 200);

  // 3. Double-click to finish the measurement
  await page.mouse.dblclick(centerX + 200, centerY + 200);

  // Expected results
  // The measurement panel is visible
  await expect(page.getByTestId('measurement-panel')).toBeVisible();

  // The measurement panel displays a length value with a unit
  // The measurement dialog should now show the calculated distance
  // Wait for the measurement result to appear in the panel
  // The result is displayed in the dialog, not just the panel's general text
  await expect.poll(() =>
    page.getByRole('dialog', { name: 'Measurement' }).textContent()
  ).toMatch(/[\d.,]+\s*(m|km|mi|ft)/);
});
