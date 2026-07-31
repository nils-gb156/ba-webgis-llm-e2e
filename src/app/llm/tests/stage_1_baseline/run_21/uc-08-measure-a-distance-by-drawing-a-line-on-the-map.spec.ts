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
  // We assume the map container has a test id or can be located by role.
  // Using a generic canvas locator as a fallback if no specific test id is known,
  // but typically map containers have a test id. Let's try to find the map canvas.
  // If no test id is provided in the prompt for the map, we use getByRole('canvas') or similar.
  // However, OpenLayers maps often have a specific container. Let's assume a common test id or role.
  // Since no specific map test id is given, we'll try to locate the map area.
  // Often, the map is the main interactive element. Let's try to click on the map.
  // We need to ensure the map is ready.
  await page.waitForSelector('canvas', { state: 'attached' });
  
  // Get the bounding box of the map canvas to click on it.
  // Assuming there is only one main map canvas or we can identify it.
  // Let's try to find the map container. If it has a test id like 'map-container', we would use that.
  // Without specific test ids for the map, we might need to use a broader selector.
  // Let's assume the map is the large interactive element.
  // We will try to click on the center of the page, assuming the map is centered.
  // Or better, find the canvas element.
  const mapCanvas = page.locator('canvas').first();
  const box = await mapCanvas.boundingBox();
  
  if (box) {
    // Step 2a: Click first point
    await page.mouse.click(box.x + box.width / 3, box.y + box.height / 3);
    
    // Step 2b: Click second point
    await page.mouse.click(box.x + box.width * 2 / 3, box.y + box.height / 3);
    
    // Step 2c: Click third point to extend the line
    await page.mouse.click(box.x + box.width / 2, box.y + box.height * 2 / 3);
    
    // Step 3: Double-click to finish the measurement.
    await page.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2);
  } else {
    throw new Error('Map canvas not found');
  }

  // Expected result: The measurement panel displays a length value with a unit.
  // We poll for the measurement result to appear.
  const measurementResult = page.getByTestId('measurement-result');
  await expect.poll(async () => {
    const text = await measurementResult.textContent();
    return text;
  }).toMatch(/[\d.]+\s*(m|km|ft|mi)/i);
});
