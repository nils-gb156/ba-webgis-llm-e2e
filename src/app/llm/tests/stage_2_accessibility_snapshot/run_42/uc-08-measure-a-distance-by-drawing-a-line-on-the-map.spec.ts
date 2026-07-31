// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('UC8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the map is loaded and interactive by waiting for the map container
  const mapContainer = page.getByTestId('map-container');
  await expect(mapContainer).toBeVisible();

  // Step 1: Click the 'Measurement' button in the toolbar
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  await measurementToggle.click();

  // Step 2: Click several points on the map canvas to draw a line
  // We click distinct points to create a visible line segment
  // Using the center of the map container for the first click, then offset for others
  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map container bounding box not found');
  }

  const centerX = mapBox.x + mapBox.width / 2;
  const centerY = mapBox.y + mapBox.height / 2;

  // Point 1
  await page.mouse.click(centerX, centerY);
  // Point 2
  await page.mouse.click(centerX + 100, centerY - 100);
  // Point 3
  await page.mouse.click(centerX + 200, centerY);

  // Step 3: Double-click to finish the measurement
  await page.mouse.dblclick(centerX + 200, centerY);

  // Expected results:
  // The measurement panel is visible.
  // The measurement panel displays a length value with a unit.
  
  // The measurement results are typically shown in the info panel or a dedicated measurement panel.
  // Based on the context, the info panel is already open and pressed.
  // We look for text that resembles a measurement (e.g., "m", "km", "mi") in the info panel or a specific measurement element.
  // Since there is no specific `data-testid` for the measurement result in the provided context,
  // we check the info panel for a length value.
  
  const infoPanel = page.getByTestId('info-panel');
  
  // Wait for the measurement result to appear. It might take a moment to calculate and render.
  await expect.poll(async () => {
    const content = await infoPanel.textContent();
    // Look for a pattern that indicates a distance measurement (number followed by unit)
    return content?.match(/\d+(\.\d+)?\s*(m|km|mi|ft|cm|mm)/i) !== null;
  }).toBeTruthy();

  // Verify the info panel is visible (it should be, as it was already open)
  await expect(infoPanel).toBeVisible();
});
