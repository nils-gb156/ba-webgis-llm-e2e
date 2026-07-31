// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Activate the measurement tool
  // The button is already in the pressed state (pressed=true) in the initial state.
  // We should not click it as that would close the panel.
  // Instead, we verify the measurement panel is visible.
  await expect(page.getByRole('dialog', { name: 'Measurement' })).toBeVisible();

  // 2. Click several points on the map canvas to draw a line
  // The map container is a canvas element. We need to click on it using coordinates.
  // We'll click on the map container at different positions to draw a line.
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
  await expect(page.getByRole('dialog', { name: 'Measurement' })).toBeVisible();

  // The measurement panel displays a length value with a unit
  // The measurement dialog should now show the calculated distance
  await expect.poll(() =>
    page.getByRole('dialog', { name: 'Measurement' }).textContent()
  ).toMatch(/[\d.,]+\s*(m|km|mi|ft)/);
});
