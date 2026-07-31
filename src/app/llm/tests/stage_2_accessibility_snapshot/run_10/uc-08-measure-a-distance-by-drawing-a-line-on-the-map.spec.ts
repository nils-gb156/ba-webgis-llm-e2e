// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready by checking for the map container
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Step 1: Click the 'Measurement' button in the toolbar to open the measurement panel.
  // The button has text "Measurement" and is in the map-toolbar.
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  await measurementToggle.click();

  // Verify the measurement panel is visible.
  // The prompt doesn't give a specific test-id for the measurement panel,
  // but we can infer it might be related to the toolbar or a new region.
  // Often, these tools update the info-panel or a dedicated overlay.
  // Let's check if the info-panel or a specific measurement result appears.
  // However, the expected result says "The measurement panel is visible".
  // Looking at the accessibility tree, there isn't a dedicated "Measurement Panel" region immediately.
  // Let's assume the measurement tool activates and we can start drawing.
  // We will wait for the map to be interactive and potentially a cursor change or just proceed to drawing.

  // Step 2: Click several points on the map canvas to draw a line.
  // We need to click on the map container.
  const mapContainer = page.getByTestId('map-container');
  
  // Get the bounding box of the map container to calculate click positions
  const box = await mapContainer.boundingBox();
  if (!box) {
    throw new Error('Map container not found or not visible');
  }

  // Define points for a line. Let's draw a small line in the center area.
  // Point 1: Center-ish
  const point1 = { x: box.x + box.width * 0.5, y: box.y + box.height * 0.5 };
  // Point 2: Slightly to the right and up
  const point2 = { x: box.x + box.width * 0.6, y: box.y + box.height * 0.4 };
  // Point 3: Further right
  const point3 = { x: box.x + box.width * 0.7, y: box.y + box.height * 0.5 };

  await page.mouse.click(point1.x, point1.y);
  await page.mouse.click(point2.x, point2.y);
  await page.mouse.click(point3.x, point3.y);

  // Step 3: Double-click to finish the measurement.
  await page.mouse.dblclick(point3.x, point3.y);

  // Expected results:
  // 1. The measurement panel is visible.
  // 2. The measurement panel displays a length value with a unit.

  // The measurement result might appear in the info-panel or a specific measurement result area.
  // Let's check the info-panel for measurement results.
  const infoPanel = page.getByTestId('info-panel');
  
  // Wait for the info panel to contain measurement information.
  // Since we don't have a specific test id for the measurement result, we look for text patterns.
  // Measurement results often include "km", "m", "mi", "ft".
  await expect.poll(async () => {
    const text = await infoPanel.textContent();
    return text;
  }).toMatch(/(\d+(\.\d+)?\s*(km|m|mi|ft))/i, { timeout: 10000 });

  // Alternatively, if there's a specific measurement result container, we would target it.
  // Since no specific test-id is provided for the measurement result, we rely on the info-panel content.
  // Let's also ensure the info panel is visible.
  await expect(infoPanel).toBeVisible();
});
