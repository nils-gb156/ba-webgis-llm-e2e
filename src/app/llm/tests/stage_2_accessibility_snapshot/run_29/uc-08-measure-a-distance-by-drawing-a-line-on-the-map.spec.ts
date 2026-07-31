// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Click the 'Measurement' button in the toolbar to open the measurement panel.
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  await measurementToggle.click();

  // Verify the measurement panel is visible.
  // The panel content is likely inside the map-controls-panel or a similar container.
  // We assert that the toggle is pressed/active as a proxy for the panel being open,
  // or look for specific UI elements that appear when measurement mode is active.
  await expect(measurementToggle).toBeChecked();

  // Step 2: Click several points on the map canvas to draw a line.
  // We need to click on the map container. We'll use approximate coordinates
  // relative to the map container's bounding box to ensure we click on the canvas.
  const mapContainer = page.getByTestId('map-container');
  const mapBox = await mapContainer.boundingBox();

  if (mapBox) {
    // Click a few points to form a line.
    // Point 1
    await page.mouse.click(mapBox.x + 100, mapBox.y + 100);
    // Point 2
    await page.mouse.click(mapBox.x + 200, mapBox.y + 200);
    // Point 3
    await page.mouse.click(mapBox.x + 300, mapBox.y + 150);

    // Step 3: Double-click to finish the measurement.
    await page.mouse.dblclick(mapBox.x + 300, mapBox.y + 150);
  }

  // Expected results:
  // - The measurement panel is visible (already asserted via toggle state).
  // - The measurement panel displays a length value with a unit.

  // The measurement result is likely displayed in a specific area.
  // Often, measurement results are shown in a tooltip or a dedicated result panel.
  // Since no specific test-id for the result is provided in the context,
  // we look for text that resembles a measurement (e.g., numbers followed by 'm' or 'km').
  // We'll poll for this text to appear on the page, as the map interaction is async.

  await expect.poll(async () => {
    // Try to find text that looks like a measurement result.
    // It might be in a tooltip, a status bar, or a result panel.
    // We'll check for common patterns.
    const bodyText = await page.locator('body').innerText();
    // Look for a number followed by a unit like 'm', 'km', 'mi', 'ft'
    const measurementRegex = /\d+(\.\d+)?\s*(m|km|mi|ft|in|cm|mm)/i;
    return measurementRegex.test(bodyText);
  }).toBeTruthy();
});
