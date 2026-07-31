// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Click the 'Measurement' button in the toolbar to open the measurement panel.
  const measurementButton = page.getByRole('button', { name: 'Measurement' });
  await measurementButton.click();

  // Expected result: The measurement panel is visible.
  const measurementPanel = page.getByTestId('measurement-panel');
  await expect(measurementPanel).toBeVisible();

  // Step 2: Click several points on the map canvas to draw a line.
  // We assume the map canvas has a test id or can be located by its container.
  // Since no specific test id for the map container is provided in the prompt's context,
  // we will try to locate the map container. Often it's a div with a specific class or role.
  // However, the prompt mentions "map canvas is interactive" and "click the map container element".
  // Let's assume a common test id for the map container if available, otherwise fallback.
  // Looking at typical Open Pioneer setups, the map container might have a test id like 'map-container'.
  // If not, we might need to use a more generic locator.
  // Let's try to find the map container. If it's not explicitly tested, we might need to guess or use a robust locator.
  // For this exercise, let's assume there is a test id for the map container.
  const mapContainer = page.getByTestId('map-container');
  
  // We need to click multiple points. Let's pick some arbitrary coordinates relative to the map container.
  // We'll click 3 points to form a simple line.
  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map container not found or not visible.');
  }

  // Point 1: Top-left area of the map
  await page.mouse.click(mapBox.x + 100, mapBox.y + 100);
  
  // Point 2: Center area of the map
  await page.mouse.click(mapBox.x + 200, mapBox.y + 200);
  
  // Point 3: Bottom-right area of the map
  await page.mouse.click(mapBox.x + 300, mapBox.y + 300);

  // Step 3: Double-click to finish the measurement.
  await page.mouse.dblclick(mapBox.x + 300, mapBox.y + 300);

  // Expected result: The measurement panel displays a length value with a unit.
  // We expect the panel to contain some text that looks like a measurement (e.g., "1.23 km" or "500 m").
  // We will poll for the presence of such a value in the measurement panel.
  await expect.poll(async () => {
    const content = await measurementPanel.textContent();
    return content;
  }).toMatch(/\d+(\.\d+)?\s*(km|m|cm|mm|mi|ft|in)/i);
});
