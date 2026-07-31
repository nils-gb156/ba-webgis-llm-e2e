// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and interactive
  const mapCanvas = page.locator('canvas.ol-layer');
  await expect(mapCanvas).toBeVisible();

  // 1. The user clicks the 'Measurement' button in the toolbar to open the measurement panel.
  const measurementButton = page.getByRole('button', { name: 'Measurement' });
  await expect(measurementButton).toBeVisible();
  await measurementButton.click();

  // Verify the measurement panel is visible
  const measurementPanel = page.getByRole('region', { name: /measurement/i, includeHidden: true }).or(
    page.getByTestId('measurement-panel')
  );
  // Fallback: look for a panel that likely contains measurement results or is associated with the tool
  // Since we don't have exact test IDs, we look for the panel opening.
  // Often panels have a specific role or test id. Let's assume a generic panel container or wait for interaction capability.
  // A safer bet for "panel is visible" without specific ID is to check for the presence of the tool's UI elements.
  // However, the prompt says "measurement panel is visible". Let's try to find it by text or role if possible.
  // If no specific test ID, we might rely on the fact that clicking the button opens it.
  // Let's assume the panel has a test id or accessible name. If not, we check for the input field for coordinates or results.
  
  // Let's try to find the panel by a likely test id or role.
  const panel = page.getByTestId('measurement-panel').or(page.getByRole('dialog', { name: /measurement/i }));
  await expect(panel).toBeVisible();

  // 2. The user clicks several points on the map canvas to draw a line.
  // We need to click on the map canvas. We'll get the bounding box of the canvas and click at specific relative positions.
  const mapBox = await mapCanvas.boundingBox();
  if (!mapBox) {
    throw new Error('Map canvas not found or not visible');
  }

  // Click first point (center-left)
  const click1 = { x: mapBox.x + mapBox.width * 0.2, y: mapBox.y + mapBox.height * 0.5 };
  await page.mouse.click(click1.x, click1.y);

  // Click second point (center-right)
  const click2 = { x: mapBox.x + mapBox.width * 0.5, y: mapBox.y + mapBox.height * 0.5 };
  await page.mouse.click(click2.x, click2.y);

  // Click third point (bottom-right)
  const click3 = { x: mapBox.x + mapBox.width * 0.8, y: mapBox.y + mapBox.height * 0.8 };
  await page.mouse.click(click3.x, click3.y);

  // 3. The user double-clicks to finish the measurement.
  await page.mouse.dblclick(click3.x, click3.y);

  // Expected results:
  // - The measurement panel is visible. (Already checked above, but let's ensure it stays visible)
  await expect(panel).toBeVisible();

  // - The measurement panel displays a length value with a unit.
  // Look for text that resembles a measurement result, e.g., "123.45 m" or "km".
  // We'll poll for a pattern that looks like a number followed by a unit.
  await expect.poll(() => panel.getByText(/^[0-9.,]+ (m|km|mi|ft|in|cm)$/i).all()).toBeGreaterThan(0);
});
