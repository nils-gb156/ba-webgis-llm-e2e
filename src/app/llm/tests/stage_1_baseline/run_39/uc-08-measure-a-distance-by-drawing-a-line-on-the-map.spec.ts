// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the page to load and map to be ready
  await page.waitForLoadState('networkidle');

  // Step 1: Click the 'Measurement' button in the toolbar to open the measurement panel
  // We assume a test id or accessible name exists for the measurement tool button.
  // If not, we fall back to a role/text search scoped to the toolbar.
  const measurementButton = page.getByRole('button', { name: 'Measurement', exact: true });
  
  // Check if the button is already pressed/active. If it is, we might need to ensure the panel is open.
  // However, the use case implies activating it. Let's click it.
  // Using force: true if it's a custom control, but standard button should work.
  await measurementButton.click();

  // Step 2: Click several points on the map canvas to draw a line.
  // We need to locate the map canvas. Typically, OpenLayers maps have a specific container.
  // We will look for the map container.
  const mapContainer = page.locator('.ol-viewport');
  await expect(mapContainer).toBeVisible();

  // Get the bounding box of the map to click within it
  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map container not found or not visible');
  }

  // Define some points to draw a line.
  // Center of the map
  const centerX = mapBox.x + mapBox.width / 2;
  const centerY = mapBox.y + mapBox.height / 2;

  // Point 1: slightly to the right and down
  const point1X = centerX + 50;
  const point1Y = centerY + 50;

  // Point 2: further right and up
  const point2X = centerX + 150;
  const point2Y = centerY - 50;

  // Click first point
  await page.mouse.click(point1X, point1Y);
  
  // Click second point
  await page.mouse.click(point2X, point2Y);

  // Step 3: Double-click to finish the measurement.
  // Double click at the last point or a new point to finish. Usually double-clicking the last point or a new point finishes.
  // Let's double-click at the second point to finish.
  await page.mouse.dblclick(point2X, point2Y);

  // Expected results:
  // 1. The measurement panel is visible.
  // We assume the measurement panel has a test id or specific role.
  // Let's look for a panel that appears after measurement.
  // Often, results are shown in a side panel or a popup.
  // Let's try to find an element that shows the measurement result.
  // We will poll for the visibility of a measurement result container.
  
  // Assuming there is a test id for the measurement result panel or a general result container.
  // If no test id is known, we might look for text like "Length" or a number.
  // Let's assume a test id 'measurement-result' exists for the result display.
  const measurementResultContainer = page.getByTestId('measurement-result');
  
  // Wait for the measurement result container to be visible
  await expect(measurementResultContainer).toBeVisible();

  // 2. The measurement panel displays a length value with a unit.
  // We will check if the container contains text that looks like a length (e.g., "123.45 m").
  // We use expect.poll to wait for the text to appear.
  await expect.poll(async () => {
    const text = await measurementResultContainer.textContent();
    return text;
  }).toMatch(/[\d.]+\s*(m|km|mi|ft)/i);
});
