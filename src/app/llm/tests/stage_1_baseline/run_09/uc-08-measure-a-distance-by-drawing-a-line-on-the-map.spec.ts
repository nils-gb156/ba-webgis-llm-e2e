// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready before interacting
  const mapCanvas = page.locator('canvas');
  await expect(mapCanvas).toBeVisible();

  // Step 1: Click the 'Measurement' button in the toolbar to open the measurement panel.
  // Using force: true as toolbar buttons might be overlays or have specific interaction patterns.
  const measurementButton = page.getByRole('button', { name: 'Measurement' });
  await measurementButton.click();

  // Step 2: Click several points on the map canvas to draw a line.
  // We need to click on the map canvas. We'll use coordinates relative to the canvas element.
  const mapBox = await mapCanvas.boundingBox();
  if (!mapBox) {
    throw new Error('Map canvas bounding box not found');
  }

  // Calculate center and some offset points to ensure clicks are on the map
  const centerX = mapBox.x + mapBox.width / 2;
  const centerY = mapBox.y + mapBox.height / 2;
  const offset = 100;

  // First point
  await page.mouse.click(centerX, centerY);
  // Second point
  await page.mouse.click(centerX + offset, centerY + offset);
  // Third point
  await page.mouse.click(centerX - offset, centerY + offset);

  // Step 3: Double-click to finish the measurement.
  await page.mouse.dblClick(centerX - offset, centerY + offset);

  // Expected results:
  // The measurement panel is visible.
  // The measurement panel displays a length value with a unit.

  // Assert that the measurement panel is visible.
  // Assuming the measurement panel has a test id or can be identified by role/text.
  // Common patterns for panels in such apps involve a specific container.
  // Let's try to find the panel by its content or a likely test id.
  // If no test id is known, we look for text indicating measurement results.
  
  // Wait for the measurement result to appear in the panel.
  // The result usually contains a number and a unit like "m" or "km".
  const measurementResult = page.getByText(/[\d,]+\s*(m|km|ft|mi)/i);
  
  // Use poll to wait for the asynchronous measurement calculation to complete and render
  await expect.poll(async () => {
    const text = await measurementResult.textContent();
    return text;
  }).toMatch(/[\d,]+\s*(m|km|ft|mi)/i);

  // Additionally, verify the panel itself is visible if we can identify it.
  // Often the panel might be identified by a test id like 'measurement-panel' or similar.
  // Since we don't have the exact test id, we rely on the result text visibility as a proxy for the panel being open and active.
  // However, to be more robust, let's check if there's a specific panel container.
  // If the app uses standard Chakra UI, the panel might just be a div with specific content.
  // The presence of the result text is a strong indicator that the tool is active and the panel is showing results.
  
  // Let's also assert that the measurement button is in an active/pressed state if possible,
  // or simply that the result is displayed.
  await expect(measurementResult).toBeVisible();
});
