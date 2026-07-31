// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  // Navigate to the base URL
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the page to be fully loaded and the map to be ready
  await page.waitForLoadState('networkidle');

  // Step 1: The user clicks the 'Measurement' button in the toolbar to open the measurement panel.
  // We look for the measurement button by its accessible name or test id if available.
  // Assuming the button has a test id or accessible name "Measurement".
  const measurementButton = page.getByRole('button', { name: 'Measurement' });
  await expect(measurementButton).toBeVisible();
  await measurementButton.click();

  // Wait for the measurement panel to be visible
  const measurementPanel = page.getByTestId('measurement-panel');
  await expect(measurementPanel).toBeVisible();

  // Step 2: The user clicks several points on the map canvas to draw a line.
  // We need to find the map canvas. It's likely a div with a specific class or test id.
  // Let's assume the map container has a test id 'map-container'.
  const mapContainer = page.getByTestId('map-container');
  await expect(mapContainer).toBeVisible();

  // Get the bounding box of the map container to click within it
  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map container bounding box not found');
  }

  // Click the first point (center of the map for simplicity)
  const firstPointX = mapBox.x + mapBox.width / 2;
  const firstPointY = mapBox.y + mapBox.height / 2;
  await page.mouse.click(firstPointX, firstPointY);

  // Click the second point (offset from the first)
  const secondPointX = firstPointX + 100;
  const secondPointY = firstPointY + 100;
  await page.mouse.click(secondPointX, secondPointY);

  // Step 3: The user double-clicks to finish the measurement.
  await page.mouse.dblclick(secondPointX, secondPointY);

  // Wait for the measurement result to be updated
  // The expected result is that the measurement panel displays a length value with a unit.
  // We'll poll for a text that looks like a length value (e.g., "123.45 m")
  const measurementResult = page.getByTestId('measurement-result');
  await expect.poll(() => measurementResult.textContent()).toMatch(/\d+\.?\d*\s*m/);
});
