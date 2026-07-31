// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be interactive and loaded
  const mapContainer = page.getByTestId('map-container');
  await expect(mapContainer).toBeVisible();

  // Step 1: Click the 'Measurement' button in the toolbar
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  await measurementToggle.click();

  // Step 2: Click several points on the map canvas to draw a line
  // We need to click on the map canvas element.
  // We'll click at different coordinates to form a line.
  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map container bounding box not found');
  }

  const startX = mapBox.x + mapBox.width / 2;
  const startY = mapBox.y + mapBox.height / 2;

  // First point
  await page.mouse.click(startX, startY);

  // Second point
  const secondX = startX + 100;
  const secondY = startY - 100;
  await page.mouse.click(secondX, secondY);

  // Third point
  const thirdX = startX + 200;
  const thirdY = startY;
  await page.mouse.click(thirdX, thirdY);

  // Step 3: Double-click to finish the measurement
  await page.mouse.dblclick(startX, startY);

  // Expected results:
  // - The measurement panel is visible.
  // - The measurement panel displays a length value with a unit.

  // Wait for the measurement result to appear.
  // We look for a text that looks like a distance measurement (e.g., "1.23 km" or "1234 m").
  // Since we don't have a specific test id for the measurement result text,
  // we will check for the presence of a measurement-related element or text.
  // Often, the measurement result is displayed in a tooltip or a panel.
  // Let's assume the result appears in the info-panel or a specific measurement panel.
  // Based on the context, there is no specific 'measurement-panel' test id,
  // but the 'info-panel' might contain it, or it might be a floating element.
  // Let's try to find any text that matches a distance pattern.

  // A common pattern for measurement results is a number followed by a unit.
  // We can poll for this pattern.
  await expect.poll(async () => {
    const bodyText = await page.locator('body').textContent();
    // Match patterns like "123 m", "1.23 km", "1234.567 m"
    const distancePattern = /\d+\.?\d*\s*(m|km|mi|ft)/i;
    return distancePattern.test(bodyText);
  }).toBeTruthy();

  // Additionally, verify the info panel or a specific measurement indicator is visible
  // if it's part of the standard UI flow.
  // The prompt mentions an 'info-panel'. Let's check if it's visible and contains measurement info.
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();
});
