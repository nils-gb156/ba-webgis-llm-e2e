// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure map is loaded and ready before interacting
  const mapContainer = page.getByTestId('map-container');
  await expect(mapContainer).toBeVisible();

  // Step 1: Activate the measurement tool
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  await measurementToggle.click();

  // Verify the measurement panel is visible
  // The panel might be the info-panel or a specific measurement result container.
  // Based on the use case, we expect a panel showing results.
  // Let's assume the info-panel or a specific measurement overlay appears.
  // Looking at the context, info-panel is present. Let's check if it contains measurement info or if a new panel appears.
  // Often measurement results appear in a specific panel. Let's look for any visible text related to length/meters.
  
  // Step 2 & 3: Draw a line on the map
  // Click several points on the map canvas
  const mapFrame = mapContainer.locator('canvas');
  
  // Get the bounding box of the map to calculate click positions
  const box = await mapContainer.boundingBox();
  if (!box) {
    throw new Error('Map container bounding box not found');
  }

  // Define points for a simple line (e.g., from center to right, then down)
  // Center of the map
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  // Point 1: Center
  await page.mouse.click(centerX, centerY);
  
  // Point 2: To the right
  const point2X = centerX + 100;
  const point2Y = centerY;
  await page.mouse.click(point2X, point2Y);

  // Point 3: Down and right
  const point3X = centerX + 200;
  const point3Y = centerY + 100;
  await page.mouse.click(point3X, point3Y);

  // Double-click to finish the measurement
  await page.mouse.dblclick(point3X, point3Y);

  // Step 4: Verify the measurement result
  // The expected result is that a measurement panel is visible and displays a length value with a unit.
  // We can look for text containing "m" (meters) or "km" (kilometers) or "Length"
  // Let's check the info-panel or a specific measurement result locator if available.
  // Since no specific measurement result test-id is provided, we'll search for common patterns.
  
  // Try to find any element containing a measurement value (number followed by a unit)
  // We'll poll for this to ensure the async calculation is done.
  await expect.poll(async () => {
    // Check if there's any text on the page that looks like a measurement result
    // Common formats: "123.45 m", "1.23 km", "Length: 123 m"
    const bodyText = await page.locator('body').textContent();
    if (!bodyText) return false;
    
    // Regex for a number (integer or decimal) followed by a space and a unit (m, km, mi, ft)
    const measurementPattern = /\d+\.?\d*\s+(m|km|mi|ft|ft\.?|meters|kilometers|kilometres|miles|feet)\b/i;
    return measurementPattern.test(bodyText);
  }).toBe(true);

  // Additionally, verify that the info-panel or a similar panel is visible if it contains the result
  // The info-panel is toggled by default in the context, so it should be visible.
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();
});
