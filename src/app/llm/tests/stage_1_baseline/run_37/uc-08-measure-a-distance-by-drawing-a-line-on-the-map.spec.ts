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
  // We need to click on the map canvas. Assuming the map canvas has a test id or we can find it.
  // Since no specific test id for the map canvas is provided in the prompt, we'll try to find the canvas element.
  // However, the prompt says "The map canvas is interactive." and we should use test ids if available.
  // Let's assume there is a test id for the map container or we can use a role.
  // If no test id is available for the map, we might need to use a locator that finds the canvas.
  // But the prompt says "If an element has no accessible role, label, visible text, or test id, a scoped CSS class selector may be used as a last resort."
  // Let's try to find the map container first. Often maps have a container div.
  // Since we don't have a specific test id, let's try to find the canvas element directly or a container.
  // Let's assume the map container has a test id 'map-container' or similar. If not, we might need to use a different approach.
  // For now, let's try to click on the map canvas. We'll use a locator that finds the canvas element.
  // If the canvas doesn't have a test id, we might need to use a CSS selector.
  // Let's try to find the canvas element by its tag name and role if any.
  // Canvas elements don't have roles, so we'll use a CSS selector as a last resort if necessary.
  // However, let's first try to find a container that might have a test id.
  // Let's assume the map container has a test id 'map-container'.
  const mapContainer = page.getByTestId('map-container');
  await expect(mapContainer).toBeVisible();

  // Get the bounding box of the map container to click within it.
  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map container bounding box not found');
  }

  // Click several points to draw a line.
  // Point 1
  await page.mouse.click(mapBox.x + 100, mapBox.y + 100);
  // Point 2
  await page.mouse.click(mapBox.x + 200, mapBox.y + 200);
  // Point 3
  await page.mouse.click(mapBox.x + 300, mapBox.y + 100);

  // Step 3: Double-click to finish the measurement.
  await page.mouse.dblclick(mapBox.x + 300, mapBox.y + 100);

  // Expected result: The measurement panel displays a length value with a unit.
  // We need to find the element that displays the length.
  // Let's assume there is a test id for the measurement result, e.g., 'measurement-result'.
  const measurementResult = page.getByTestId('measurement-result');
  await expect(measurementResult).toBeVisible();

  // Check that the measurement result contains a length value with a unit.
  // We'll use a regex to match a number followed by a unit (e.g., "123 m", "1.2 km").
  await expect(measurementResult).toMatch(/[\d.]+\s*(m|km|mi|ft)/i);
});
