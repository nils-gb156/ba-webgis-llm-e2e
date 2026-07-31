// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Click the 'Measurement' button in the toolbar to open the measurement panel.
  // The accessibility tree shows "button Measurement". We use force: true as it's a Chakra UI toggle.
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  await measurementToggle.click({ force: true });

  // Verify the measurement panel is visible.
  // The prompt mentions a "measurement panel" should be visible.
  // Based on the context, the info panel or a specific measurement result area should appear.
  // Let's look for the info-panel or a specific measurement result container.
  // Since no specific test id for the measurement result is provided in the list, we check for the info panel
  // which often contains such results, or simply assert the toggle state if a specific panel ID isn't clear.
  // However, the expected result says "The measurement panel is visible".
  // Let's assume the info-panel or a generic visible state indicates success.
  // We will assert that the info panel becomes visible or some content related to measurement appears.
  // Given the test ids, `info-panel` is a good candidate for where results might be shown.
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Step 2: Click several points on the map canvas to draw a line.
  // We need to click on the map container.
  const mapContainer = page.getByTestId('map-container');
  
  // Get the bounding box of the map container to click within it.
  const box = await mapContainer.boundingBox();
  if (!box) {
    throw new Error('Map container not found or has no bounding box');
  }

  // Define points for a line (e.g., from left-center to right-center)
  const point1 = { x: box.x + box.width * 0.2, y: box.y + box.height * 0.5 };
  const point2 = { x: box.x + box.width * 0.5, y: box.y + box.height * 0.5 };
  const point3 = { x: box.x + box.width * 0.8, y: box.y + box.height * 0.5 };

  // Click point 1
  await page.mouse.click(point1.x, point1.y);
  
  // Click point 2
  await page.mouse.click(point2.x, point2.y);
  
  // Click point 3
  await page.mouse.click(point3.x, point3.y);

  // Step 3: Double-click to finish the measurement.
  await page.mouse.dblclick(point3.x, point3.y);

  // Expected results:
  // 1. The measurement panel is visible. (Already asserted above, but we can re-assert if needed)
  // 2. The measurement panel displays a length value with a unit.
  
  // We need to find the text containing the length and unit.
  // Since there is no specific test id for the measurement result, we look for text in the info-panel or nearby.
  // Common units are "km", "m", "mi", "ft".
  // We will poll for a pattern that looks like a number followed by a unit.
  await expect.poll(async () => {
    // Try to find text in the info-panel that matches a length pattern
    const infoPanel = page.getByTestId('info-panel');
    const text = await infoPanel.textContent();
    return text;
  }).toMatch(/[\d,.]+\s*(km|m|mi|ft|cm|mm)/i);
});
