// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Click the 'Measurement' button in the toolbar to open the measurement panel.
  // We look for a button with the text "Measurement" or a test id if available.
  // Assuming a test id for the measurement tool button exists, otherwise fallback to text.
  const measurementButton = page.getByRole('button', { name: 'Measurement' }).first();
  await measurementButton.click();

  // Verify the measurement panel is visible.
  // Assuming the panel has a test id or is identifiable by role/text.
  // Using a common pattern where panels might have a specific test id or role.
  // If no specific test id is known, we might look for a dialog or panel containing measurement info.
  // Let's assume the panel becomes visible and we can assert its presence.
  // Often, measurement panels are identified by a test id like 'measurement-panel' or similar.
  // Since we don't have the exact test ids, we'll try to find the panel by its content or role.
  // A robust way is to wait for the measurement result to appear, which implies the panel is visible.
  
  // Step 2 & 3: Draw a line and finish measurement.
  // We need to click on the map canvas. The map is an OpenLayers canvas.
  // We need to find the map container. Usually, it's a div with a specific class or test id.
  // Let's assume the map container has a test id 'map-container' or similar.
  // If not, we might look for a div that contains the canvas.
  // For the sake of this test, we'll try to locate the map canvas area.
  
  // Locate the map container. OpenLayers usually renders inside a div.
  // We'll try to find a div that looks like a map container.
  // If there's a test id for the map, use it. Otherwise, we might need to rely on the canvas element.
  // Let's assume we can click on the center of the visible map area.
  
  // Get the map container element.
  // Note: In many Open Pioneer apps, the map container might have a test id like 'ba-webgis-map'.
  // If not provided, we might have to guess or use a generic selector.
  // Let's try to find the canvas element directly as it's the interactive part.
  const mapCanvas = page.locator('canvas').first();
  
  // Get the bounding box of the map canvas to click within it.
  const box = await mapCanvas.boundingBox();
  if (!box) {
    throw new Error('Map canvas not found');
  }

  // Calculate center of the map canvas to click.
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  // Click several points to draw a line.
  // First point
  await page.mouse.click(centerX, centerY);
  
  // Move to a second point to create a line segment.
  // Let's move slightly to the right and down.
  const secondPointX = centerX + 100;
  const secondPointY = centerY + 100;
  await page.mouse.click(secondPointX, secondPointY);

  // Move to a third point.
  const thirdPointX = secondPointX + 100;
  const thirdPointY = secondPointY - 50;
  await page.mouse.click(thirdPointX, thirdPointY);

  // Double-click to finish the measurement.
  await page.mouse.dblClick(thirdPointX, thirdPointY);

  // Expected results:
  // - The measurement panel is visible.
  // - The measurement panel displays a length value with a unit.
  
  // Wait for the measurement result to appear.
  // The result might be displayed in a panel with a test id like 'measurement-result' or similar.
  // Or it might be text on the page.
  // Let's try to find an element that contains a number and a unit like 'm' or 'km'.
  // We'll use expect.poll to wait for the measurement result.
  
  // Assuming the measurement result is displayed in an element with a test id 'measurement-length'.
  // If not, we might look for any text that matches a pattern like "123.45 m".
  
  // Let's try to find the measurement result by looking for a pattern in the text content of the page.
  // This is a bit fragile, but without specific test ids, it's a reasonable fallback.
  // However, the instructions say to prefer getByTestId.
  // Let's assume there is a test id for the measurement result, e.g., 'measurement-result'.
  
  // We will poll for an element that contains a measurement value.
  // Let's try to find an element with a test id 'measurement-result' and check its text.
  const measurementResultLocator = page.getByTestId('measurement-result').first();
  
  // Poll for the measurement result to be visible and contain a length value.
  await expect.poll(async () => {
    const text = await measurementResultLocator.textContent();
    return text;
  }).toMatch(/[\d.,]+\s*(m|km|mi|ft)/i);

  // Alternatively, if 'measurement-result' is not the correct test id,
  // we might look for a panel that is now visible.
  // Let's also assert that the measurement panel is visible.
  // Assuming the panel has a test id 'measurement-panel'.
  const measurementPanel = page.getByTestId('measurement-panel').first();
  await expect(measurementPanel).toBeVisible();
});
