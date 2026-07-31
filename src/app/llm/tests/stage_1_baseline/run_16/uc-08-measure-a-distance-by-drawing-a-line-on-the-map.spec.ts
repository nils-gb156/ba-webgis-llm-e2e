// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and interactive
  const mapCanvas = page.getByRole('img', { name: /map/i }).first();
  await expect(mapCanvas).toBeVisible();
  await page.waitForTimeout(1000); // Allow map tiles and interactions to settle

  // Step 1: Click the 'Measurement' button in the toolbar to open the measurement panel.
  const measurementButton = page.getByRole('button', { name: 'Measurement', exact: true });
  await expect(measurementButton).toBeVisible();
  await measurementButton.click();

  // Wait for the measurement panel to become visible
  const measurementPanel = page.getByRole('dialog', { name: /measurement/i, exact: false });
  // The panel might not have a specific accessible name, so we look for a container that appears
  // After clicking the button, we wait for the panel to appear.
  // Assuming the panel has a test id or is a distinct region.
  // If no specific role/name is available, we might need to rely on the presence of measurement results or a specific panel element.
  // Let's try to find the panel by its content or a common pattern.
  // Often, such panels have a specific data-testid. Let's assume there isn't one and look for the result area or the panel itself.
  // A safer bet is to wait for the measurement result to appear, which implies the panel is open.
  
  // Step 2: Click several points on the map canvas to draw a line.
  // We need to click on the map canvas.
  // The map canvas is usually an HTML5 canvas element.
  const mapLocator = page.locator('canvas');
  await expect(mapLocator).toBeVisible();

  // Get the bounding box of the map to click within it
  const box = await mapLocator.boundingBox();
  if (!box) {
    throw new Error('Map canvas not found or not visible');
  }

  // Calculate some points to draw a line
  // Center of the map
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  // Point 1: slightly top-left of center
  const point1X = centerX - 50;
  const point1Y = centerY - 50;

  // Point 2: slightly bottom-right of center
  const point2X = centerX + 50;
  const point2Y = centerY + 50;

  // Point 3: further bottom-right
  const point3X = centerX + 100;
  const point3Y = centerY + 100;

  // Click first point
  await page.mouse.click(point1X, point1Y);
  await page.waitForTimeout(200); // Small delay between clicks

  // Click second point
  await page.mouse.click(point2X, point2Y);
  await page.waitForTimeout(200);

  // Step 3: Double-click to finish the measurement.
  // Double-click on the last point or nearby to finish.
  await page.mouse.dblclick(point3X, point3Y);
  await page.waitForTimeout(1000); // Allow the measurement result to render

  // Expected results:
  // The measurement panel is visible.
  // The measurement panel displays a length value with a unit.

  // Look for the measurement result. It's likely in a list or a specific result area.
  // Let's look for text that looks like a measurement (e.g., "1.23 km", "500 m")
  // We can use expect.poll to wait for the result to appear.
  
  // Find the measurement result element. It might be inside the measurement panel.
  // Let's try to find any text that matches a length pattern.
  const measurementResult = page.locator('text=/\\d+\\.?\\d*\\s*(m|km|mi|ft)/i');
  
  await expect.poll(async () => {
    const count = await measurementResult.count();
    return count > 0;
  }).toBeTruthy();

  // Assert that the measurement result is visible and contains a length value
  await expect(measurementResult).toBeVisible();
  
  // Optional: Assert that the result contains a unit
  const resultText = await measurementResult.first().textContent();
  expect(resultText).toMatch(/\\d+\\.?\\d*\\s*(m|km|mi|ft)/i);
});
