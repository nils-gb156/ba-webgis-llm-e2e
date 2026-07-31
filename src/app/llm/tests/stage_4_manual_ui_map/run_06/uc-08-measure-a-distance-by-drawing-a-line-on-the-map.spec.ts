// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('UC8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: The user clicks the 'Measurement' button in the toolbar to open the measurement panel.
  const measurementToggle = page.getByTestId('measurement-toggle');
  await measurementToggle.click();

  // Verify measurement panel is visible
  const measurementPanel = page.getByTestId('measurement-panel');
  await expect(measurementPanel).toBeVisible();

  // Step 2 & 3: The user clicks several points on the map canvas to draw a line, then double-clicks to finish.
  // We need to click on the map container. Since the map is a canvas, we click specific coordinates.
  // We'll pick points roughly in the center and to the right to form a line.
  const mapContainer = page.getByTestId('map-container');
  const mapBox = await mapContainer.boundingBox();
  
  if (!mapBox) {
    throw new Error('Map container not found or has no bounding box');
  }

  // Calculate points relative to the viewport
  // Center point
  const centerX = mapBox.x + mapBox.width / 2;
  const centerY = mapBox.y + mapBox.height / 2;
  
  // Point to the right
  const pointX2 = mapBox.x + mapBox.width * 0.7;
  const pointY2 = mapBox.y + mapBox.height / 2;

  // Point further right and slightly up
  const pointX3 = mapBox.x + mapBox.width * 0.9;
  const pointY3 = mapBox.y + mapBox.height * 0.3;

  // Click first point
  await page.mouse.click(centerX, centerY);
  
  // Click second point
  await page.mouse.click(pointX2, pointY2);
  
  // Click third point
  await page.mouse.click(pointX3, pointY3);

  // Double-click to finish
  await page.mouse.dblclick(pointX3, pointY3);

  // Wait a bit for the measurement result to render
  await page.waitForTimeout(500);

  // Expected result: The measurement panel displays a length value with a unit.
  const measurementElement = page.getByTestId('measurement');
  await expect(measurementElement).toBeVisible();
  
  // Check that the measurement element contains text that looks like a number followed by a unit (e.g., "1.5 km", "123 m")
  const measurementText = await measurementElement.innerText();
  expect(measurementText).toMatch(/\d+(\.\d+)?\s*(mm|cm|m|km|in|ft|mi)/i);
});
