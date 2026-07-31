// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and interactive
  const mapCanvas = page.locator('canvas.ol-viewport');
  await expect(mapCanvas).toBeVisible();

  // Step 1: Click the 'Measurement' button in the toolbar to open the measurement panel.
  const measurementButton = page.getByRole('button', { name: 'Measurement' });
  await expect(measurementButton).toBeVisible();
  await measurementButton.click();

  // Wait for the measurement panel to become visible
  const measurementPanel = page.getByRole('dialog', { name: /Measurement/i }).or(
    page.getByTestId('measurement-panel')
  );
  // Fallback: look for a panel that appears after clicking measurement
  // Since we don't have exact test ids, we wait for the panel to appear.
  // We'll look for an element that indicates measurement mode is active or the panel is open.
  // Often this is a specific container or a change in the UI.
  // Let's assume there's a container with test id 'measurement-result' or similar appearing.
  // Or we can wait for the map to enter a state where it accepts clicks for measurement.
  
  // A robust way is to wait for the measurement panel to be visible.
  // If no specific role/name is available, we might need to wait for a specific UI change.
  // Let's try to find the panel by a common test id or a visible text.
  // Assuming the panel has a test id 'measurement-panel' based on common patterns.
  const panelLocator = page.getByTestId('measurement-panel');
  await expect(panelLocator).toBeVisible({ timeout: 10000 });

  // Step 2: Click several points on the map canvas to draw a line.
  // We need to click on the map canvas. We'll use the canvas locator.
  // Get the bounding box of the canvas to click on it.
  const canvasBox = await mapCanvas.boundingBox();
  if (!canvasBox) {
    throw new Error('Map canvas is not visible or has no bounding box');
  }

  // Click a few points to draw a line. 
  // Point 1
  await page.mouse.click(canvasBox.x + canvasBox.width / 2, canvasBox.y + canvasBox.height / 2);
  // Point 2
  await page.mouse.click(canvasBox.x + canvasBox.width / 3, canvasBox.y + canvasBox.height / 3);
  // Point 3
  await page.mouse.click(canvasBox.x + canvasBox.width * 0.7, canvasBox.y + canvasBox.height * 0.7);

  // Step 3: Double-click to finish the measurement.
  await page.mouse.dblclick(canvasBox.x + canvasBox.width / 2, canvasBox.y + canvasBox.height / 2);

  // Expected results:
  // - The measurement panel is visible. (Already asserted above, but we ensure it stays visible)
  await expect(panelLocator).toBeVisible();

  // - The measurement panel displays a length value with a unit.
  // We need to find the element displaying the result.
  // Let's look for a test id like 'measurement-result' or a specific text pattern.
  const resultLocator = page.getByTestId('measurement-result').or(
    page.getByText(/Length:/i).or(page.getByText(/Distance:/i))
  );
  
  // Wait for the result to appear in the panel
  await expect(resultLocator).toBeVisible({ timeout: 10000 });
  
  // Assert that the result contains a number and a unit (e.g., "100 m", "1.5 km")
  // We'll check the text content of the result locator or its parent.
  const resultText = await resultLocator.textContent();
  expect(resultText).toMatch(/\d+(\.\d+)?\s*(m|km|cm|mm|mi|ft)/i);
});
