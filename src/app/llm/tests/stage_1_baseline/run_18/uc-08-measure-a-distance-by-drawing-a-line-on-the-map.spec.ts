// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready by checking for the canvas element
  const mapCanvas = page.locator('canvas');
  await expect(mapCanvas).toBeVisible();

  // Step 1: Click the 'Measurement' button in the toolbar to open the measurement panel.
  const measurementButton = page.getByRole('button', { name: 'Measurement' });
  await expect(measurementButton).toBeVisible();
  await measurementButton.click();

  // Verify the measurement panel is visible
  const measurementPanel = page.getByRole('dialog', { name: /Measurement/i });
  // The panel might be a specific div, try to find it by test id or role
  // Assuming standard ARIA dialog for panels or a specific container
  // If no dialog role, fallback to a visible container with measurement content
  const panel = page.locator('[data-testid="measurement-panel"]').or(page.getByRole('dialog', { name: /Measurement/i }));
  await expect(panel).toBeVisible();

  // Step 2: Click several points on the map canvas to draw a line.
  // We need to click on the map canvas. We'll use coordinates relative to the canvas.
  // First, get the bounding box of the canvas to determine click positions.
  const canvasBox = await mapCanvas.boundingBox();
  if (!canvasBox) {
    throw new Error('Map canvas not found or not visible');
  }

  // Calculate some points on the map. 
  // Let's draw a simple line across the center of the canvas.
  const startX = canvasBox.x + canvasBox.width * 0.2;
  const startY = canvasBox.y + canvasBox.height * 0.5;
  const endX = canvasBox.x + canvasBox.width * 0.8;
  const endY = canvasBox.y + canvasBox.height * 0.5;
  const midX = canvasBox.x + canvasBox.width * 0.5;
  const midY = canvasBox.y + canvasBox.height * 0.3;

  // Click first point
  await page.mouse.click(startX, startY);
  // Click second point (middle)
  await page.mouse.click(midX, midY);
  // Click third point (end)
  await page.mouse.click(endX, endY);

  // Step 3: Double-click to finish the measurement.
  await page.mouse.dblClick(endX, endY);

  // Expected results:
  // - The measurement panel is visible (already checked)
  // - The measurement panel displays a length value with a unit.
  
  // Wait for the measurement result to appear in the panel
  // The result might be in a specific element, often containing text like "Length" or a number with "m" or "km"
  const measurementResult = panel.locator('text=/\\d+\\.?\\d*\\s*(m|km|mi|ft)/i');
  await expect(measurementResult).toBeVisible();
});
