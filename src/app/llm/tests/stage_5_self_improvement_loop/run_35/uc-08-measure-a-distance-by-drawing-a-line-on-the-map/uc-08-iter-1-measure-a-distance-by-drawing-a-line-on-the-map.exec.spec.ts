// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. The user clicks the 'Measurement' button in the toolbar to open the measurement panel.
  await page.getByTestId('measurement-toggle').click({ force: true });

  // Verify the measurement dialog/panel is visible
  await expect(page.getByRole('dialog', { name: 'Measurement' })).toBeVisible();

  // 2. The user clicks several points on the map canvas to draw a line.
  // The map is rendered on a canvas element. We need to click on the map container.
  // We'll use the map-container test id and click at specific positions.
  // Let's get the map container's bounding box to calculate relative positions
  const mapContainer = page.getByTestId('map-container');
  await expect(mapContainer).toBeVisible();
  const mapBox = await mapContainer.boundingBox();

  if (!mapBox) {
    throw new Error('Map container bounding box could not be determined.');
  }

  // Define points relative to the map container's top-left corner
  // Point 1: somewhere in the upper-left quadrant of the map
  const point1 = { x: mapBox.x + mapBox.width * 0.2, y: mapBox.y + mapBox.height * 0.2 };
  // Point 2: somewhere in the center
  const point2 = { x: mapBox.x + mapBox.width * 0.5, y: mapBox.y + mapBox.height * 0.5 };
  // Point 3: somewhere in the lower-right quadrant
  const point3 = { x: mapBox.x + mapBox.width * 0.8, y: mapBox.y + mapBox.height * 0.8 };

  await page.mouse.move(point1.x, point1.y);
  await page.mouse.click(point1.x, point1.y);

  await page.mouse.move(point2.x, point2.y);
  await page.mouse.click(point2.x, point2.y);

  await page.mouse.move(point3.x, point3.y);
  await page.mouse.click(point3.x, point3.y);

  // 3. The user double-clicks to finish the measurement.
  await page.mouse.dblclick(point3.x, point3.y);

  // Expected results:
  // - The measurement panel is visible.
  // - The measurement panel displays a length value with a unit.
  
  // The measurement panel is a dialog.
  const measurementDialog = page.getByRole('dialog', { name: 'Measurement' });
  await expect(measurementDialog).toBeVisible();

  // The result is displayed as text within the dialog, e.g., "123.45 km" or "123.45 m".
  // We look for text that matches a pattern like a number followed by a unit.
  // Using expect.poll to wait for the result to appear.
  await expect.poll(async () => {
    // Get all text content from the dialog
    const dialogText = await measurementDialog.textContent();
    if (!dialogText) {
      return null;
    }
    // Try to find a pattern like "123.45 km" or "123.45 m"
    const match = dialogText.match(/[\d.]+\s*(km|m|mi|ft|cm)/i);
    return match ? match[0] : null;
  }).toMatch(/[\d.]+\s*(km|m|mi|ft|cm)/i);
});
