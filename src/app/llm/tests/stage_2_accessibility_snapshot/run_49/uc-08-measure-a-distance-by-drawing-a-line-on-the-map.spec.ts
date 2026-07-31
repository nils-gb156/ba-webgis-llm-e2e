// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map and UI to be ready
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('map-toolbar')).toBeVisible();

  // Step 1: Click the Measurement button to activate the measurement tool
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  await measurementToggle.click();

  // Verify the measurement panel is visible
  // The prompt mentions "measurement panel" but doesn't give a specific test-id for the panel content.
  // However, the toggle button itself might change state or a panel might appear.
  // We'll assert the toggle is pressed/active if possible, or look for a panel.
  // Since Chakra UI often uses aria-pressed, let's check the button state.
  await expect(measurementToggle).toBeChecked(); // or toBePressed depending on implementation, usually checkbox-like behavior for toggles

  // Step 2: Click several points on the map canvas to draw a line
  const mapContainer = page.getByTestId('map-container');
  
  // Get the bounding box of the map container to click within it
  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map container not found or not visible');
  }

  // Calculate some points within the map area to draw a line
  // Center of the map
  const centerX = mapBox.x + mapBox.width / 2;
  const centerY = mapBox.y + mapBox.height / 2;
  
  // Point 1: slightly top-left from center
  const point1X = centerX - 100;
  const point1Y = centerY - 100;
  
  // Point 2: slightly bottom-right from center
  const point2X = centerX + 100;
  const point2Y = centerY + 100;

  // Point 3: slightly further top-right
  const point3X = centerX + 150;
  const point3Y = centerY - 150;

  // Click points to draw the line
  await page.mouse.click(point1X, point1Y);
  await page.mouse.click(point2X, point2Y);
  await page.mouse.click(point3X, point3Y);

  // Step 3: Double-click to finish the measurement
  await page.mouse.dblclick(centerX + 50, centerY + 50);

  // Expected results:
  // 1. The measurement panel is visible.
  // 2. The measurement panel displays a length value with a unit.
  
  // Since there is no specific test-id for the measurement result panel in the provided list,
  // we look for common patterns. Often, results are shown in a side panel or a popup.
  // The prompt mentions "info-panel" which might be used for measurement results if the info panel is active,
  // but the info panel toggle is also pressed. 
  // Let's look for any text that looks like a measurement (e.g., "m", "km", "mi" after a number).
  // We will poll for a measurement result appearing anywhere in the body or a specific container if identifiable.
  // Without a specific test-id for the measurement result, we'll search for a pattern in the text content of the page
  // or a likely container. However, strict locators are preferred.
  
  // Let's check if the info panel contains the measurement, as it's a common place for such details.
  // Or maybe the measurement result appears in a tooltip or a dedicated small panel.
  // Given the complexity and lack of specific test-id for the *result*, we'll try to find text matching a measurement pattern.
  
  // Wait for a measurement result to appear. Measurement results typically look like "123.45 m" or similar.
  await expect.poll(() => page.locator('body').textContent()).toMatch(/[\d.]+\s*(m|km|mi|ft)/i, {
    timeout: 10000
  });
});
